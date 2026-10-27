import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { scoringStatus } from "@/lib/domain/scoring";

// Reads shared by /judge, /judge/teams/[teamId] and the save-scores action.

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Every team in the event that submitted, in name order, with this judge's
 * status for each. Teams without a submission aren't scored (Decision 10).
 */
export async function judgeTeamsInEvent(judgeId: string, eventId: string, db: Db = prisma) {
  const [criteriaCount, teams] = await Promise.all([
    db.criterion.count({ where: { eventId } }),
    db.team.findMany({
      where: { eventId, submission: { isNot: null } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        submission: { select: { title: true } },
        _count: { select: { scores: { where: { judgeId, criterion: { eventId } } } } },
      },
    }),
  ]);
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    title: team.submission?.title ?? "",
    status: scoringStatus(team._count.scores, criteriaCount),
  }));
}
