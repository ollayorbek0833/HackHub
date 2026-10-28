"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  fromZodError,
  isUniqueViolation,
  RuleError,
  type ActionState,
} from "@/lib/action-state";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import { generateInviteCode } from "@/lib/domain/invite-code";
import {
  ALREADY_ON_TEAM,
  CANT_LEAVE_SUBMITTED,
  canLeave,
  joinRefusal,
  NOT_REGISTERED,
} from "@/lib/domain/teams";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { lockParticipant } from "@/lib/transactions/lock-participant";
import { createTeamSchema, joinTeamSchema } from "@/lib/validation/teams";

// Create, join and leave a team (docs/07 > Transactions, docs/08 > My team).
// Server actions are public endpoints: each one checks the role, the event,
// the registration and the team rules itself, inside a transaction. Create and
// join re-check the role there too, under a lock on the user row.

const NAME_TAKEN = "A team with this name already exists in this event.";
const UNKNOWN_CODE =
  "No team in this event has this code. Check it with your team.";
const NOT_ON_TEAM = "You're not on a team in this event.";

/** Tries to create a team before giving up on invite-code collisions. */
const INVITE_CODE_ATTEMPTS = 3;

type Tx = Prisma.TransactionClient;

/** The team name is taken in this event: a field error, not a form error. */
class NameTaken extends Error {}

/** Locks the team row until the transaction ends (two people, one last place). */
async function lockTeam(tx: Tx, teamId: string) {
  await tx.$queryRaw`SELECT id FROM teams WHERE id = ${teamId} FOR UPDATE`;
}

async function isRegistered(tx: Tx, eventId: string, userId: string) {
  const row = await tx.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });
  return row !== null;
}

async function membershipOf(tx: Tx, eventId: string, userId: string) {
  return tx.teamMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { teamId: true },
  });
}

function revalidateTeamPages(eventId: string) {
  revalidatePath(`/events/${eventId}/team`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my-events");
}

export async function createTeam(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("PARTICIPANT");
  const event = await requireEvent(eventId);

  const values = { name: String(formData.get("name") ?? "") };
  const parsed = createTeamSchema.safeParse(values);
  if (!parsed.success) {
    return { ...fromZodError(parsed.error), values } as ActionState;
  }
  const { name } = parsed.data;

  for (let attempt = 1; attempt <= INVITE_CODE_ATTEMPTS; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        await lockParticipant(tx, user.id);
        if (!(await isRegistered(tx, event.id, user.id))) {
          throw new RuleError(NOT_REGISTERED);
        }
        if (await membershipOf(tx, event.id, user.id)) {
          throw new RuleError(ALREADY_ON_TEAM);
        }
        const taken = await tx.team.findUnique({
          where: { eventId_name: { eventId: event.id, name } },
          select: { id: true },
        });
        if (taken) throw new NameTaken();

        const team = await tx.team.create({
          data: {
            eventId: event.id,
            name,
            inviteCode: generateInviteCode(randomInt),
            createdById: user.id,
          },
          select: { id: true },
        });
        // Scalar ids, not nested connect: these columns are shared by two
        // composite foreign keys (docs/07 > Prisma schema v1).
        await tx.teamMember.create({
          data: { teamId: team.id, eventId: event.id, userId: user.id },
        });
      });
      revalidateTeamPages(event.id);
      return { ok: true, message: "Team created." };
    } catch (e) {
      if (e instanceof NameTaken) {
        return { ok: false, fieldErrors: { name: [NAME_TAKEN] }, values };
      }
      if (e instanceof RuleError) {
        return { ok: false, formError: e.message, values };
      }
      if (!isUniqueViolation(e)) throw e;

      // A unique index refused the write. Work out which one, then retry
      // only for an invite-code collision.
      const [member, taken] = await Promise.all([
        prisma.teamMember.findUnique({
          where: { eventId_userId: { eventId: event.id, userId: user.id } },
          select: { id: true },
        }),
        prisma.team.findUnique({
          where: { eventId_name: { eventId: event.id, name } },
          select: { id: true },
        }),
      ]);
      if (member) return { ok: false, formError: ALREADY_ON_TEAM, values };
      if (taken) {
        return { ok: false, fieldErrors: { name: [NAME_TAKEN] }, values };
      }
      // Otherwise the invite code was taken: loop and try a new one.
    }
  }
  // Three collisions in a row out of ~10^9 codes: treat it as a real error.
  throw new Error("Could not generate a unique invite code.");
}

