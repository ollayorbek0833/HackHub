import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ArrowRightIcon, CalendarDaysIcon, UsersIcon } from "lucide-react";

import { EventCardMedia } from "@/components/events/event-card-media";
import { formatEventDates } from "@/components/events/event-format";
import { EventStatusBadges } from "@/components/events/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";

import { LandingSection } from "./section";

// Landing > Happening now (landing plan, section 6): the real events people
// can join or follow right now, with their banner and logo (or the generated
// art). Registration open first, then events whose submissions are open; at
// most six. The cards are the /events cards, without the description.

const SHOWN = 6;

const TITLE = "Happening now";
const INTRO =
  "Real events on HackHub: open for registration first, then the ones where teams are building.";

export async function HappeningNow() {
  // No params here, so tell Cache Components this is per-request data.
  await connection();
  const events = await prisma.event.findMany({
    where: {
      resultsPublished: false,
      OR: [{ registrationOpen: true }, { submissionsOpen: true }],
    },
    // false < true, so "desc" puts registration-open events first.
    orderBy: [{ registrationOpen: "desc" }, { startDate: "asc" }, { name: "asc" }],
    take: SHOWN,
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      maxTeamSize: true,
      registrationOpen: true,
      submissionsOpen: true,
      resultsPublished: true,
      logoPath: true,
      bannerPath: true,
    },
  });

  return (
    <HappeningNowFrame>
      {events.length === 0 ? (
        <EmptyState
          title="No events are open right now"
          action={
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              {/* Organizer accounts are made by the team on request; /register
                  only creates participants. Same link as the footer. */}
              <Link href="/contact#run-an-event">Run a hackathon</Link>
            </Button>
          }
        >
          Events show up here as soon as an organizer opens registration or
          submissions.
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id} className="flex">
                {/* The whole card is the link, as on /events (docs/08). */}
                <Link
                  href={`/events/${event.id}`}
                  className="group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground outline-none transition-colors hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <EventCardMedia
                    name={event.name}
                    logoUrl={eventImageUrl(event.logoPath)}
                    bannerUrl={eventImageUrl(event.bannerPath)}
                  />
                  <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
                    <h3 className="text-lg font-semibold break-words group-hover:underline group-hover:underline-offset-4">
                      {event.name}
                    </h3>
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
                    <EventStatusBadges event={event} className="mt-auto" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md font-medium underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              See all events
              <ArrowRightIcon aria-hidden className="size-4" />
            </Link>
          </p>
        </>
      )}
    </HappeningNowFrame>
  );
}

/** The section while the events load: the same heading, three card shapes. */
export function HappeningNowSkeleton() {
  return (
    <HappeningNowFrame>
      <div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
      >
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </HappeningNowFrame>
  );
}

function HappeningNowFrame({ children }: { children: ReactNode }) {
  return (
    <LandingSection id="happening-now" title={TITLE} intro={INTRO}>
      {children}
    </LandingSection>
  );
}
