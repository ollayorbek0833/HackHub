import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ProductCollage } from "./product-collage";

// The landing hero (landing plan > Hero): what HackHub is, in one line, and
// the two ways in. "Run a hackathon" is the page's amber action; it goes to
// /contact#run-an-event, because registering only ever creates a participant
// account and organizer accounts are made by the team on request. "Find an
// event" is the outline one, and participants get a quiet sign-up link. Beside the copy on desktop, below it on phones,
// the product collage shows the app's real pieces (decorative, aria-hidden;
// the copy carries the meaning). The page's only h1.

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="grid items-center gap-12 pt-10 pb-16 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pb-24"
    >
      <div className="motion-safe:animate-rise-in">
        <h1
          id="hero-heading"
          className="max-w-xl text-[clamp(2.375rem,1.7rem+2.9vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance"
        >
          Run your whole hackathon in one place.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
          Registration, teams, project submissions, judging and a ranking
          everyone can trust. No more forms, group chats and spreadsheets.
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
        <p className="mt-4 text-small text-muted-foreground">
          Taking part?{" "}
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center rounded-md font-medium text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-0"
          >
            Join as a participant
          </Link>
        </p>
      </div>

      <ProductCollage className="mx-auto w-full max-w-xl lg:max-w-none" />
    </section>
  );
}
