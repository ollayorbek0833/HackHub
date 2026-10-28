import { OpenEvents, OpenEventsSkeleton } from "./open-events";
import { LandingSection } from "./section";

// Landing stub (landing plan, section owner: Abdurauf). Until the real
// "Happening now" lands, it shows today's open events so the page isn't empty.
// The owner replaces this file; keep the export names (HappeningNow is async,
// the page renders it inside <Suspense fallback={<HappeningNowSkeleton />}>).
export async function HappeningNow() {
  return (
    <LandingSection id="happening-now" title="Open for registration">
      <OpenEvents />
    </LandingSection>
  );
}

export function HappeningNowSkeleton() {
  return <OpenEventsSkeleton />;
}
