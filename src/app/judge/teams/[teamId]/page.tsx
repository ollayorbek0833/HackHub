import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon, LockIcon } from "lucide-react";

import { formatDateTime } from "@/components/judging/format";
import { OnceToast } from "@/components/judging/once-toast";
import { ScoreForm } from "@/components/judging/score-form";
import { ScoringStatusBadge } from "@/components/judging/scoring-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/dal";
import { SCORING_MESSAGES, scoringBlockedReason, scoringStatus } from "@/lib/domain/scoring";
import { prisma } from "@/lib/prisma";
import { scoreFieldName } from "@/lib/validation/scoring";

import { saveScores } from "./actions";

export const metadata: Metadata = { title: "Score a team · HackHub" };

// docs/08 > /judge/teams/[teamId]. Every judge may score every submitted team
// (Decision 1). Rendered under judge/loading.tsx, so reading the session,
// params and the database here is fine (Cache Components).
export default async function ScoreTeamPage({ params }: PageProps<"/judge/teams/[teamId]">) {
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
      <Link
        href="/judge"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Judging
      </Link>

      <header className="mt-2">
        <p className="text-sm text-muted-foreground">{event.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold break-words">{team.name}</h1>
          <ScoringStatusBadge status={scoringStatus(scoredCount, criteria.length)} />
        </div>
        {!blocked && (
          // The description can be long: on phone, jump straight to the form.
          <a
            href="#scores"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 lg:hidden"
          >
            Go to the scoring form
          </a>
        )}
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <article className="min-w-0">
          <h2 className="text-xl font-semibold break-words">{submission.title}</h2>
          <Button asChild variant="outline" className="mt-3 h-11 md:h-9">
            <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer">
              Open the repository
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <p className="mt-4 text-sm leading-relaxed break-words whitespace-pre-line">
            {submission.description}
          </p>

          <h3 className="mt-6 font-semibold">Members</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {team.members.map(({ user }) => (
              <li key={user.id}>
                <Link
                  href={`/profile/${user.id}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {user.profile?.name.trim() || "No name yet"}
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <section
          id="scores"
          aria-labelledby="scores-heading"
          className="scroll-mt-24 rounded-2xl border bg-card p-4 text-card-foreground sm:p-6 lg:sticky lg:top-24"
        >
          <h2 id="scores-heading" className="text-lg font-semibold">
            Your scores
          </h2>
          <div className="mt-4">
            {blocked === null ? (
              <ScoreForm
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
            <div key={c.id} className="flex items-center justify-between gap-4 p-3 text-sm">
              <dt>{c.name}</dt>
              <dd className="tabular-nums">
                {c.value === null ? "Not scored" : `${c.value} / ${c.maxScore}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
