import { Suspense } from "react";

import { EventForm } from "@/components/organizer/event-form";
import { EventFormSkeleton } from "@/components/organizer/event-form-skeleton";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { eventImageUrl } from "@/lib/uploads/url";
import { toDateInput } from "@/lib/validation/event";

import { updateEvent } from "./actions";

// docs/08 > Event form, prefilled. The event layout above shows the name,
// badges and sub-nav. The session, params and the event are read inside this
// page's own Suspense: the layout's loading.tsx doesn't cover a navigation
// from another event page, because it is already on screen.

export default function EditEventPage({
  params,
}: PageProps<"/organizer/events/[eventId]/edit">) {
  return (
    <>
      <h2 className="text-2xl font-semibold">Edit event</h2>
      <div className="mt-6">
        <Suspense fallback={<EventFormSkeleton />}>
          <EditEventForm params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function EditEventForm({
  params,
}: Pick<PageProps<"/organizer/events/[eventId]/edit">, "params">) {
  const { eventId } = await params;
  const { event } = await requireOwnedEvent(eventId);
  const { description, logoPath, bannerPath } =
    await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { description: true, logoPath: true, bannerPath: true },
    });

  return (
    <EventForm
      action={updateEvent.bind(null, eventId)}
      initial={{
        name: event.name,
        description,
        startDate: toDateInput(event.startDate),
        endDate: toDateInput(event.endDate),
        maxTeamSize: String(event.maxTeamSize),
      }}
      submitLabel="Save changes"
      cancelHref={`/organizer/events/${eventId}`}
      images={{
        logoUrl: eventImageUrl(logoPath),
        bannerUrl: eventImageUrl(bannerPath),
      }}
    />
  );
}
