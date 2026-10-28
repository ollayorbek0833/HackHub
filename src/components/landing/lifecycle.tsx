import type { CSSProperties } from "react";
import {
  ClipboardCheckIcon,
  DoorOpenIcon,
  SendIcon,
  TrophyIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { DrawIn } from "./draw-in";
import { LandingSection } from "./section";

// How a hackathon runs on HackHub (landing plan > Lifecycle): the five phases
// in order, each with an icon, one line, and what each role does in it. A
// vertical rail on phones, a horizontal one from lg. Each step draws in once
// as it scrolls into view, only under motion-safe (DrawIn); without
// JavaScript or with reduced motion it's simply there. The results step is the
// only one in amber: the ranking is where the colour lives (DESIGN.md).

type Phase = {
  title: string;
  icon: LucideIcon;
  line: string;
  roles: { role: "Organizer" | "Participants" | "Judges"; does: string }[];
};

const PHASES: Phase[] = [
  {
    title: "Open registration",
    icon: DoorOpenIcon,
    line: "The event goes live and people sign up.",
    roles: [
      { role: "Organizer", does: "Creates the event and opens registration." },
      { role: "Participants", does: "Make a profile and register." },
    ],
  },
  {
    title: "Form teams",
    icon: UsersRoundIcon,
    line: "Teams come together with an invite code.",
    roles: [
      { role: "Participants", does: "Start a team or join one by its code." },
      { role: "Organizer", does: "Sees every participant and team." },
    ],
  },
  {
    title: "Submit",
    icon: SendIcon,
    line: "Each team hands in its project.",
    roles: [
      {
        role: "Participants",
        does: "Submit a title, a description and the repository link.",
      },
      { role: "Organizer", does: "Opens submissions, then closes them." },
    ],
  },
  {
    title: "Judge",
    icon: ClipboardCheckIcon,
    line: "Every judge scores every submitted team on the same criteria.",
    roles: [
      {
        role: "Judges",
        does: "Score each submitted team, criterion by criterion.",
      },
      {
        role: "Organizer",
        does: "Sets the criteria, with weights that total 100.",
      },
    ],
  },
  {
    title: "Publish results",
    icon: TrophyIcon,
    line: "The ranking is computed from the scores.",
    roles: [
      { role: "Organizer", does: "Publishes the ranking." },
      { role: "Participants", does: "See where every team placed." },
    ],
  },
];

export function Lifecycle() {
  return (
    <LandingSection
      id="how-it-works"
      eyebrow="How it works"
      // A non-breaking hyphen (U+2011), so "sign‑up" never splits.
      title="One flow, from sign‑up to the final ranking"
      intro="A hackathon on HackHub runs in five phases. The organizer moves the event from one to the next; everyone else sees what to do now."
    >
      <DrawIn>
        <ol className="grid gap-8 lg:grid-cols-5 lg:gap-6">
          {PHASES.map((phase, i) => {
            const last = i === PHASES.length - 1;
            const Icon = phase.icon;
            return (
              <li
                key={phase.title}
                data-draw-item
                className="group/step relative flex gap-4 lg:flex-col"
                style={{ "--i": i } as CSSProperties}
              >
                {/* The rail: from this step's icon to the next one. Down on
                    phones, across from lg. Decorative. Each step reveals as
                    it enters (DrawIn); from lg the five share one row, so
                    they also stagger left to right. */}
                {!last && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-14 -bottom-6 left-6 w-px origin-top bg-foreground/20",
                      "lg:top-6 lg:-right-4 lg:bottom-auto lg:left-14 lg:h-px lg:w-auto lg:origin-left",
                      "group-data-[draw=idle]/step:scale-0",
                      "motion-safe:transition-transform motion-safe:delay-120 motion-safe:duration-700 motion-safe:ease-(--ease-out-expo)",
                      "motion-safe:lg:[transition-delay:calc(var(--i)*140ms+120ms)]",
                    )}
                  />
                )}

                <span
                  aria-hidden
                  className={cn(
                    "relative flex size-12 shrink-0 items-center justify-center rounded-xl border bg-card",
                    last && "border-primary/50 bg-primary/10 text-primary",
                    "group-data-[draw=idle]/step:scale-75 group-data-[draw=idle]/step:opacity-0",
                    "motion-safe:transition-[scale,opacity] motion-safe:duration-(--duration-slow) motion-safe:ease-(--ease-out-expo)",
                    "motion-safe:lg:[transition-delay:calc(var(--i)*140ms)]",
                  )}
                >
                  <Icon className="size-5" />
                </span>

                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col gap-2 pt-1 lg:pt-0",
                    "group-data-[draw=idle]/step:translate-y-2 group-data-[draw=idle]/step:opacity-0",
                    "motion-safe:transition-[translate,opacity] motion-safe:delay-80 motion-safe:duration-(--duration-slow) motion-safe:ease-(--ease-out-expo)",
                    "motion-safe:lg:[transition-delay:calc(var(--i)*140ms+80ms)]",
                  )}
                >
                  <h3 className="flex items-baseline gap-2 text-lg leading-snug font-semibold">
                    <span
                      aria-hidden
                      className="font-mono text-small font-normal text-muted-foreground tabular-nums"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {phase.title}
                  </h3>
                  <p className="text-pretty text-muted-foreground">
                    {phase.line}
                  </p>
                  <dl className="mt-1 flex flex-col gap-2 border-t pt-3 text-small">
                    {phase.roles.map(({ role, does }) => (
                      <div key={role}>
                        <dt className="font-medium text-foreground">{role}</dt>
                        <dd className="text-pretty text-muted-foreground">
                          {does}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ol>
      </DrawIn>
    </LandingSection>
  );
}
