import { CheckIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { ScoringStatusBadge } from "@/components/judging/scoring-status-badge";
import { DrawIn } from "@/components/landing/draw-in";
import { LandingSection } from "@/components/landing/section";
import type { ScoringStatus } from "@/lib/domain/scoring";
import { cn } from "@/lib/utils";

// Landing section 5 (landing plan): what HackHub is like for the two roles who
// aren't running the event. Participants: the phone-first path from profile to
// submission. Judges: the queue, the scorecard and scoring from the keyboard.
// Each column has a small static vignette built like the real screens (the
// progress rail, the team pass, the judge queue, the scorecard's number
// buttons), marked "Example". The vignettes are decorative (aria-hidden): the
// steps next to them carry the meaning.
//
// Motion (DrawIn, once, motion-safe only): when a vignette scrolls into view,
// the participant's progress rail lights up step by step, and the judge's
// chosen score is picked with a small pop. The server renders the finished
// state, so without JavaScript, with reduced motion, or when a vignette is
// already on screen at load, everything is simply there.

const PARTICIPANT_STEPS = [
  {
    title: "Make your profile",
    text: "Your name and faculty, plus skills and links so teammates can find you.",
  },
  {
    title: "Register for an event",
    text: "One tap on the event page while registration is open.",
  },
  {
    title: "Team up with an invite code",
    text: "Create a team and share its six-character code, or type a friend's code to join theirs.",
  },
  {
    title: "Submit your project",
    text: "A title, a description and your repository link. Anyone on the team can update it until submissions close.",
  },
];

const JUDGE_STEPS = [
  {
    title: "Work through a queue",
    text: "Every submitted team in one list, with what you've scored and what's left.",
  },
  {
    title: "Score on one scorecard",
    text: "The project and its repository link at the top, then one row per criterion with its weight.",
  },
  {
    title: "Stay on the keyboard",
    text: "Type a score, adjust it with the arrow keys, and press Enter to save and open the next team.",
  },
];

export function ForParticipantsJudges() {
  return (
    <LandingSection
      id="participants-judges"
      eyebrow="For participants and judges"
      title="Built for the people in the room"
      intro="Participants get a short path that works on a phone. Judges get a fast, fair way to score every team."
    >
      <DrawIn className="grid gap-12 md:grid-cols-2 md:gap-10 lg:gap-16">
        <RoleColumn
          id="participants"
          title="Participants"
          lead="From sign-up to submitted, on your phone."
          steps={PARTICIPANT_STEPS}
          vignette={<ParticipantVignette />}
        />
        <RoleColumn
          id="judges"
          title="Judges"
          lead="Every team, the same criteria, no spreadsheets."
          steps={JUDGE_STEPS}
          vignette={<JudgeVignette />}
        />
      </DrawIn>
    </LandingSection>
  );
}

function RoleColumn({
  id,
  title,
  lead,
  steps,
  vignette,
}: {
  id: string;
  title: string;
  lead: string;
  steps: { title: string; text: string }[];
  vignette: ReactNode;
}) {
  return (
    <article aria-labelledby={`${id}-role-heading`} className="flex min-w-0 flex-col gap-6">
      <div>
        <h3 id={`${id}-role-heading`} className="text-section-title">
          {title}
        </h3>
        <p className="mt-1 text-muted-foreground">{lead}</p>
      </div>
      {vignette}
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 font-mono text-small text-primary tabular-nums"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium">{step.title}</p>
              <p className="text-pretty text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

/** The frame every vignette sits in, with its "Example" tag. */
function Vignette({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-lg shadow-black/30 select-none",
        className,
      )}
    >
      <span className="absolute -top-2.5 right-4 rounded-full border bg-background px-2 py-0.5 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
        Example
      </span>
      {children}
    </div>
  );
}

/** How far apart the rail's steps light up as it enters view. */
const RAIL_STEP_MS = 160;

const RAIL = [
  { label: "Profile", done: true },
  { label: "Registered", done: true },
  { label: "Team", done: true },
  { label: "Submitted", done: false },
];

function ParticipantVignette() {
  return (
    <Vignette className="mx-auto w-full max-w-sm">
      {/* The progress rail, as inside an event. On entering view (DrawIn) it
          starts unlit, then the line fills and each step lights up in turn,
          RAIL_STEP_MS apart. */}
      <ol data-draw-item className="group/rail relative grid grid-cols-4">
        {/* The line behind the dots, from the first dot's centre to the last. */}
        <span className="absolute top-3 right-[12.5%] left-[12.5%] h-px bg-border" />
        {/* Its done part, from the first dot to the last done one. */}
        <span
          data-slot="rail-progress"
          className="absolute top-3 left-[12.5%] h-px w-1/2 origin-left bg-primary/50 group-data-[draw=idle]/rail:scale-x-0 motion-safe:transition-transform motion-safe:duration-(--rail-fill) motion-safe:ease-linear"
          style={{ "--rail-fill": `${2 * RAIL_STEP_MS}ms` } as CSSProperties}
        />
        {RAIL.map((step, i) => (
          <li
            key={step.label}
            className="relative flex flex-col items-center gap-1.5"
            style={{ "--step-delay": `${i * RAIL_STEP_MS}ms` } as CSSProperties}
          >
            <span
              data-slot="rail-dot"
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                step.done ? "border-primary/50 bg-card" : "border-primary bg-card",
                "group-data-[draw=idle]/rail:border-border",
                "motion-safe:transition-colors motion-safe:delay-(--step-delay) motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out-expo)",
              )}
            >
              {step.done && (
                <CheckIcon
                  data-slot="rail-check"
                  className="size-3.5 text-primary group-data-[draw=idle]/rail:scale-0 group-data-[draw=idle]/rail:opacity-0 motion-safe:transition-[scale,opacity] motion-safe:delay-(--step-delay) motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out-expo)"
                />
              )}
            </span>
            <span
              className={cn(
                "text-[0.6875rem] leading-none",
                step.done ? "text-muted-foreground" : "font-semibold text-foreground",
                !step.done &&
                  "group-data-[draw=idle]/rail:text-muted-foreground motion-safe:transition-colors motion-safe:delay-(--step-delay) motion-safe:duration-(--duration-base)",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {/* The team pass: name, members and the invite code. */}
      <div className="flex overflow-hidden rounded-lg border bg-background">
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          <div>
            <p className="text-small text-muted-foreground">Your team</p>
            <p className="font-semibold">Byte Riders</p>
          </div>
          <div className="flex items-center gap-1.5">
            {["AK", "DS", "MR"].map((initials) => (
              <span
                key={initials}
                className="flex size-7 items-center justify-center rounded-full bg-secondary text-[0.6875rem] font-semibold"
              >
                {initials}
              </span>
            ))}
            <span className="flex size-7 items-center justify-center rounded-full border border-dashed text-[0.6875rem] text-muted-foreground">
              +1
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 border-l border-dashed px-4">
          <p className="text-[0.6875rem] text-muted-foreground">Invite code</p>
          <p className="font-mono text-lg font-semibold tracking-[0.15em] text-primary">K7Q2MX</p>
        </div>
      </div>

      {/* The submission, about to go in. */}
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
        <p className="text-small text-muted-foreground">Project</p>
        <p className="font-medium">Dorm Swap: trade things across campus</p>
        <p className="truncate font-mono text-small text-muted-foreground">
          https://github.com/byte-riders/dorm-swap
        </p>
      </div>
    </Vignette>
  );
}

const QUEUE: { team: string; title: string; status: ScoringStatus }[] = [
  { team: "Byte Riders", title: "Dorm Swap", status: "SCORED" },
  { team: "Silk Road Devs", title: "Bazaar Pay", status: "IN_PROGRESS" },
  { team: "Night Owls", title: "Library Seat Finder", status: "NOT_STARTED" },
];

/** The score the example judge gives on the scorecard row. */
const CHOSEN_SCORE = 7;

function JudgeVignette() {
  return (
    <Vignette>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">Your queue</p>
        <p className="text-small text-muted-foreground">
          <span className="font-mono font-semibold text-foreground tabular-nums">1</span> of{" "}
          <span className="font-mono font-semibold text-foreground tabular-nums">3</span> scored
        </p>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border bg-background">
        {QUEUE.map((row) => (
          <li key={row.team} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.team}</p>
              <p className="truncate text-small text-muted-foreground">{row.title}</p>
            </div>
            <ScoringStatusBadge status={row.status} />
          </li>
        ))}
      </ul>

      {/* One scorecard row: the criterion, its weight and the number buttons.
          On entering view (DrawIn) no score is picked yet; then the chosen
          one is picked with a single pop (tick-in), as if just tapped. */}
      <div
        data-draw-item
        className="group/score flex flex-col gap-2 rounded-lg border bg-background p-3"
      >
        <div className="flex items-baseline gap-3">
          <p className="min-w-0 flex-1 font-medium">
            Innovation <span className="text-small font-normal text-muted-foreground">30%</span>
          </p>
          <p className="font-mono text-small text-muted-foreground tabular-nums">
            <span className="text-foreground">{CHOSEN_SCORE}</span> / 10
          </p>
        </div>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, score) => (
            <span
              key={score}
              data-slot={score === CHOSEN_SCORE ? "chosen-score" : undefined}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border font-mono text-small tabular-nums",
                score === CHOSEN_SCORE
                  ? [
                      "border-foreground bg-foreground font-semibold text-background ring-3 ring-ring/50",
                      "group-data-[draw=idle]/score:border-input group-data-[draw=idle]/score:bg-transparent group-data-[draw=idle]/score:text-foreground group-data-[draw=idle]/score:ring-0",
                      "group-data-[draw=done]/score:motion-safe:animate-tick-in motion-safe:transition-colors motion-safe:duration-(--duration-base)",
                    ]
                  : "border-input",
              )}
            >
              {score}
            </span>
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground">
          <span>
            <Kbd>0</Kbd>–<Kbd>9</Kbd> score
          </span>
          <span>
            <Kbd>←</Kbd> <Kbd>→</Kbd> adjust
          </span>
          <span>
            <Kbd>Enter</Kbd> save, next team
          </span>
        </p>
      </div>
    </Vignette>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-b-2 bg-secondary px-1 font-mono text-[0.6875rem] text-foreground">
      {children}
    </kbd>
  );
}
