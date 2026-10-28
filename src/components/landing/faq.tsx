import Link from "next/link";
import type { ReactNode } from "react";

import { LandingSection } from "@/components/landing/section";
import { REPO_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

import styles from "./faq.module.css";

// Landing section 7 (landing plan): common questions, as native
// <details>/<summary>, so they open with the keyboard and work without
// JavaScript. Every answer matches the app as built: the ranking rules
// (docs/02 > Ranking, lib/domain/ranking), roles (Decision 11), the phone's
// visibility (lib/domain/profile) and hosting (docs/04). Keep them in step.
// One question is open at a time (the native exclusive accordion). It opens
// and closes with a short height animation where the browser supports it
// (faq.module.css), and instantly elsewhere or with reduced motion.

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </Link>
  );
}

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: "Is HackHub free?",
    a: (
      <p>
        Yes. There are no payments anywhere in HackHub, for organizers,
        participants or judges. It&apos;s open source under the MIT licence.
      </p>
    ),
  },
  {
    q: "Who can organize an event?",
    a: (
      <p>
        Clubs, companies, communities and universities. Organizer accounts are
        set up by the HackHub team: ask for one on GitHub, as explained on the{" "}
        <A href="/contact#run-an-event">Contact</A> page.
      </p>
    ),
  },
  {
    q: "How are winners chosen?",
    a: (
      <>
        <p>
          The organizer sets the judging criteria, each with a weight in whole
          percent, and the weights must add up to exactly 100. Every judge
          scores every submitted team on every criterion.
        </p>
        <p>
          For each criterion, HackHub averages the judges&apos; scores and
          scales them to the criterion&apos;s maximum. The total is the
          weighted sum, out of 100. A tie goes to the team that did better on
          the highest-weight criterion, then the next one; teams still level
          share a rank. Results appear only when the organizer publishes them.
        </p>
      </>
    ),
  },
  {
    q: "Can I join without a team?",
    a: (
      <p>
        Yes. You register for an event on your own. To submit a project you
        need a team, but it can be just you: create one, and others can join
        later with its invite code, up to the event&apos;s team size.
      </p>
    ),
  },
  {
    q: "Can a judge also compete?",
    a: (
      <p>
        No. Judges can&apos;t be on a team, and a participant who is already on
        a team can&apos;t be made a judge. That keeps the scoring fair.
      </p>
    ),
  },
  {
    q: "Does it work on phones?",
    a: (
      <p>
        Yes. Everything a participant does, from the profile to the
        submission, is designed for a phone first. Judges can score on a phone
        too. Organizer tools work on a phone but are laid out for a desktop.
      </p>
    ),
  },
  {
    q: "Where is my data stored?",
    a: (
      <p>
        On our own server, behind Cloudflare. Passwords are stored only as
        bcrypt hashes, your phone number is shown only to you and organizers,
        and there are no ads or tracking cookies. The details are on the{" "}
        <A href="/privacy">Privacy</A> page.
      </p>
    ),
  },
  {
    q: "Who built HackHub?",
    a: (
      <p>
        HackHub is an open-source project, made with Uzbek universities and
        student communities in mind. The code is on{" "}
        <A href={REPO_URL}>GitHub</A> under the MIT licence, and anyone can
        report a bug or suggest a change there.
      </p>
    ),
  },
];

export function Faq() {
  return (
    <LandingSection id="faq" eyebrow="FAQ" title="Questions, answered">
      {/* The list reaches 1rem past the text on each side (into the page's
          own padding), so the open item's tint has room while the questions
          stay in line with the heading at every width. */}
      <div className="-mx-4 max-w-3xl divide-y border-y">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} name="faq" className={cn("group", styles.item)}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-sm px-4 py-3 text-lg font-medium outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:transition-colors motion-safe:duration-(--duration-fast) [&::-webkit-details-marker]:hidden">
              {/* An h3, so the questions show in the heading outline. */}
              <h3 className="text-pretty">{q}</h3>
              <PlusMinus />
            </summary>
            <div
              className={cn(
                "flex max-w-[70ch] flex-col gap-3 px-4 pb-6 text-pretty text-muted-foreground",
                styles.answer,
              )}
            >
              {a}
            </div>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}

/** A plus that becomes a minus while its question is open: the upright bar
 *  turns flat onto the other one. */
function PlusMinus() {
  return (
    <span
      aria-hidden
      data-slot="faq-indicator"
      className="relative size-5 shrink-0 text-muted-foreground group-open:text-primary group-hover:text-primary motion-safe:transition-colors motion-safe:duration-(--duration-fast)"
    >
      <span className="absolute inset-x-0.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
      <span className="absolute inset-y-0.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current group-open:rotate-90 motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out-expo)" />
    </span>
  );
}
