import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { formatDateRange } from "@/components/organizer/event-dates";
import { EventSavedToast } from "@/components/organizer/event-saved-toast";
import { EventStatusBadges } from "@/components/organizer/event-status-badges";
import { EventSubNav } from "@/components/organizer/event-sub-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireEvent, requireRole } from "@/lib/auth/dal";

// Shared by the five organizer event pages (docs/08 > App shell): a back link,
// the event name and status badges, and the sub-nav Overview / Edit / Criteria
// / Participants / Ranking. Sub-pages render below it and still authorize
// themselves: a layout is never the check.

export default function OrganizerEventLayout({
  children,
  params,
}: LayoutProps<"/organizer/events/[eventId]">) {
  return (
    <>
      <Link
        href="/organizer"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Events I run
      </Link>
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
  await requireRole("ORGANIZER");
  const { eventId } = await params;
  const event = await requireEvent(eventId);

  return (
    <header className="mt-2">
      <h1 className="text-3xl font-bold break-words">{event.name}</h1>
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
    <div className="mt-2" aria-busy="true">
      <Skeleton className="h-9 w-2/3 max-w-sm" />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-32 rounded-4xl" />
        <Skeleton className="h-5 w-32 rounded-4xl" />
      </div>
      <Skeleton className="mt-6 h-11 w-full" />
    </div>
  );
}
