import type { Prisma } from "@/generated/prisma/client";
import { RuleError } from "@/lib/action-state";
import {
  CRITERIA_MESSAGES,
  isCriteriaLocked,
  validateCriteria,
  type CriteriaIssue,
  type CriterionInput,
} from "@/lib/domain/criteria";

// The body of the "Save criteria" transaction (docs/07 > Transactions), kept
// apart from the server action so a database test can run it against
// concurrent score saves.

/** validateCriteria said no; carries the issues out of the transaction. */
export class InvalidCriteria extends Error {
  constructor(readonly issues: CriteriaIssue[]) {
    super("Invalid criteria");
  }
}

/**
 * Replaces the event's criteria with `list`. Throws RuleError once any score
 * exists, InvalidCriteria when a rule fails. Run it inside
 * `prisma.$transaction`.
 */
export async function replaceCriteria(
  tx: Prisma.TransactionClient,
  eventId: string,
  list: CriterionInput[],
) {
  // Lock the event row first. Saving scores takes FOR SHARE on the same row,
  // so a judge's save either commits before this point (and the count below
  // sees it, so criteria are locked) or waits until the new list is in place.
  // Without the lock, a score saved between the count and deleteMany would be
  // deleted with its criterion (Score.criterion cascades).
  await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId} FOR UPDATE`;

  const scoreCount = await tx.score.count({ where: { criterion: { eventId } } });
  if (isCriteriaLocked(scoreCount)) throw new RuleError(CRITERIA_MESSAGES.locked);

  const issues = validateCriteria(list);
  if (issues.length > 0) throw new InvalidCriteria(issues);

  // Replace the list, so a half-saved total is never visible. createdAt is
  // spaced by a millisecond per row to keep the organizer's order.
  await tx.criterion.deleteMany({ where: { eventId } });
  const now = Date.now();
  await tx.criterion.createMany({
    data: list.map((criterion, i) => ({
      eventId,
      name: criterion.name,
      weightPercent: criterion.weightPercent,
      maxScore: criterion.maxScore,
      createdAt: new Date(now + i),
    })),
  });
}
