import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, GavelIcon, TrophyIcon } from "lucide-react";

import { OnceToast } from "@/components/judging/once-toast";
import { ScoringStatusBadge } from "@/components/judging/scoring-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireRole } from "@/lib/auth/dal";
import { SCORING_MESSAGES } from "@/lib/domain/scoring";
import { prisma } from "@/lib/prisma";
import { judgeTeamsInEvent } from "@/lib/queries/judging";

export const metadata: Metadata = { title: "Judging · HackHub" };

// docs/08 > /judge. Every judge judges every submitted team of every event in
// judging (Decision 1). Rendered under judge/loading.tsx, so reading the
// session, searchParams and the database here is fine (Cache Components).
export default async function JudgePage({ searchParams }: PageProps<"/judge">) {
  const judge = await requireRole("JUDGE");
  const { done } = await searchParams;

  // In judging: submissions closed, results not published, at least one submission.
  const [judging, published] = await Promise.all([
    prisma.event.findMany({
      where: {
        submissionsOpen: false,
        resultsPublished: false,
        teams: { some: { submission: { isNot: null } } },
      },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
      select: { id: true, name: true, _count: { select: { criteria: true } } },
    }),
    // Events this judge scored whose results are out.
    prisma.event.findMany({
      where: {
        resultsPublished: true,
        teams: { some: { scores: { some: { judgeId: judge.id } } } },
      },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const events = await Promise.all(
    judging.map(async (event) => ({
      ...event,
      criteriaCount: event._count.criteria,
      teams: await judgeTeamsInEvent(judge.id, event.id),
    })),
  );

  const doneEvent =
    typeof done === "string" ? await prisma.event.findUnique({ where: { id: done }, select: { name: true } }) : null;

  return (
    <>
      <OnceToast param="done" message={doneEvent ? SCORING_MESSAGES.allScored(doneEvent.name) : null} />
      <h1 className="text-3xl font-bold">Judging</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Score every team that submitted. You can change your scores until the
        organizer publishes the results.
      </p>

      {events.length === 0 ? (
        <Empty className="mt-8 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GavelIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Nothing to judge yet</EmptyTitle>
            <EmptyDescription>
              No events are being judged right now. Teams show up here once an
              organizer closes submissions.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {events.map((event) => {
            const scored = event.teams.filter((t) => t.status === "SCORED").length;
            const next = event.teams.find((t) => t.status !== "SCORED");
            return (
              <section
                key={event.id}
                aria-labelledby={`event-${event.id}`}
                className="rounded-2xl border bg-card p-4 text-card-foreground sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id={`event-${event.id}`} className="text-xl font-semibold break-words">
                      {event.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.criteriaCount === 1 ? "1 criterion" : `${event.criteriaCount} criteria`}
                      {" · "}
                      <span className="font-medium text-foreground">
                        {scored} of {event.teams.length} teams scored
                      </span>
                    </p>
                  </div>
                  {next && event.criteriaCount > 0 && (
                    <Button asChild className="h-11 self-start md:h-9">
                      <Link href={`/judge/teams/${next.id}`}>
                        Score next team: {next.name}
                        <ArrowRightIcon aria-hidden />
                      </Link>
                    </Button>
                  )}
                </div>

                {event.criteriaCount === 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      The organizer hasn&apos;t set the criteria yet. You can read
                      the projects, but not score them.
                    </AlertDescription>
                  </Alert>
                )}

                <ul className="mt-4 divide-y rounded-xl border">
                  {event.teams.map((team) => (
                    <li key={team.id}>
                      <Link
                        href={`/judge/teams/${team.id}`}
                        className="flex min-h-11 flex-col gap-2 p-4 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium break-words">{team.name}</span>
                          <span className="block text-sm break-words text-muted-foreground">
                            {team.title}
                          </span>
                        </span>
                        <ScoringStatusBadge status={team.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {published.length > 0 && (
        <section aria-labelledby="published-heading" className="mt-10">
          <h2 id="published-heading" className="text-xl font-semibold">
            Results published
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {published.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <TrophyIcon className="size-4" aria-hidden />
                  {event.name}: see the ranking
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
