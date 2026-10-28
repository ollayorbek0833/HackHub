import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";

import { EventCardMedia } from "@/components/events/event-card-media";
import { formatDateRange } from "@/components/organizer/event-dates";
import { EventStatusBadges } from "@/components/organizer/event-status-badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { EventStatusTabs } from "@/components/organizer/event-status-tabs";
import { requireRole } from "@/lib/auth/dal";
import {
  compareByStatus,
  eventStatus,
  parseStatusFilter,
  STATUS_TABS,
  type EventStatus,
  type StatusFilter,
} from "@/lib/domain/event-status";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";

// docs/08 > /organizer "Events I run": the events this organizer created,
// with their state at a glance, filtered by the tabs All / Live / Upcoming /
// Judging / Finished (?status=, server-side). Access matches the list: every
// page and action under /organizer/events/[eventId] calls requireOwnedEvent,
// so another organizer's event is not found. The title and primary action are
// static; searchParams and the list are read inside Suspense (Cache
// Components).

export default function OrganizerHomePage({
  searchParams,
}: PageProps<"/organizer">) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-page-title">Events I run</h1>
        <NewEventButton />
      </div>
      <Suspense fallback={<EventListSkeleton />}>
        <EventList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// One sentence and one action per empty tab (redesign > Empty states). The
// action is never amber: "New event" in the header is the page's one primary.
const EMPTY: Record<
  EventStatus,
  { title: string; text: string; action: { label: string; href: string } }
> = {
  live: {
    title: "No live events.",
    text: "Open registration on an upcoming event to make it live.",
    action: {
      label: "See upcoming events",
      href: "/organizer?status=upcoming",
    },
  },
  upcoming: {
    title: "No upcoming events.",
    text: "Events you create stay here until you open registration.",
    action: { label: "Create an event", href: "/organizer/events/new" },
  },
  judging: {
    title: "No events in judging.",
    text: "An event moves here when you close submissions after teams have submitted.",
    action: { label: "See live events", href: "/organizer?status=live" },
  },
  finished: {
    title: "No finished events yet.",
    text: "Events move here once their results are published, or when their dates pass without opening.",
    action: {
      label: "See events in judging",
      href: "/organizer?status=judging",
    },
  },
};

async function EventList({
  searchParams,
}: Pick<PageProps<"/organizer">, "searchParams">) {
  const user = await requireRole("ORGANIZER");
  const filter = parseStatusFilter((await searchParams).status);

  const [events, submitted] = await Promise.all([
    prisma.event.findMany({
      where: { createdById: user.id },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        submissionsOpen: true,
        resultsPublished: true,
        logoPath: true,
        bannerPath: true,
        _count: { select: { registrations: true, teams: true } },
      },
    }),
    // Submissions per event of this organizer: one row per team that has
    // submitted.
    prisma.team.groupBy({
      by: ["eventId"],
      where: {
        submission: { isNot: null },
        event: { createdById: user.id },
      },
      _count: { _all: true },
    }),
  ]);
  const submissionsByEvent = new Map(
    submitted.map((row) => [row.eventId, row._count._all]),
  );

  // Each event's group, from the same query: whether any team submitted
  // tells judging from not open yet (event-status.ts).
  const now = new Date();
  const classified = events
    .map((event) => ({
      ...event,
      status: eventStatus(
        {
          ...event,
          hasSubmissions: (submissionsByEvent.get(event.id) ?? 0) > 0,
        },
        now,
      ),
    }))
    .sort(compareByStatus);
  const count = (status: StatusFilter) =>
    status === "all"
      ? classified.length
      : classified.filter((e) => e.status === status).length;
  const shown =
    filter === "all"
      ? classified
      : classified.filter((e) => e.status === filter);

  if (events.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title="No events yet."
        action={<NewEventButton />}
      >
        Create the first one. It stays hidden from participants until you open
        registration.
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <EventStatusTabs
        current={filter}
        tabs={STATUS_TABS.map((tab) => ({ ...tab, count: count(tab.value) }))}
      />
      {shown.length === 0 && filter !== "all" ? (
        <EmptyState
          title={EMPTY[filter].title}
          action={
            <Button asChild variant="outline" className="h-11 px-4 md:h-9">
              <Link href={EMPTY[filter].action.href}>
                {EMPTY[filter].action.label}
              </Link>
            </Button>
          }
        >
          {EMPTY[filter].text}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((event) => {
            const counts = [
              { label: "Registered", value: event._count.registrations },
              { label: "Teams", value: event._count.teams },
              {
                label: "Submissions",
                value: submissionsByEvent.get(event.id) ?? 0,
              },
            ];
            return (
              <li key={event.id}>
                <article className="relative h-full overflow-hidden rounded-2xl border bg-card transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:border-ring/60">
                  <EventCardMedia
                    name={event.name}
                    logoUrl={eventImageUrl(event.logoPath)}
                    bannerUrl={eventImageUrl(event.bannerPath)}
                  />
                  <div className="p-4 pt-3 sm:p-5 sm:pt-3">
                    <h2 className="text-xl font-semibold break-words">
                      {/* The whole card is the link target; the name is its text. */}
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="outline-none after:absolute after:inset-0 after:rounded-2xl hover:underline"
                      >
                        {event.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                    <EventStatusBadges event={event} className="mt-3" />
                    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      {counts.map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-baseline gap-1.5"
                        >
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="font-mono font-semibold tabular-nums">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EventListSkeleton() {
  return (
    <div
      className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
    >
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

function NewEventButton() {
  return (
    <Button asChild className="h-11 px-4 md:h-9">
      <Link href="/organizer/events/new">
        <PlusIcon aria-hidden />
        New event
      </Link>
    </Button>
  );
}
