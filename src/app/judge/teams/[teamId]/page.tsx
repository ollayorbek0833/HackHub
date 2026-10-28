import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLinkIcon, LockIcon } from "lucide-react";

import { formatDateTime } from "@/components/judging/format";
import { JudgeQueue, QueueProgress } from "@/components/judging/judge-queue";
import { OnceToast } from "@/components/judging/once-toast";
import { Scorecard } from "@/components/judging/scorecard";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ScoringStatusBadge } from "@/components/judging/scoring-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/dal";
import { SCORING_MESSAGES, scoringBlockedReason, scoringStatus } from "@/lib/domain/scoring";
import { prisma } from "@/lib/prisma";
import { judgeTeamsInEvent } from "@/lib/queries/judging";
import { scoreFieldName } from "@/lib/validation/scoring";

import Loading from "../../loading";
import { saveScores } from "./actions";

export const metadata: Metadata = { title: "Score a team" };

// docs/08 > /judge/teams/[teamId], as the redesign's queue + scorecard: the
// event's queue on the left (desktop), the project and the scorecard on the
// right. On phones the queue lives on /judge; here a back link and "2 of 7"
// keep the place. Every judge may score every submitted team (Decision 1).
// params, the session and the database are read inside this page's own
// Suspense: judge/loading.tsx is already on screen when the judge moves to the
// next team in the queue, so it doesn't cover that navigation.
export default function ScoreTeamPage({ params }: PageProps<"/judge/teams/[teamId]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ScoreTeam params={params} />
    </Suspense>
  );
}

async function ScoreTeam({ params }: Pick<PageProps<"/judge/teams/[teamId]">, "params">) {
  const judge = await requireRole("JUDGE");
  const { teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      submission: { select: { title: true, description: true, repoUrl: true } },
      members: {
        orderBy: { joinedAt: "asc" },
        select: { user: { select: { id: true, profile: { select: { name: true } } } } },
      },
      event: {
        select: {
          id: true,
          name: true,
          submissionsOpen: true,
          resultsPublished: true,
          criteria: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { id: true, name: true, weightPercent: true, maxScore: true },
          },
        },
      },
      scores: {
        where: { judgeId: judge.id },
        select: { criterionId: true, value: true, updatedAt: true },
      },
    },
  });
  // Teams without a submission aren't scored: same as an unknown team.
  if (!team?.submission) notFound();

  const { event, submission } = team;
  const queue = await judgeTeamsInEvent(judge.id, event.id);
  const position = queue.findIndex((t) => t.id === team.id) + 1;

  const myScores = new Map(team.scores.map((s) => [s.criterionId, s]));
  const criteria = event.criteria.map((c) => ({
    ...c,
    field: scoreFieldName(c.id),
    value: myScores.get(c.id)?.value ?? null,
  }));
  const scoredCount = criteria.filter((c) => c.value !== null).length;
  const lastSavedAt = team.scores.reduce<Date | null>(
    (latest, s) => (!latest || s.updatedAt > latest ? s.updatedAt : latest),
    null,
  );
  const blocked = scoringBlockedReason({ ...event, criteriaCount: criteria.length });

  return (
    <>
      <OnceToast param="saved" message="Scores saved." />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-3">
            <div>
              <p className="font-semibold break-words">{event.name}</p>
              <QueueProgress teams={queue} />
            </div>
            <JudgeQueue teams={queue} currentId={team.id} label={`Teams to score in ${event.name}`} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* The queue is on /judge, the first crumb. */}
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Judging", href: "/judge" },
              { label: event.name },
              { label: team.name },
            ]}
          />

          <header>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-page-title break-words">{team.name}</h1>
              <ScoringStatusBadge status={scoringStatus(scoredCount, criteria.length)} />
              {/* Phones and tablets have no queue column: keep the place. */}
              <p className="text-sm text-muted-foreground lg:hidden">
                Team <span className="font-mono text-foreground tabular-nums">{position}</span> of{" "}
                <span className="font-mono text-foreground tabular-nums">{queue.length}</span>
              </p>
            </div>
          </header>

          <article aria-labelledby="project-heading" className="mt-6">
            <h2 id="project-heading" className="text-section-title break-words">
              {submission.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="h-11 md:h-9">
                <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer">
                  Open the repository
                  <ExternalLinkIcon aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
              {blocked === null && (
                <a
                  href="#scorecard"
                  className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 md:min-h-9"
                >
                  Skip to the scorecard
                </a>
              )}
            </div>
            <p className="mt-4 max-w-prose leading-relaxed break-words whitespace-pre-line">
              {submission.description}
            </p>
            <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Members</h3>
            <ul className="mt-1 flex flex-wrap gap-x-4 text-sm">
              {team.members.map(({ user }) => (
                <li key={user.id}>
                  <Link
                    href={`/profile/${user.id}`}
                    className="inline-flex min-h-11 items-center underline underline-offset-4 md:min-h-9"
                  >
                    {user.profile?.name.trim() || "No name yet"}
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <section
            id="scorecard"
            aria-labelledby="scorecard-heading"
            // The target of "Skip to the scorecard": focus lands here, so the
            // next Tab goes into the first criterion.
            tabIndex={-1}
            className="mt-8 scroll-mt-24 border-t pt-6 outline-none"
          >
            <h2 id="scorecard-heading" className="text-section-title">
              Your scores
            </h2>
            <div className="mt-4">
              {blocked === null ? (
                <Scorecard
                  action={saveScores.bind(null, team.id)}
                  criteria={criteria}
                  lastSaved={lastSavedAt ? formatDateTime(lastSavedAt) : null}
                />
              ) : (
                <ReadOnlyScores
                  reason={blocked}
                  eventId={event.id}
                  criteria={event.resultsPublished ? criteria : []}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/** The submissions-open, no-criteria and results-published states. */
function ReadOnlyScores({
  reason,
  eventId,
  criteria,
}: {
  reason: string;
  eventId: string;
  criteria: { id: string; name: string; maxScore: number; value: number | null }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <LockIcon aria-hidden />
        <AlertDescription>
          {reason}
          {reason === SCORING_MESSAGES.published && (
            <>
              {" "}
              <Link href={`/events/${eventId}`} className="font-medium underline">
                See the ranking
              </Link>
            </>
          )}
        </AlertDescription>
      </Alert>
      {criteria.length > 0 && (
        <dl className="flex flex-col divide-y rounded-xl border">
          {criteria.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
              <dt>{c.name}</dt>
              <dd className="font-mono tabular-nums">
                {c.value === null ? "Not scored" : `${c.value} / ${c.maxScore}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