export async function joinTeam(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("PARTICIPANT");
  const event = await requireEvent(eventId);

  const values = { code: String(formData.get("code") ?? "") };
  const parsed = joinTeamSchema.safeParse(values);
  if (!parsed.success) {
    return { ...fromZodError(parsed.error), values } as ActionState;
  }
  const { code } = parsed.data;

  try {
    const teamName = await prisma.$transaction(async (tx) => {
      await lockParticipant(tx, user.id);
      const found = await tx.team.findUnique({
        where: { inviteCode: code },
        select: { id: true, eventId: true },
      });
      // Codes are unique across events; a code from another event is unknown here.
      if (!found || found.eventId !== event.id) {
        throw new RuleError(UNKNOWN_CODE);
      }

      await lockTeam(tx, found.id);
      const [registered, membership, team] = await Promise.all([
        isRegistered(tx, event.id, user.id),
        membershipOf(tx, event.id, user.id),
        tx.team.findUniqueOrThrow({
          where: { id: found.id },
          select: {
            name: true,
            _count: { select: { members: true } },
            submission: { select: { id: true } },
          },
        }),
      ]);

      const refusal = joinRefusal({
        registered,
        alreadyOnTeam: membership !== null,
        memberCount: team._count.members,
        maxTeamSize: event.maxTeamSize,
        submitted: team.submission !== null,
      });
      if (refusal) throw new RuleError(refusal);

      await tx.teamMember.create({
        data: { teamId: found.id, eventId: event.id, userId: user.id },
      });
      return team.name;
    });
    revalidateTeamPages(event.id);
    return { ok: true, message: `You joined ${teamName}.` };
  } catch (e) {
    if (e instanceof RuleError) {
      // A wrong code belongs to the code field; the other rules to the form.
      return e.message === UNKNOWN_CODE
        ? { ok: false, fieldErrors: { code: [e.message] }, values }
        : { ok: false, formError: e.message, values };
    }
    // Two joins from the same participant at once: the unique index wins.
    if (isUniqueViolation(e)) {
      return { ok: false, formError: ALREADY_ON_TEAM, values };
    }
    throw e;
  }
}

export async function leaveTeam(
  eventId: string,
  // The shape every action has (docs/07); the leave form sends no fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("PARTICIPANT");
  const event = await requireEvent(eventId);

  try {
    const teamName = await prisma.$transaction(async (tx) => {
      const membership = await membershipOf(tx, event.id, user.id);
      if (!membership) throw new RuleError(NOT_ON_TEAM);

      await lockTeam(tx, membership.teamId);
      const team = await tx.team.findUniqueOrThrow({
        where: { id: membership.teamId },
        select: { name: true, submission: { select: { id: true } } },
      });
      if (!canLeave({ submitted: team.submission !== null })) {
        throw new RuleError(CANT_LEAVE_SUBMITTED);
      }

      await tx.teamMember.delete({
        where: { eventId_userId: { eventId: event.id, userId: user.id } },
      });
      // The last member out deletes the team (Decision 9).
      const left = await tx.teamMember.count({
        where: { teamId: membership.teamId },
      });
      if (left === 0) {
        await tx.team.delete({ where: { id: membership.teamId } });
      }
      return team.name;
    });
    revalidateTeamPages(event.id);
    return { ok: true, message: `You left ${teamName}.` };
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, formError: e.message };
    throw e;
  }
}
