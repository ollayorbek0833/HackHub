import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";

import { EventAvatar } from "@/components/events/event-avatar";
import { EventBanner } from "@/components/events/event-banner";
import { PhaseDot } from "@/components/events/phase-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { describeWeightTotal, weightTotal } from "@/lib/domain/criteria";
import { PHASE_LABEL } from "@/lib/domain/event-phase";
import { nextStep, type EventProgress } from "@/lib/domain/event-readiness";
import { cn } from "@/lib/utils";

import { DrawIn } from "./draw-in";
import styles from "./for-organizers.module.css";
import { LandingSection } from "./section";

// Landing > For organizers (landing plan, section 3): the command-centre story
// in four rows. Each row's copy carries the meaning; next to it is a small
// static vignette of the real screen, built from the app's own components with
// sample content and marked "Example". The vignettes are decorative
// (aria-hidden and inert, so nothing in them takes focus). The criteria total
// and the "Next step" wording come from the same domain functions as the app,
// so they can't drift from it. No amber buttons in here: the page's one amber
// action is in the hero.
//
// Motion (motion-safe only, once each, nothing loops): as a vignette enters
// view it slides in from its side and fades in, then the criteria bar fills,
// the phase dot gives one soft pulse and the table rows fade in one by one.
// DrawIn only hides a vignette once JavaScript can reveal it again, so without
// JS, without IntersectionObserver, with reduced motion or on a very short
// screen everything is simply there.

const SAMPLE_EVENT = "Silk Road Hack Week";

const CRITERIA = [
  { name: "Innovation", weightPercent: 40, maxScore: 10 },
  { name: "Technical depth", weightPercent: 35, maxScore: 10 },
  { name: "Presentation", weightPercent: 25, maxScore: 10 },
];

/** Registration is open, 48 people in 14 teams, nobody has submitted yet. */
const SAMPLE_PROGRESS: EventProgress = {
  registrationOpen: true,
  submissionsOpen: false,
  resultsPublished: false,
  registrations: 48,
  teams: 14,
  submissions: 0,
  scoredTeams: 0,
  scoreCount: 0,
  criteria: CRITERIA,
};

const TEAMS = [
  { name: "Team Kompas", members: 4, submitted: true },
  { name: "Bytes of Bukhara", members: 3, submitted: true },
  { name: "NoSleep.js", members: 2, submitted: false },
];

const FEATURES: {
  title: string;
  text: string;
  vignette: ReactNode;
}[] = [
  {
    title: "Create an event with a logo and a banner",
    text: "Name it, set the dates and the team size, and add a square logo and a wide banner. No images yet? The event gets its own generated art, so it never looks empty.",
    vignette: <EventFormVignette />,
  },
  {
    title: "Set weighted criteria",
    text: "Choose what judges score and how much each criterion counts. Weights are whole percents that must total exactly 100, so everyone knows the rules before judging starts.",
    vignette: <CriteriaVignette />,
  },
  {
    title: "Run every phase with one Next step",
    text: "The command centre shows the phase, the numbers and the one thing to do now: open registration, open or close submissions, then publish the results. It says what changes and asks before it happens.",
    vignette: <NextStepVignette />,
  },
  {
    title: "See participants and teams in tables",
    text: "Search, sort and filter everyone who registered and every team, with who's in it and whether it has submitted. Open a row for the details.",
    vignette: <TablesVignette />,
  },
];

export function ForOrganizers() {
  return (
    <LandingSection
      id="for-organizers"
      eyebrow="For organizers"
      title="Your hackathon, run from one command centre"
      intro="Set an event up in minutes, then take it from the first sign-up to the published ranking without a spreadsheet or a group chat."
    >
      <DrawIn>
        <ol className="flex flex-col gap-12 lg:gap-20">
          {FEATURES.map((feature, i) => (
            <li
              key={feature.title}
              className="grid items-center gap-6 lg:grid-cols-2 lg:gap-14"
            >
              <div
                className={cn(
                  "flex max-w-xl flex-col gap-3",
                  i % 2 === 1 && "lg:order-2",
                )}
              >
                <span
                  aria-hidden
                  className="font-mono text-small text-primary/70 tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold text-balance">
                  {feature.title}
                </h3>
                <p className="text-pretty text-muted-foreground">
                  {feature.text}
                </p>
              </div>
              {/* Slides in from its own side (from below on phones, where
                  the rows stack) and fades in, once, when it enters view. */}
              <div
                data-draw-item
                className={cn(
                  // Transition only into "done", so hiding is instant.
                  "group/vignette min-w-0 motion-safe:data-[draw=done]:transition-[opacity,translate] motion-safe:data-[draw=done]:duration-(--duration-slow) motion-safe:data-[draw=done]:ease-(--ease-out-expo)",
                  "data-[draw=idle]:translate-y-4 data-[draw=idle]:opacity-0 lg:data-[draw=idle]:translate-y-0",
                  i % 2 === 1
                    ? "lg:data-[draw=idle]:-translate-x-4"
                    : "lg:data-[draw=idle]:translate-x-4",
                  styles.vignette,
                )}
              >
                {feature.vignette}
              </div>
            </li>
          ))}
        </ol>
      </DrawIn>
    </LandingSection>
  );
}

