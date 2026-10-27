import Link from "next/link";

import { EventSwitch } from "@/components/organizer/event-switch";
import { PublishResultsButton } from "@/components/organizer/publish-results-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import {
  criteriaStatus,
  publishBlocker,
  registrationBlocker,
  submissionsBlocker,
} from "@/lib/domain/event-switches";
import { prisma } from "@/lib/prisma";

import {
  publishResults,
  setRegistrationOpen,
  setSubmissionsOpen,
} from "./actions";

// The event overview (docs/08 > Event overview, O4, #12): where the event
// stands, and its three controls. The event layout shows the name, dates and
// status badges above it. The disabled reasons come from the same rules the
// actions check, so the page and the server can't disagree.

export default async function EventOverviewPage({
  params,
}: PageProps<"/organizer/events/[eventId]">) {
  await requireRole("ORGANIZER");
  const { eventId } = await params;
  const event = await requireEvent(eventId);
  const [registrations, teams, submissions, criteria, scoreCount] =
    await Promise.all([
      prisma.eventRegistration.count({ where: { eventId } }),
      prisma.team.count({ where: { eventId } }),
      prisma.submission.count({ where: { team: { eventId } } }),
      prisma.criterion.findMany({
        where: { eventId },
        select: { weightPercent: true },
      }),
      prisma.score.count({ where: { criterion: { eventId } } }),
    ]);

  const published = event.resultsPublished;
  const counts = [
    { label: "Registered participants", value: registrations },
    { label: "Teams", value: teams },
    { label: "Submissions", value: submissions },
  ];

  return (
    <div className="flex flex-col gap-6">
      {published && (
        <Alert>
          <AlertTitle>Results were published.</AlertTitle>
          <AlertDescription>
            <p>
              The ranking is on the{" "}
              <Link
                href={`/events/${eventId}`}
                className="text-foreground underline underline-offset-4"
              >
                public event page
              </Link>
              . Registration, submissions and scores can&apos;t change any
              more.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Criteria</dt>
          <dd className="mt-1 font-semibold">
            {criteriaStatus(criteria, scoreCount)}
          </dd>
          <dd className="mt-1">
            <Link
              href={`/organizer/events/${eventId}/criteria`}
              className="inline-flex min-h-11 items-center text-sm text-foreground underline underline-offset-4"
            >
              {published ? "View criteria" : "Edit criteria"}
            </Link>
          </dd>
        </div>
      </dl>

      <section
        aria-labelledby="event-controls"
        className="rounded-2xl border bg-card p-4 sm:p-6"
      >
        <h2 id="event-controls" className="text-2xl font-semibold">
          Event controls
        </h2>
        <div className="mt-4 flex flex-col gap-4">
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
                : submissionsBlocker(event, !event.submissionsOpen, scoreCount)
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
              eventName={event.name}
              rankingHref={`/organizer/events/${eventId}/ranking`}
              disabled={published}
              disabledReason={published ? null : publishBlocker(event, criteria)}
              action={publishResults.bind(null, eventId)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
