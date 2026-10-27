import { Suspense, type ReactNode } from "react";
import { UsersIcon } from "lucide-react";

import { ParticipantsSearch } from "@/components/organizer/participants-search";
import { ParticipantsTable } from "@/components/organizer/participants-table";
import { ParticipantsTabs } from "@/components/organizer/participants-tabs";
import { ParticipantsViewSkeleton } from "@/components/organizer/participants-view-skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";

import { loadParticipants } from "./data";

// docs/08 > Participants and teams, the Participants tab. The Teams tab is
// ./teams. loadParticipants() authorizes (organizer only) and loads the event;
// params, searchParams and the database are read inside this page's own
// Suspense (Cache Components).

export default function ParticipantsPage({
  params,
  searchParams,
}: PageProps<"/organizer/events/[eventId]/participants">) {
  return (
    <>
      <h2 className="text-2xl font-semibold">Participants and teams</h2>
      <Suspense fallback={<ParticipantsViewSkeleton />}>
        <Participants params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Participants({
  params,
  searchParams,
}: Pick<
  PageProps<"/organizer/events/[eventId]/participants">,
  "params" | "searchParams"
>) {
  const { eventId } = await params;
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim();
  const { counts, rows } = await loadParticipants(eventId, query);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <ParticipantsTabs
        eventId={eventId}
        current="participants"
        counts={counts}
      />
      {counts.participants === 0 ? (
        <EmptyList>Nobody has registered yet.</EmptyList>
      ) : (
        <>
          <ParticipantsSearch
            action={`/organizer/events/${eventId}/participants`}
            query={query}
          />
          {rows.length === 0 ? (
            <EmptyList>No participants match &lsquo;{query}&rsquo;.</EmptyList>
          ) : (
            <ParticipantsTable rows={rows} />
          )}
        </>
      )}
    </div>
  );
}

function EmptyList({ children }: { children: ReactNode }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden />
        </EmptyMedia>
        <EmptyDescription className="text-base text-foreground">
          {children}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
