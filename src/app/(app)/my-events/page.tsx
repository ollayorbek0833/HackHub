import Link from "next/link";
import { CalendarDaysIcon, CalendarPlusIcon, TrophyIcon } from "lucide-react";
import { Suspense } from "react";

import { formatEventDates } from "@/components/events/event-format";
import { EventStatusBadges, StatusBadge } from "@/components/events/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { compareMyEvents } from "@/lib/domain/registration";
import { prisma } from "@/lib/prisma";

// docs/08 > /my-events: the participant's home. Every event they registered
// for, with their team, submission status and a link to published results.

export default function MyEventsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
      <PageHeader
        title="My events"
        description="The events you registered for, and what to do next in each."
        action={
          <Button asChild variant="outline" size="lg" className="h-11 w-full px-5 md:w-auto">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />
      <Suspense fallback={<MyEventsSkeleton />}>
        <MyEventsList />
      </Suspense>
    </main>
  );
}

async function MyEventsList() {
  const user = await requireRole("PARTICIPANT");

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: user.id },
    select: {
      event: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          registrationOpen: true,
          submissionsOpen: true,
          resultsPublished: true,
        },
      },
      membership: {
        select: {
          team: { select: { name: true, submission: { select: { id: true } } } },
        },
      },
    },
  });

  if (registrations.length === 0) {
    return (
      <Empty className="mt-8 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarPlusIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No events yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t registered for any events yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/events">Browse events</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const items = registrations
    .map(({ event, membership }) => ({
      ...event,
      team: membership?.team ?? null,
    }))
    .sort(compareMyEvents);

  return (
    <ul className="mt-8 flex flex-col gap-4">
      {items.map((event) => {
        const submitted = Boolean(event.team?.submission);
        return (
          <li
            key={event.id}
            className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold break-words">
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex min-h-11 items-center rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {event.name}
                </Link>
              </h2>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4" aria-hidden />
                {formatEventDates(event.startDate, event.endDate)}
              </p>
              <EventStatusBadges event={event} />
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">My team</dt>
                <dd className="font-medium break-words">
                  {event.team?.name ?? "No team yet"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Submission</dt>
                <dd className="mt-0.5">
                  <StatusBadge on={submitted}>
                    {submitted ? "Submitted" : "Not submitted"}
                  </StatusBadge>
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href={`/events/${event.id}/team`}>
                  {event.team ? "Go to my team" : "Create or join a team"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5">
                <Link href={`/events/${event.id}`}>Open event</Link>
              </Button>
              {event.resultsPublished && (
                <Button asChild variant="secondary" size="lg" className="h-11 px-5">
                  <Link href={`/events/${event.id}#ranking`}>
                    <TrophyIcon aria-hidden />
                    Results published: see the ranking
                  </Link>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MyEventsSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
