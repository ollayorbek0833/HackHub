import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, TrophyIcon } from "lucide-react";

import { EventAvatar } from "@/components/events/event-avatar";
import { EmptyState } from "@/components/feedback/empty-state";
import { OnceToast } from "@/components/judging/once-toast";
import { JudgeQueue, QueueProgress } from "@/components/judging/judge-queue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/dal";
import { SCORING_MESSAGES } from "@/lib/domain/scoring";
import { prisma } from "@/lib/prisma";
import { judgeTeamsInEvent } from "@/lib/queries/judging";
import { eventImageUrl } from "@/lib/uploads/url";

export const metadata: Metadata = { title: "Judging" };

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
      select: { id: true, name: true, logoPath: true, _count: { select: { criteria: true } } },
    }),
    // Events this judge scored whose results are out.
    prisma.event.findMany({
      where: {
        resultsPublished: true,
        teams: { some: { scores: { some: { judgeId: judge.id } } } },
      },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, logoPath: true },
    }),
  ]);

  const events = await Promise.all(
    judging.map(async (event) => ({
      ...event,
      criteriaCount: event._count.criteria,
      teams: await judgeTeamsInEvent(judge.id, event.id),
    })),
  );

  const firstWithWork = events.find(
    (e) => e.criteriaCount > 0 && e.teams.some((t) => t.status !== "SCORED"),
  )?.id;

  const doneEvent =
    typeof done === "string" ? await prisma.event.findUnique({ where: { id: done }, select: { name: true } }) : null;

  return (
    <>
      <OnceToast param="done" message={doneEvent ? SCORING_MESSAGES.allScored(doneEvent.name) : null} />
      <h1 className="text-page-title">Judging</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Score every team that submitted. You can change your scores until the
        organizer publishes the results.
      </p>

      {events.length === 0 ? (
        <EmptyState title="Nothing to judge yet" className="mt-8">
          Teams show up here once an organizer closes an event&apos;s submissions.
        </EmptyState>
      ) : (
        <div className="mt-6 flex flex-col gap-10">
          {events.map((event) => {
            const next = event.teams.find((t) => t.status !== "SCORED");
            const started = event.teams.some((t) => t.status !== "NOT_STARTED");
            // One amber action per view: only the first event with work left.
            const primary = event.id === firstWithWork;
            return (
              <section
                key={event.id}
                aria-labelledby={`event-${event.id}`}
                className="grid gap-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8"
              >
                <header className="flex flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <EventAvatar
                      name={event.name}
                      logoUrl={eventImageUrl(event.logoPath)}
                      size="sm"
                      className="ring-background"
                    />
                    <h2 id={`event-${event.id}`} className="min-w-0 text-section-title break-words">
                      {event.name}
                    </h2>
                  </div>
                  <QueueProgress teams={event.teams} className="text-base" />
                  <p className="text-sm text-muted-foreground">
                    {event.criteriaCount === 1 ? "1 criterion" : `${event.criteriaCount} criteria`}
                  </p>
                  {next && event.criteriaCount > 0 ? (
                    <Button
                      asChild
                      variant={primary ? "default" : "outline"}
                      className="h-11 self-start"
                    >
                      <Link href={`/judge/teams/${next.id}`}>
                        {started ? "Continue scoring" : "Start scoring"}
                        <ArrowRightIcon aria-hidden />
                      </Link>
                    </Button>
                  ) : event.criteriaCount > 0 ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <CheckIcon aria-hidden className="size-4 text-success" />
                      You&apos;ve scored every team.
                    </p>
                  ) : null}
                </header>

                <div className="flex min-w-0 flex-col gap-3">
                  {event.criteriaCount === 0 && (
                    <Alert>
                      <AlertDescription>
                        The organizer hasn&apos;t set the criteria yet. You can read
                        the projects, but not score them.
                      </AlertDescription>
                    </Alert>
                  )}
                  <JudgeQueue teams={event.teams} label={`Teams to score in ${event.name}`} />
                </div>
              </section>
            );
          })}
        </div>
      )}

      {published.length > 0 && (
        <section
          id="results"
          aria-labelledby="published-heading"
          className="mt-12 scroll-mt-24 border-t pt-8"
        >
          <h2 id="published-heading" className="text-section-title">
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
                  <EventAvatar
                    name={event.name}
                    logoUrl={eventImageUrl(event.logoPath)}
                    size="sm"
                    decorative
                    className="size-7 rounded-md text-xs ring-0"
                  />
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
