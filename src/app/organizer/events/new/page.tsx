import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { EventForm } from "@/components/organizer/event-form";
import { EventFormSkeleton } from "@/components/organizer/event-form-skeleton";
import { requireRole } from "@/lib/auth/dal";

import { createEvent } from "./actions";

// docs/08 > Event form. The heading is static; the session is read inside this
// page's own Suspense (Cache Components). The organizer loading.tsx doesn't
// cover a client navigation from another organizer page: it is already on screen.

export default function NewEventPage() {
  return (
    <>
      <Link
        href="/organizer"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Events I run
      </Link>
      <h1 className="mt-2 text-3xl font-bold">New event</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Participants can&apos;t see it until you open registration.
      </p>
      <div className="mt-8">
        <Suspense fallback={<EventFormSkeleton />}>
          <NewEventForm />
        </Suspense>
      </div>
    </>
  );
}

async function NewEventForm() {
  await requireRole("ORGANIZER");
  return (
    <EventForm
      action={createEvent}
      initial={{
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        maxTeamSize: "4",
      }}
      submitLabel="Create event"
      cancelHref="/organizer"
    />
  );
}
