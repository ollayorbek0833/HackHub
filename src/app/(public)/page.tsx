import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { FairJudging } from "@/components/landing/fair-judging";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { ForOrganizers } from "@/components/landing/for-organizers";
import { ForParticipantsJudges } from "@/components/landing/for-participants-judges";
import {
  HappeningNow,
  HappeningNowSkeleton,
} from "@/components/landing/happening-now";
import { Hero } from "@/components/landing/hero";
import { Lifecycle } from "@/components/landing/lifecycle";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/permissions";

// The landing page (agent-briefs landing plan): the HackHub story, top to
// bottom. Each section is its own file in components/landing, owned by one
// person, and uses LandingSection (components/landing/section) for spacing and
// the heading scale. Only the Hero has an h1. The site footer comes from
// (public)/layout.tsx. A signed-in user goes to their role home.

async function RedirectSignedIn() {
  await connection();
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return null;
}

export default function LandingPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectSignedIn />
      </Suspense>

      <main className="mx-auto w-full max-w-6xl px-4">
        <Hero />
        <Lifecycle />
        <ForOrganizers />
        <FairJudging />
        <ForParticipantsJudges />
        <Suspense fallback={<HappeningNowSkeleton />}>
          <HappeningNow />
        </Suspense>
        <Faq />
        <FinalCta />
      </main>
    </>
  );
}
