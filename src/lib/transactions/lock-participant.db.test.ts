import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { RuleError } from "@/lib/action-state";
import { NOT_A_PARTICIPANT } from "@/lib/domain/teams";

import { lockParticipant } from "./lock-participant";

// Runs against a real, migrated database, because the bug it guards against
// (bug 3, TC-125) is a race between a team join and a role change. CI has no
// database, so it is skipped unless TEST_DATABASE_URL is set, e.g.
//   TEST_DATABASE_URL="$DATABASE_URL" npx vitest run src/lib/transactions
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("lockParticipant against a concurrent role change", () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const tag = `role-race-${Date.now()}`;
  const ids = { event: "", team: "", organizer: "" };

  beforeAll(async () => {
    const organizer = await prisma.user.create({
      data: { email: `${tag}-organizer@test.invalid`, passwordHash: "x", role: "ORGANIZER" },
    });
    const event = await prisma.event.create({
      data: {
        name: tag,
        description: "race test",
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-01"),
        createdById: organizer.id,
      },
    });
    const team = await prisma.team.create({
      data: { eventId: event.id, name: tag, inviteCode: "RACE33", createdById: organizer.id },
    });
    Object.assign(ids, { event: event.id, team: team.id, organizer: organizer.id });
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: ids.event } });
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  /** A participant registered for the event, so they may join its team. */
  async function participant(name: string) {
    const user = await prisma.user.create({
      data: { email: `${tag}-${name}@test.invalid`, passwordHash: "x" },
      select: { id: true },
    });
    await prisma.eventRegistration.create({ data: { eventId: ids.event, userId: user.id } });
    return user;
  }

  /** Resolves once `fn` holds its lock; `release` lets its transaction commit. */
  function held<T>(fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>) {
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    let locked!: () => void;
    const lockTaken = new Promise<void>((resolve) => (locked = resolve));
    const done = prisma.$transaction(
      async (tx) => {
        const result = await fn(tx);
        locked();
        await released;
        return result;
      },
      { timeout: 15_000 },
    );
    return { done, lockTaken, release };
  }

  it("a join waits for a role change in progress, then refuses", async () => {
    const user = await participant("a");
    // setUserRole: FOR UPDATE on the user row, then the update, held open.
    const roleChange = held(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      await tx.user.update({ where: { id: user.id }, data: { role: "JUDGE" } });
    });
    await roleChange.lockTaken;

    const join = prisma.$transaction(
      async (tx) => {
        await lockParticipant(tx, user.id);
        await tx.teamMember.create({ data: { teamId: ids.team, eventId: ids.event, userId: user.id } });
      },
      { timeout: 15_000 },
    );
    // Give the join time to reach the lock, then let the role change commit.
    await new Promise((resolve) => setTimeout(resolve, 300));
    roleChange.release();
    await roleChange.done;

    await expect(join).rejects.toThrow(RuleError);
    await expect(join).rejects.toThrow(NOT_A_PARTICIPANT);
    expect(await prisma.teamMember.count({ where: { userId: user.id } })).toBe(0);
  }, 30_000);

  it("a role change waits for a join in progress, then sees the membership", async () => {
    const user = await participant("b");
    const join = held(async (tx) => {
      await lockParticipant(tx, user.id);
      await tx.teamMember.create({ data: { teamId: ids.team, eventId: ids.event, userId: user.id } });
    });
    await join.lockTaken;

    // setUserRole's reads: lock the row, then count the user's teams (Decision 11).
    const roleChange = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
        return tx.teamMember.count({ where: { userId: user.id } });
      },
      { timeout: 15_000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    join.release();
    await join.done;

    expect(await roleChange).toBe(1);
  }, 30_000);
});
