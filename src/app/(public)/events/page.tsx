import Link from "next/link";
import { connection } from "next/server";
import { CalendarDaysIcon, CalendarXIcon, UsersIcon } from "lucide-react";
import { Suspense } from "react";

import { excerpt, formatEventDates } from "@/components/events/event-format";
import { StatusBadge } from "@/components/events/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

// docs/08 > /events. Everyone can browse; only events with registration open
// are listed (Decision 5), soonest start date first.

export default function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      <PageHeader
        title="Events"
        description="Hackathons that are open for registration. Open one to see the details and register."
      />
      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </main>
  );
}

async function EventList() {
  // No params here, so tell Cache Components this is per-request data.
  await connection();
  const [events, user] = await Promise.all([
    prisma.event.findMany({
      where: { registrationOpen: true },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        maxTeamSize: true,
      },
    }),
    getCurrentUser(),
  ]);

  let registered = new Set<string>();
  if (user?.role === "PARTICIPANT" && events.length > 0) {
    const rows = await prisma.eventRegistration.findMany({
      where: { userId: user.id, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true },
    });
    registered = new Set(rows.map((r) => r.eventId));
  }

  if (events.length === 0) {
    return (
      <Empty className="mt-8 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarXIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No open events</EmptyTitle>
          <EmptyDescription>
            No events are open for registration right now. Check back soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <li key={event.id} className="flex">
          {/* The whole card is the link (docs/08). */}
          <Link
            href={`/events/${event.id}`}
            className="group flex w-full flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground outline-none transition-colors hover:border-ring/60 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold break-words group-hover:underline group-hover:underline-offset-4">
                {event.name}
              </h2>
              {registered.has(event.id) && (
                <StatusBadge on className="mt-1">
                  Registered
                </StatusBadge>
              )}
            </div>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="size-4" aria-hidden />
                {formatEventDates(event.startDate, event.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="size-4" aria-hidden />
                Teams of up to {event.maxTeamSize}
              </span>
            </p>
            <p className="text-sm text-pretty break-words">
              {excerpt(event.description)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EventListSkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
    </div>
  );
}
