import { Suspense } from "react";

import { EventAvatar } from "@/components/events/event-avatar";
import { EventBanner } from "@/components/events/event-banner";
import { formatDateRange } from "@/components/organizer/event-dates";
import { EventSavedToast } from "@/components/organizer/event-saved-toast";
import { EventStatusBadges } from "@/components/organizer/event-status-badges";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EventChip, EventChipSkeleton } from "@/components/layout/event-chip";
import { EventSubNav } from "@/components/organizer/event-sub-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { eventPhase } from "@/lib/domain/event-phase";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";

// Shared by the five organizer event pages (docs/08 > App shell): breadcrumbs
// and the current-event chip, the event name and status badges, and the
// sub-nav Overview / Edit / Criteria / Participants / Ranking. Sub-pages render below it and still authorize
// themselves: a layout is never the check.

export default function OrganizerEventLayout({
  children,
  params,
}: LayoutProps<"/organizer/events/[eventId]">) {
  return (
    <>
      {/* params and the database are read inside Suspense (Cache Components). */}
      <Suspense fallback={<EventHeaderSkeleton />}>
        <EventHeader params={params} />
      </Suspense>
      <div className="mt-6">{children}</div>
      <Suspense fallback={null}>
        <EventSavedToast />
      </Suspense>
    </>
  );
}

async function EventHeader({
  params,
}: Pick<LayoutProps<"/organizer/events/[eventId]">, "params">) {
  const { eventId } = await params;
  const { event } = await requireOwnedEvent(eventId);
  const submitted = await prisma.team.count({
    where: { eventId: event.id, submission: { isNot: null } },
  });
  const phase = eventPhase({ ...event, hasSubmissions: submitted > 0 });

  return (
    <header>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Breadcrumbs
          items={[{ label: "Events I run", href: "/organizer" }, { label: event.name }]}
        />
        <Suspense fallback={<EventChipSkeleton />}>
          <EventChip
            event={{ id: event.id, name: event.name, logoPath: event.logoPath, phase }}
          />
        </Suspense>
      </div>
      {/* A compact banner strip, then the logo beside the name and badges. */}
      <EventBanner
        name={event.name}
        bannerUrl={eventImageUrl(event.bannerPath)}
        priority
        className="aspect-auto h-24 rounded-2xl border md:aspect-auto md:h-32"
      />
      <div className="relative z-10 -mt-8 flex items-end gap-4 px-4 md:-mt-10 md:px-6">
        <EventAvatar
          name={event.name}
          logoUrl={eventImageUrl(event.logoPath)}
          size="md"
          className="md:size-20"
        />
      </div>
      <h1 className="mt-3 text-page-title break-words">{event.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDateRange(event.startDate, event.endDate)}
      </p>
      <EventStatusBadges event={event} className="mt-3" />
      <div className="mt-6">
        <EventSubNav eventId={eventId} />
      </div>
    </header>
  );
}

function EventHeaderSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-48" />
        <EventChipSkeleton />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl md:h-32" />
      <Skeleton className="mt-4 h-9 w-2/3 max-w-sm" />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-32 rounded-4xl" />
        <Skeleton className="h-5 w-32 rounded-4xl" />
      </div>
      <Skeleton className="mt-6 h-11 w-full" />
    </div>
  );
}
