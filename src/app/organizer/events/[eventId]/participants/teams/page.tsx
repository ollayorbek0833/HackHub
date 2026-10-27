import { Suspense } from "react";
import { UsersRoundIcon } from "lucide-react";

import { ParticipantsTabs } from "@/components/organizer/participants-tabs";
import { ParticipantsViewSkeleton } from "@/components/organizer/participants-view-skeleton";
import { TeamsTable } from "@/components/organizer/teams-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";

import { loadTeams } from "../data";

// docs/08 > Participants and teams, the Teams tab. loadTeams() authorizes
// (organizer only) and loads the event; params and the database are read
// inside this page's own Suspense (Cache Components).

export default function TeamsPage({
  params,
}: PageProps<"/organizer/events/[eventId]/participants/teams">) {
  return (
    <>
      <h2 className="text-2xl font-semibold">Participants and teams</h2>
      <Suspense fallback={<ParticipantsViewSkeleton />}>
        <Teams params={params} />
      </Suspense>
    </>
  );
}

async function Teams({
  params,
}: Pick<PageProps<"/organizer/events/[eventId]/participants/teams">, "params">) {
  const { eventId } = await params;
  const { event, counts, rows } = await loadTeams(eventId);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <ParticipantsTabs eventId={eventId} current="teams" counts={counts} />
      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRoundIcon aria-hidden />
            </EmptyMedia>
            <EmptyDescription className="text-base text-foreground">
              No teams yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TeamsTable rows={rows} maxTeamSize={event.maxTeamSize} />
      )}
    </div>
  );
}
