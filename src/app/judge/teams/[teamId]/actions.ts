"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { RuleError, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth/dal";
import { canScore } from "@/lib/domain/event-state";
import {
  nextTeamToScore,
  planScoreChanges,
  SCORING_MESSAGES,
  scoringBlockedReason,
} from "@/lib/domain/scoring";
import { prisma } from "@/lib/prisma";
import { judgeTeamsInEvent } from "@/lib/queries/judging";
import { scoreFieldName, scoresFormInput, scoresFormSchema } from "@/lib/validation/scoring";

/** A score out of range; carries the field errors out of the transaction. */
class InvalidScores extends Error {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super("Invalid scores");
  }
}

/**
 * Saves this judge's scores for one team (docs/07 > Transactions > Save
 * scores, Decisions 1 and 2). The team id is bound by the page, but anyone can
 * call this with any id, so the role, the event state, the submission and the
 * criteria are all checked here. Every judge scores every submitted team, so
 * there is no assignment check.
 */
export async function saveScores(
  teamId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const judge = await requireRole("JUDGE");

  const parsed = scoresFormSchema.safeParse(scoresFormInput(formData));
  if (!parsed.success) {
    return { ok: false, formError: "Enter each score as a whole number." };
  }
  const { scores, intent } = parsed.data;
  // Typed values, for the inputs' defaultValue after a failure.
  const values = Object.fromEntries(
    Object.entries(scores).map(([id, value]) => [scoreFieldName(id), value]),
  );

  let event: { id: string; name: string } | null;
  try {
    event = await prisma.$transaction(async (tx) => {
      // Share-lock the event row, so publishing results (an UPDATE of it)
      // waits until these scores are saved, or happens first and is seen.
      await tx.$queryRaw`
        SELECT e.id FROM events e JOIN teams t ON t.event_id = e.id
        WHERE t.id = ${teamId} FOR SHARE OF e`;
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: {
          submission: { select: { id: true } },
          event: {
            select: {
              id: true,
              name: true,
              submissionsOpen: true,
              resultsPublished: true,
              criteria: { select: { id: true, maxScore: true } },
            },
          },
        },
      });
      if (!team) return null;
      if (!team.submission) throw new RuleError(SCORING_MESSAGES.noSubmission);

      const blocked = scoringBlockedReason({
        ...team.event,
        criteriaCount: team.event.criteria.length,
      });
      if (blocked || !canScore(team.event)) {
        throw new RuleError(blocked ?? SCORING_MESSAGES.published);
      }

      // Only this event's criteria may be scored.
      const known = new Set(team.event.criteria.map((c) => c.id));
      if (Object.keys(scores).some((id) => !known.has(id))) {
        throw new RuleError(SCORING_MESSAGES.unknownCriterion);
      }

      // A box submitted blank removes the score; a missing box keeps it.
      const { errors, upserts, deletes } = planScoreChanges(team.event.criteria, scores);
      if (Object.keys(errors).length > 0) {
        throw new InvalidScores(
          Object.fromEntries(
            Object.entries(errors).map(([id, message]) => [scoreFieldName(id), [message]]),
          ),
        );
      }

      for (const { criterionId, value } of upserts) {
        await tx.score.upsert({
          where: {
            judgeId_teamId_criterionId: { judgeId: judge.id, teamId, criterionId },
          },
          update: { value },
          create: { judgeId: judge.id, teamId, criterionId, value },
          select: { id: true },
        });
      }
      if (deletes.length > 0) {
        await tx.score.deleteMany({
          where: { judgeId: judge.id, teamId, criterionId: { in: deletes } },
        });
      }
      return { id: team.event.id, name: team.event.name };
    });
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, formError: e.message, values };
    if (e instanceof InvalidScores) return { ok: false, fieldErrors: e.fieldErrors, values };
    throw e;
  }
  // notFound() and redirect() throw, so they stay outside the try.
  if (!event) notFound();

  revalidatePath("/judge", "layout");

  if (intent === "next") {
    const teams = await judgeTeamsInEvent(judge.id, event.id);
    const next = nextTeamToScore(teams, teamId);
    if (next) redirect(`/judge/teams/${next.id}?saved=1`);
    redirect(`/judge?done=${encodeURIComponent(event.id)}`);
  }
  return { ok: true };
}
