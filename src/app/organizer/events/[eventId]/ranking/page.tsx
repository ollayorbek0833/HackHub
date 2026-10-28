import Link from "next/link";
import { Suspense } from "react";

import { PublishResultsButton } from "@/components/organizer/publish-results-button";
import { RankingPreviewTable } from "@/components/ranking/ranking-preview-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { criteriaAreSet, publishBlocker } from "@/lib/domain/event-switches";
import { getEventRanking } from "@/lib/queries/ranking";

import { publishResults } from "../actions";

// The organizer's ranking preview (docs/08 > Ranking preview, O5, #16): the
// same table as the published ranking plus a judge count per team, for the
// manual review before publishing (docs/02 > Consequences of the cuts). The
// event layout shows the name, badges and sub-nav above it.
//
// params, the session and the database are read inside this page's own
// Suspense: the area's loading.tsx is already on screen when the organizer
// switches tabs, so it doesn't cover a navigation between sibling pages.

export default function RankingPreviewPage({
  params,
}: PageProps<"/organizer/events/[eventId]/ranking">) {
  return (
    <section aria-labelledby="ranking-preview" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id="ranking-preview" className="text-section-title">
          Ranking preview
        </h2>
        <p className="text-muted-foreground text-sm">
          Check that every team has been scored before you publish. Only you and
          other organizers see this page.
        </p>
      </div>

      <Suspense fallback={<RankingPreviewSkeleton />}>
        <RankingPreview params={params} />
      </Suspense>
    </section>
  );
}

async function RankingPreview({
  params,
}: Pick<PageProps<"/organizer/events/[eventId]/ranking">, "params">) {
  const { eventId } = await params;
  const { event } = await requireOwnedEvent(eventId);
  const ranking = await getEventRanking(eventId);

  const published = event.resultsPublished;
  const notReady =
    !published && (event.submissionsOpen || !criteriaAreSet(ranking.criteria));

  return (
    <>
      {published && (
        <Alert>
          <AlertTitle>Results were published.</AlertTitle>
          <AlertDescription>
            <p>
              Everyone can see the ranking on the{" "}
              <Link
                href={`/events/${eventId}`}
                className="text-foreground underline"
              >
                public event page
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      {notReady ? (
        <Alert>
          <AlertDescription>
            The ranking appears once submissions are closed and criteria are
            set.
          </AlertDescription>
        </Alert>
      ) : (
        <RankingPreviewTable
          ranking={ranking}
          actions={
            // Stays mounted (disabled) after publishing, so its
            // "Results published." toast still shows.
            <PublishResultsButton
              eventName={event.name}
              rankingHref={`/organizer/events/${eventId}/ranking`}
              disabled={published}
              disabledReason={
                published
                  ? null
                  : publishBlocker(
                      event,
                      ranking.criteria,
                      ranking.ranked.length > 0,
                    )
              }
              action={publishResults.bind(null, eventId)}
            />
          }
        />
      )}
    </>
  );
}

function RankingPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
