import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ArrowRightIcon, CalendarDaysIcon, UsersIcon } from "lucide-react";

import { EventAvatar } from "@/components/events/event-avatar";
import { EventBanner } from "@/components/events/event-banner";
import { formatEventDates } from "@/components/events/event-format";
import { EventStatusBadges } from "@/components/events/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";
import { cn } from "@/lib/utils";

import { DrawIn } from "./draw-in";
import { LandingSection } from "./section";

// Landing > Happening now (landing plan, section 6): the real events people
// can join or follow right now, with their banner and logo (or the generated
// art). Registration open first, then events whose submissions are open; at
// most six. The cards are the /events cards, without the description.
//
// Motion (motion-safe only, once, transforms and opacity only):
// - the cards rise in one after another the first time the grid scrolls into
//   view (DrawIn: without JS, without IntersectionObserver or with reduced
//   motion nothing is ever hidden);
// - hover and keyboard focus lift a card a little, warm its border toward
//   amber, zoom the banner inside its frame and lift the logo a touch more.
//   The hover target is the <li>, which never moves: if it were the lifted
//   link, a pointer resting near the bottom edge would fall off it as it
//   rises, and the card would flicker up and down.

const SHOWN = 6;

/** The hover and focus movement inside a card. */
const CARD_MOTION =
  "transition-[translate,scale] duration-(--duration-base) ease-(--ease-out-expo)";

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
          <DrawIn>
            <ul
              data-draw-item
              className="group/grid grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {events.map((event, i) => (
                <li
                  key={event.id}
                  style={{
                    animationDelay: `calc(${i} * var(--stagger-step))`,
                  }}
                  className="group/card flex group-data-[draw=idle]/grid:opacity-0 motion-safe:group-data-[draw=done]/grid:animate-rise-in"
                >
                  {/* The whole card is the link, as on /events (docs/08). */}
                  <Link
                    href={`/events/${event.id}`}
                    className="group flex w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground outline-none transition-[translate,border-color] duration-(--duration-base) ease-(--ease-out-expo) group-hover/card:border-ring/70 focus-visible:border-ring/70 focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:group-hover/card:-translate-y-1 motion-safe:focus-visible:-translate-y-1"
                  >
                    {/* EventCardMedia's layout, composed here so the banner
                        and the logo can each move on their own. */}
                    <div className="relative">
                      <div className="overflow-hidden">
                        <EventBanner
                          name={event.name}
                          bannerUrl={eventImageUrl(event.bannerPath)}
                          className={cn(
                            "aspect-[5/2] md:aspect-[8/3]",
                            CARD_MOTION,
                            "motion-safe:group-hover/card:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]",
                          )}
                        />
                      </div>
                      <div className="relative z-10 -mt-8 px-5">
                        <EventAvatar
                          name={event.name}
                          logoUrl={eventImageUrl(event.logoPath)}
                          size="md"
                          decorative
                          className={cn(
                            "ring-card",
                            CARD_MOTION,
                            "motion-safe:group-hover/card:-translate-y-0.5 motion-safe:group-focus-visible:-translate-y-0.5",
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
                      <h3 className="text-lg font-semibold break-words underline-offset-4 group-hover/card:underline group-focus-visible:underline">
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
          </DrawIn>
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
