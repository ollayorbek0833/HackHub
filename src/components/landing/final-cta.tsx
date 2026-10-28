import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// The closing band (landing plan > Final CTA): the two ways in again, once
// the visitor has read the story. "Run a hackathon" is this view's one amber
// action; like the hero's, it goes to /contact#run-an-event (organizer
// accounts are made on request, registering makes a participant). A large, quiet Podium H sits at the edge as decoration.

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="pt-8 pb-20 md:pb-28">
      <div className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-12 sm:px-10 md:py-16">
        <LogoMark
          decorative
          size={320}
          className="pointer-events-none absolute -right-16 -bottom-20 -z-10 opacity-[0.07] sm:-right-8 md:-bottom-16"
        />
        <h2
          id="final-cta-heading"
          className="max-w-xl text-[clamp(1.75rem,1.35rem+1.6vw,2.625rem)] leading-[1.1] font-bold tracking-[-0.025em] text-balance"
        >
          Run your next hackathon on HackHub
        </h2>
        <p className="mt-4 max-w-lg text-lg text-pretty text-muted-foreground">
          Set up your event, open registration, and run everything from
          teams to the final ranking in one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link href="/contact#run-an-event">Run a hackathon</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base"
          >
            <Link href="/events">Find an event</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
