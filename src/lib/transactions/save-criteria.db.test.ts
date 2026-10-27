import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { RuleError } from "@/lib/action-state";
import { CRITERIA_MESSAGES } from "@/lib/domain/criteria";

import { replaceCriteria } from "./save-criteria";

// Runs against a real, migrated database, because the bug it guards against
// is a race between two transactions. CI has no database, so it is skipped
// unless TEST_DATABASE_URL is set, e.g.
//   TEST_DATABASE_URL="$DATABASE_URL" npx vitest run src/lib/transactions
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("replaceCriteria against a concurrent score save", () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const tag = `race-${Date.now()}`;
  const ids = { event: "", judge: "", organizer: "", participant: "", team: "", criterion: "" };

  beforeAll(async () => {
    const [organizer, judge, participant] = await Promise.all(
      (["ORGANIZER", "JUDGE", "PARTICIPANT"] as const).map((role) =>
        prisma.user.create({
          data: { email: `${tag}-${role.toLowerCase()}@test.invalid`, passwordHash: "x", role },
        }),
      ),
    );
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
      data: { eventId: event.id, name: tag, inviteCode: "RACE22", createdById: participant.id },
    });
    const criterion = await prisma.criterion.create({
      data: { eventId: event.id, name: "Innovation", weightPercent: 100, maxScore: 10 },
    });
    Object.assign(ids, {
      event: event.id,
      judge: judge.id,
      organizer: organizer.id,
      participant: participant.id,
      team: team.id,
      criterion: criterion.id,
    });
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: ids.event } });
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    await prisma.$disconnect();
  });

  it("waits for a score save in progress, then refuses because criteria are locked", async () => {
    let releaseScore!: () => void;
    const scoreHeld = new Promise<void>((resolve) => (releaseScore = resolve));
    let scoreLocked!: () => void;
    const lockTaken = new Promise<void>((resolve) => (scoreLocked = resolve));

    // A judge's save: share-locks the event row (as saveScores does), writes a
    // score and holds the transaction open until released.
    const scoreSave = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM events WHERE id = ${ids.event} FOR SHARE`;
        await tx.score.create({
          data: { judgeId: ids.judge, teamId: ids.team, criterionId: ids.criterion, value: 7 },
        });
        scoreLocked();
        await scoreHeld;
      },
      { timeout: 15_000 },
    );

    await lockTaken;
    const criteriaSave = prisma.$transaction(
      (tx) =>
        replaceCriteria(tx, ids.event, [{ name: "Design", weightPercent: 100, maxScore: 5 }]),
      { timeout: 15_000 },
    );
    // Give the criteria save time to reach the lock, then let the score commit.
    await new Promise((resolve) => setTimeout(resolve, 300));
    releaseScore();
    await scoreSave;

    await expect(criteriaSave).rejects.toThrow(RuleError);
    await expect(criteriaSave).rejects.toThrow(CRITERIA_MESSAGES.locked);
    expect(await prisma.score.count({ where: { teamId: ids.team } })).toBe(1);
    expect(
      await prisma.criterion.findMany({ where: { eventId: ids.event }, select: { name: true } }),
    ).toEqual([{ name: "Innovation" }]);
  }, 30_000);
});
