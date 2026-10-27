import Link from "next/link";
import { Suspense } from "react";
import { CheckIcon, ChevronDownIcon, CircleIcon } from "lucide-react";

import { EventSwitch } from "@/components/organizer/event-switch";
import { NextStepCard } from "@/components/organizer/next-step-card";
import { PublishResultsButton } from "@/components/organizer/publish-results-button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import {
  eventPhase,
  nextStep,
  PHASE_HELP,
  PHASE_LABEL,
  readinessChecks,
  type EventProgress,
} from "@/lib/domain/event-readiness";
import {
  criteriaStatus,
  publishBlocker,
  registrationBlocker,
  submissionsBlocker,
} from "@/lib/domain/event-switches";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

import {
  publishResults,
  setRegistrationOpen,
  setSubmissionsOpen,
} from "./actions";

// The event overview as a command centre (docs/08 > Event overview, O4, #12;
// redesign 28 Oct): the phase, the numbers, a readiness list and the one next
// step. The switches are still here as "Manual controls". Every change goes
// through the same actions as before, and the disabled reasons come from the
// same rules the actions check, so the page and the server can't disagree.

export default function EventOverviewPage({
  params,
}: PageProps<"/organizer/events/[eventId]">) {
  return (
    // params, the session and the database are read inside this page's own
    // Suspense: the layout's loading.tsx doesn't cover a sub-nav navigation.
    <Suspense fallback={<CommandCentreSkeleton />}>
      <CommandCentre params={params} />
    </Suspense>
  );
}

