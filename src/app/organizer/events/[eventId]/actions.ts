"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { type ActionState, RuleError } from "@/lib/action-state";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import {
  publishBlocker,
  registrationBlocker,
  submissionsBlocker,
} from "@/lib/domain/event-switches";
import { prisma } from "@/lib/prisma";
import { eventSwitchSchema } from "@/lib/validation/event-switch";

// The event overview's switches and "Publish results" (docs/08 > Event
// overview, docs/02 > Publishing, Decisions 2 and 3). Every action authorizes
// itself, then re-reads the event inside a transaction that holds its row
// lock, so two organizers (or an organizer and the ranking page) can't
// interleave a reopen and a publish.
//
// Bind the event id in front: `publishResults.bind(null, eventId)`. The
// ranking preview imports publishResults from here.

const UPDATE_FAILED = "Couldn't update the event. Try again.";

/** Opens or closes registration. Opening it lists the event on /events (Decision 5). */
export async function setRegistrationOpen(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ORGANIZER");
  await requireEvent(eventId);
  const parsed = eventSwitchSchema.safeParse({ open: formData.get("open") });
  if (!parsed.success) return { ok: false, formError: UPDATE_FAILED };
  const { open } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const event = await lockEvent(tx, eventId);
      const refused = registrationBlocker(event);
      if (refused) throw new RuleError(refused);
      await tx.event.update({
        where: { id: eventId },
        data: { registrationOpen: open },
      });
    });
  } catch (e) {
    return failed(e, eventId);
  }

  revalidateEvent(eventId);
  return {
    ok: true,
    message: open ? "Registration opened." : "Registration closed.",
  };
}

/** Opens or closes submissions. They can't reopen once any score exists for the event. */
export async function setSubmissionsOpen(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ORGANIZER");
  await requireEvent(eventId);
  const parsed = eventSwitchSchema.safeParse({ open: formData.get("open") });
  if (!parsed.success) return { ok: false, formError: UPDATE_FAILED };
  const { open } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const event = await lockEvent(tx, eventId);
      const scoreCount = await tx.score.count({
        where: { criterion: { eventId } },
      });
      const refused = submissionsBlocker(event, open, scoreCount);
      if (refused) throw new RuleError(refused);
      await tx.event.update({
        where: { id: eventId },
        data: { submissionsOpen: open },
      });
    });
  } catch (e) {
    return failed(e, eventId);
  }

  revalidateEvent(eventId);
  return {
    ok: true,
    message: open ? "Submissions opened." : "Submissions closed.",
  };
}

/**
 * Publishes the results: the ranking shows on the public event page, scores
 * lock and every switch is disabled (Decision 3). Needs submissions closed and
 * the criteria set. It can't be undone. It reads no form fields, so the bound
 * action fits `useActionState` without taking `(prev, formData)`.
 */
export async function publishResults(eventId: string): Promise<ActionState> {
  await requireRole("ORGANIZER");
  await requireEvent(eventId);

  try {
    await prisma.$transaction(async (tx) => {
      const event = await lockEvent(tx, eventId);
      const criteria = await tx.criterion.findMany({
        where: { eventId },
        select: { weightPercent: true },
      });
      const refused = publishBlocker(event, criteria);
      if (refused) throw new RuleError(refused);
      await tx.event.update({
        where: { id: eventId },
        data: { resultsPublished: true },
      });
    });
  } catch (e) {
    return failed(e, eventId);
  }

  revalidateEvent(eventId);
  return { ok: true, message: "Results published." };
}

/** Locks the event row for the rest of the transaction and reads its switches. */
async function lockEvent(tx: Prisma.TransactionClient, eventId: string) {
  await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId} FOR UPDATE`;
  return tx.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      registrationOpen: true,
      submissionsOpen: true,
      resultsPublished: true,
    },
  });
}

/**
 * A rule's refusal is shown as is, and the page refreshes: it was showing a
 * state the server no longer has. Anything else is logged and shown as the UI
 * spec's retry message.
 */
function failed(e: unknown, eventId: string): ActionState {
  if (e instanceof RuleError) {
    revalidateEvent(eventId);
    return { ok: false, formError: e.message };
  }
  console.error(e);
  return { ok: false, formError: UPDATE_FAILED };
}

/** The badges in the event layout and every organizer sub-page read the switches. */
function revalidateEvent(eventId: string) {
  revalidatePath(`/organizer/events/${eventId}`, "layout");
}
