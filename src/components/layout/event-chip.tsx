import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/dal";
import { eventPhase, type EventPhase } from "@/lib/domain/event-phase";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";

import { EventChipMenu, type ChipEvent } from "./event-chip-menu";

// The current-event chip (redesign plan > App shell): the event you're in,
// with its logo, name and phase dot, and a menu to switch to another of your
// events. Reads the session and the database, so render it inside <Suspense>
// (fallback: <EventChipSkeleton />). Build `phase` with eventPhase() from
// @/lib/domain/event-phase.

export type EventChipEvent = {
  id: string;
  name: string;
  logoPath: string | null;
  phase: EventPhase;
};

const MAX_EVENTS = 12;

export async function EventChip({ event }: { event: EventChipEvent }) {
  const user = await getCurrentUser();

  // Each role's events, newest first: a participant's registrations, the
  // events a judge can score, the events an organizer created (the same list
  // as "Events I run"). Visitors get a chip without a menu.
  let rows: {
    id: string;
    name: string;
    logoPath: string | null;
    registrationOpen: boolean;
    submissionsOpen: boolean;
    resultsPublished: boolean;
    _count: { teams: number };
  }[] = [];

  if (user) {
    const select = {
      id: true,
      name: true,
      logoPath: true,
      registrationOpen: true,
      submissionsOpen: true,
      resultsPublished: true,
      _count: {
        select: { teams: { where: { submission: { isNot: null } } } },
      },
    } as const;
    rows = await prisma.event.findMany({
      where:
        user.role === "PARTICIPANT"
          ? { registrations: { some: { userId: user.id } } }
          : user.role === "JUDGE"
            ? { teams: { some: { submission: { isNot: null } } } }
            : { createdById: user.id },
      orderBy: [{ startDate: "desc" }, { name: "asc" }],
      take: MAX_EVENTS,
      select,
    });
  }

  const hrefFor = (id: string) =>
    user?.role === "ORGANIZER" ? `/organizer/events/${id}` : `/events/${id}`;

  const events: ChipEvent[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    logoUrl: eventImageUrl(row.logoPath),
    phase: eventPhase({ ...row, hasSubmissions: row._count.teams > 0 }),
    href: hrefFor(row.id),
  }));

  return (
    <EventChipMenu
      current={{
        id: event.id,
        name: event.name,
        logoUrl: eventImageUrl(event.logoPath),
        phase: event.phase,
        href: hrefFor(event.id),
      }}
      events={events}
      allHref={user?.role === "ORGANIZER" ? "/organizer" : "/events"}
      signedIn={Boolean(user)}
    />
  );
}

export function EventChipSkeleton() {
  return <Skeleton className="h-11 w-44 rounded-full md:h-9" />;
}