/** A mini screen: a title bar with "Example", then the sample UI. */
function Vignette({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      aria-hidden
      inert
      className="min-w-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_24px_60px_-30px_rgb(0_0_0/0.8)] select-none"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <span className="truncate text-small font-medium text-muted-foreground">
          {label}
        </span>
        <Badge variant="outline">Example</Badge>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function SampleField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      <Input readOnly tabIndex={-1} value={value} />
    </div>
  );
}

function EventFormVignette() {
  return (
    <Vignette label="New event">
      <div className="flex flex-col gap-4">
        <SampleField label="Name" value={SAMPLE_EVENT} />
        <div className="grid grid-cols-2 gap-3">
          <SampleField label="Start date" value="12 Mar 2027" />
          <SampleField label="End date" value="14 Mar 2027" />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex shrink-0 flex-col gap-1.5">
            <span className="text-sm font-medium">Logo</span>
            <EventAvatar
              name={SAMPLE_EVENT}
              logoUrl={null}
              size="md"
              className="ring-0"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Banner</span>
            <EventBanner
              name={SAMPLE_EVENT}
              bannerUrl={null}
              className="aspect-auto h-16 rounded-xl md:aspect-auto"
            />
          </div>
        </div>
      </div>
    </Vignette>
  );
}

function CriteriaVignette() {
  const total = weightTotal(CRITERIA);
  return (
    <Vignette label="Judging criteria">
      <div className="flex flex-col gap-4">
        {/* The weights as one bar: the shares of the total, at a glance.
            It fills to 100% once, after the vignette slides in. Only the
            fill is animated: the hidden (idle) shrink applies instantly, so
            an early reveal never starts part-full. */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="flex h-full origin-left group-data-[draw=idle]/vignette:scale-x-0 motion-safe:group-data-[draw=done]/vignette:transition-[scale] motion-safe:group-data-[draw=done]/vignette:delay-150 motion-safe:group-data-[draw=done]/vignette:duration-(--duration-slow) motion-safe:group-data-[draw=done]/vignette:ease-(--ease-out-expo)">
            {CRITERIA.map((c, i) => (
              <span
                key={c.name}
                style={{ width: `${c.weightPercent}%` }}
                className={cn(
                  "h-full",
                  ["bg-primary", "bg-primary/60", "bg-primary/30"][i],
                )}
              />
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Max score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CRITERIA.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.weightPercent}%
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.maxScore}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="flex items-center gap-2 text-sm font-medium">
          <CheckIcon aria-hidden className="size-4 shrink-0 text-success" />
          {describeWeightTotal(total)}
        </p>
      </div>
    </Vignette>
  );
}

function NextStepVignette() {
  const step = nextStep(SAMPLE_PROGRESS, SAMPLE_EVENT);
  const stats = [
    { label: "Registered", value: SAMPLE_PROGRESS.registrations },
    { label: "Teams", value: SAMPLE_PROGRESS.teams },
    { label: "Submissions", value: SAMPLE_PROGRESS.submissions },
  ];
  return (
    <Vignette label="Command centre">
      <div className="flex flex-col gap-4">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground">Phase</span>
          {/* PhaseLabel's markup, so the dot can take the one pulse. */}
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <PhaseDot phase="registration" className={styles.pulse} />
            {PHASE_LABEL.registration}
          </span>
        </p>
        <dl className="grid grid-cols-3 overflow-hidden rounded-xl border">
          {stats.map(({ label, value }, i) => (
            <div
              key={label}
              className={cn("flex min-w-0 flex-col gap-1 p-3", i > 0 && "border-l")}
            >
              <dt className="truncate text-small text-muted-foreground">
                {label}
              </dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-3 rounded-xl border border-primary/40 p-4">
          <p className="text-lg font-semibold text-balance">{step.title}</p>
          <p className="text-sm text-muted-foreground">{step.effect}</p>
          <Button
            variant="outline"
            tabIndex={-1}
            className="h-10 self-start px-4"
          >
            {step.action}
          </Button>
        </div>
      </div>
    </Vignette>
  );
}

function TablesVignette() {
  const tabs = [
    { label: "Participants", count: SAMPLE_PROGRESS.registrations },
    { label: "Teams", count: SAMPLE_PROGRESS.teams, current: true },
  ];
  return (
    <Vignette label="Participants and teams">
      <div className="flex flex-col gap-4">
        <ul className="inline-flex self-start rounded-lg bg-muted p-1">
          {tabs.map(({ label, count, current }) => (
            <li
              key={label}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm",
                current
                  ? "bg-background font-semibold text-foreground shadow-sm"
                  : "font-medium text-muted-foreground",
              )}
            >
              {label}
              <span className="font-mono tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Submission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* The rows fade in one by one, once, after the slide. */}
            {TEAMS.map((team, i) => (
              <TableRow
                key={team.name}
                style={{
                  animationDelay: `calc(150ms + ${i} * var(--stagger-step))`,
                }}
                className="group-data-[draw=idle]/vignette:opacity-0 motion-safe:group-data-[draw=done]/vignette:animate-fade-in"
              >
                <TableCell className="font-medium whitespace-normal">
                  {team.name}
                </TableCell>
                <TableCell className="tabular-nums">
                  {team.members} of 4
                </TableCell>
                <TableCell>
                  {team.submitted ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckIcon aria-hidden />
                      Submitted
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not submitted</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Vignette>
  );
}