async function CommandCentre({
  params,
}: Pick<PageProps<"/organizer/events/[eventId]">, "params">) {
  await requireRole("ORGANIZER");
  const { eventId } = await params;
  const event = await requireEvent(eventId);
  const [registrations, teams, submissions, criteria, scoreCount, cards] =
    await Promise.all([
      prisma.eventRegistration.count({ where: { eventId } }),
      prisma.team.count({ where: { eventId } }),
      prisma.submission.count({ where: { team: { eventId } } }),
      prisma.criterion.findMany({
        where: { eventId },
        select: { weightPercent: true },
      }),
      prisma.score.count({ where: { criterion: { eventId } } }),
      // One row per judge and submitted team: how many criteria that judge scored.
      prisma.score.groupBy({
        by: ["teamId", "judgeId"],
        where: { team: { eventId, submission: { isNot: null } } },
        _count: { _all: true },
      }),
    ]);

  // A team counts as scored once a judge has scored it on every criterion.
  const scoredTeams =
    criteria.length === 0
      ? 0
      : new Set(
          cards
            .filter((card) => card._count._all >= criteria.length)
            .map((card) => card.teamId),
        ).size;

  const progress: EventProgress = {
    ...event,
    registrations,
    teams,
    submissions,
    scoredTeams,
    scoreCount,
    criteria,
  };
  const phase = eventPhase(progress);
  const step = nextStep(progress, event.name);
  const checks = readinessChecks(progress);
  const published = event.resultsPublished;
  const base = `/organizer/events/${eventId}`;

  const stats = [
    { label: "Registered", value: String(registrations) },
    { label: "Teams", value: String(teams) },
    { label: "Submissions", value: String(submissions) },
    {
      label: "Scored",
      value: submissions === 0 ? "0" : `${scoredTeams} of ${submissions}`,
    },
  ];

  const run =
    step.kind === "openRegistration"
      ? { action: setRegistrationOpen.bind(null, eventId), open: true }
      : step.kind === "openSubmissions"
        ? { action: setSubmissionsOpen.bind(null, eventId), open: true }
        : step.kind === "closeSubmissions"
          ? { action: setSubmissionsOpen.bind(null, eventId), open: false }
          : step.kind === "publishResults"
            ? { action: publishResults.bind(null, eventId) }
            : undefined;
  const href =
    step.kind === "setCriteria"
      ? `${base}/criteria`
      : step.kind === "viewResults"
        ? `/events/${eventId}`
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-muted-foreground">Phase</span>
        <span className="text-lg font-semibold">{PHASE_LABEL[phase]}</span>
        <span className="text-sm text-muted-foreground">
          {PHASE_HELP[phase]}
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        {/* On a phone the next step comes first: it's the one thing to do. */}
        <div className="lg:sticky lg:top-6 lg:order-2">
          <NextStepCard
            step={step}
            run={run}
            href={href}
            rankingHref={`${base}/ranking`}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:order-1">
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border bg-card sm:grid-cols-4">
            {stats.map(({ label, value }, i) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col gap-1 p-4",
                  i % 2 === 1 && "border-l",
                  i >= 2 && "border-t sm:border-t-0",
                  i === 2 && "sm:border-l",
                )}
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-mono text-2xl font-semibold tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="readiness" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="readiness" className="text-xl font-semibold">
                Readiness
              </h2>
              <p className="text-sm text-muted-foreground">
                {checks.filter((c) => c.done).length} of {checks.length} done
              </p>
            </div>
            <ul className="divide-y rounded-2xl border bg-card">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex min-h-12 items-center gap-3 px-4 py-2"
                >
                  {check.done ? (
                    <CheckIcon
                      className="size-4 shrink-0 text-foreground"
                      aria-hidden
                    />
                  ) : (
                    <CircleIcon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      !check.done && "text-muted-foreground",
                    )}
                  >
                    <span className="sr-only">
                      {check.done ? "Done: " : "To do: "}
                    </span>
                    {check.label}
                  </span>
                  {!check.done && check.fix && !published && (
                    <Link
                      href={`${base}/${check.fix}`}
                      className="inline-flex min-h-11 items-center rounded-md px-1 text-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9"
                    >
                      {check.fix === "criteria"
                        ? "Set criteria"
                        : check.fix === "ranking"
                          ? "Ranking preview"
                          : "Participants"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Criteria: {criteriaStatus(criteria, scoreCount)}.{" "}
              <Link
                href={`${base}/criteria`}
                className="text-foreground underline underline-offset-4"
              >
                {published ? "View criteria" : "Edit criteria"}
              </Link>
            </p>
          </section>

          <details className="group rounded-2xl border bg-card">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-col py-2">
                <span className="font-semibold">Manual controls</span>
                <span className="text-sm text-muted-foreground">
                  Open or close registration and submissions yourself.
                </span>
              </span>
              <ChevronDownIcon
                className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="flex flex-col gap-4 border-t p-4 sm:p-6">
              <EventSwitch
                label="Registration"
                help="While it's open, the event is listed on Events and participants can register."
                checked={event.registrationOpen}
                disabled={published}
                disabledReason={published ? null : registrationBlocker(event)}
                action={setRegistrationOpen.bind(null, eventId)}
              />
              <Separator />
              <EventSwitch
                label="Submissions"
                help="While it's open, teams can submit and edit. Judges score once it's closed."
                checked={event.submissionsOpen}
                disabled={published}
                disabledReason={
                  published
                    ? null
                    : submissionsBlocker(
                        event,
                        !event.submissionsOpen,
                        scoreCount,
                      )
                }
                action={setSubmissionsOpen.bind(null, eventId)}
                confirmOff={{
                  title: "Close submissions?",
                  description:
                    "Teams can't submit or edit, and judges can start scoring.",
                  confirm: "Close submissions",
                }}
              />
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex min-h-11 items-center justify-between gap-4">
                  <h3 className="text-base font-medium">Results</h3>
                  <span className="text-sm text-muted-foreground">
                    {published ? "Published" : "Not published"}
                  </span>
                </div>
                <PublishResultsButton
                  variant="outline"
                  eventName={event.name}
                  rankingHref={`${base}/ranking`}
                  disabled={published}
                  disabledReason={
                    published ? null : publishBlocker(event, criteria)
                  }
                  action={publishResults.bind(null, eventId)}
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function CommandCentreSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-7 w-72" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Skeleton className="h-44 rounded-2xl lg:order-2" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
