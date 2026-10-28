import type { Prisma } from "@/generated/prisma/client";
import { RuleError } from "@/lib/action-state";
import { NOT_A_PARTICIPANT } from "@/lib/domain/teams";

// The first step of the "Create team" and "Join team" transactions (docs/07 >
// Transactions), kept apart from the server actions so a database test can
// run it against a concurrent role change.

/**
 * Share-locks the user row and re-reads the role inside the transaction.
 * Changing a role takes FOR UPDATE on the same row, so it either commits
 * first (and this refuses: the user is a judge now) or waits until the team
 * write is in, and then refuses because the user is on a team (Decision 11).
 * Without it, a join that started just before the change could still commit
 * and leave a judge on a team (bug 3).
 */
export async function lockParticipant(tx: Prisma.TransactionClient, userId: string) {
  const [row] = await tx.$queryRaw<{ role: string }[]>`
    SELECT role::text AS role FROM users WHERE id = ${userId} FOR SHARE`;
  if (row?.role !== "PARTICIPANT") throw new RuleError(NOT_A_PARTICIPANT);
}
