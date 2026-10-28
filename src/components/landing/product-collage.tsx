import type { CSSProperties, ReactNode } from "react";
import { CopyIcon, TrophyIcon, UserPlusIcon } from "lucide-react";

import { EventCardMedia } from "@/components/events/event-card-media";
import { EventStatusBadges } from "@/components/events/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// The hero's product tour (landing plan > Hero): layered mini screens, each
// slightly offset, built from the app's real pieces (the event card media, the
// status badges, the team pass, the scorecard's score buttons and the ranking
// ramp) with static sample content. Every screen says "Example".
//
// Decorative: the hero's copy carries the meaning, so the whole collage is
// aria-hidden and inert (nothing in it can take focus).
//
// Layout, with no absolute positioning, so it keeps its own height and never
// scrolls sideways at 390 px. Overlaps only ever cover reserved padding:
// - Phones: one column, alternating sides, each screen just over the last
//   one's bottom padding. Three screens; the scorecard is left out.
// - From sm: two columns, the second a little lower and over the first one's
//   right edge, where the first column's screens keep 2.5rem free.
//
// The screens rise in once, only under motion-safe (stagger-item).
//
// The example banner and logo are the showcase art for "Tashkent AI Weekend"
// (prisma/showcase-assets; the photo is by Sultonbek Ikromov on Unsplash,
// Unsplash License, see CREDITS.md there), copied to public/landing.

const EVENT_NAME = "Tashkent AI Weekend";

function Screen({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "stagger-item relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_24px_60px_-28px_rgb(0_0_0/0.9)]",
        className,
      )}
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </div>
  );
}

function ExampleTag({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("bg-background/80 backdrop-blur-sm", className)}
    >
      Example
    </Badge>
  );
}

function EventScreen() {
  return (
    <Screen index={0} className="order-1 w-[92%] self-start sm:w-auto sm:self-stretch">
      <EventCardMedia
        name={EVENT_NAME}
        logoUrl="/landing/example-logo.webp"
        bannerUrl="/landing/example-banner.webp"
      />
      <ExampleTag className="absolute top-3 left-3" />
      <div className="flex flex-col gap-2 p-5 pt-3 sm:pr-10">
        <p className="font-semibold">{EVENT_NAME}</p>
        <EventStatusBadges
          event={{
            registrationOpen: true,
            submissionsOpen: false,
            resultsPublished: false,
          }}
        />
      </div>
    </Screen>
  );
}

const MEMBERS = ["DK", "MA", "SR"];

function TeamPassScreen() {
  return (
    <Screen
      index={1}
      className="order-2 z-10 -mt-2 w-[92%] self-end sm:mt-0 sm:w-auto sm:self-stretch"
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <p className="truncate font-bold tracking-tight">Null Pointers</p>
          <p className="text-small text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">3 of 4</span>{" "}
            members
          </p>
        </div>
        <ExampleTag />
      </div>
      <div className="flex items-center gap-1.5 px-4">
        {MEMBERS.map((m) => (
          <span
            key={m}
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
          >
            {m}
          </span>
        ))}
        <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-foreground/25 text-muted-foreground">
          <UserPlusIcon className="size-3.5" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t bg-muted/40 px-4 pt-3 pb-4">
        <div>
          <p className="text-small text-muted-foreground">Invite code</p>
          <p className="font-mono text-2xl leading-tight font-semibold tracking-[0.16em] tabular-nums">
            K7QM2X
          </p>
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium">
          <CopyIcon className="size-3.5" />
          Copy
        </span>
      </div>
    </Screen>
  );
}

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function ScorecardScreen() {
  return (
    <Screen index={2} className="order-3 hidden sm:block">
      <div className="flex items-center justify-between gap-3 border-b py-2.5 pr-10 pl-4">
        <p className="truncate text-small text-muted-foreground">
          Scorecard
        </p>
        <ExampleTag />
      </div>
      <div className="flex flex-col gap-2 py-4 pr-10 pl-4">
        <div className="flex items-baseline gap-2">
          <span className="flex-1 font-medium">
            Innovation{" "}
            <span className="text-small font-normal text-muted-foreground">
              40%
            </span>
          </span>
          <span className="font-mono text-small text-muted-foreground tabular-nums">
            <span className="text-foreground">8</span> / 10
          </span>
        </div>
        {/* The phone scorecard's six-column grid of score buttons. */}
        <div className="grid grid-cols-6 gap-1.5">
          {SCORES.map((s) => (
            <span
              key={s}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border font-mono text-xs tabular-nums",
                s === 8
                  ? "border-foreground bg-foreground font-semibold text-background"
                  : "border-input text-foreground",
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </Screen>
  );
}

const RANKING = [
  { rank: 1, team: "Null Pointers", project: "Campus route planner", total: "91.4" },
  { rank: 2, team: "Silk Road Devs", project: "Canteen queue tracker", total: "84.0" },
];

function RankingScreen() {
  return (
    <Screen
      index={3}
      className="order-4 z-20 -mt-2 w-[92%] self-start sm:mt-0 sm:w-auto sm:self-stretch"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <p className="truncate text-small text-muted-foreground">
          Final ranking
        </p>
        <ExampleTag />
      </div>
      <ol>
        {RANKING.map((row) => {
          const leader = row.rank === 1;
          return (
            <li
              key={row.team}
              className={cn(
                "flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0",
                leader &&
                  "bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent)]",
              )}
            >
              <span
                className={cn(
                  "inline-flex w-9 items-center gap-1 font-mono text-base font-semibold tabular-nums",
                  leader ? "text-primary" : "text-primary/70",
                )}
              >
                {leader && <TrophyIcon className="size-3.5 text-live" />}
                {row.rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.team}</span>
                <span className="block truncate text-small text-muted-foreground">
                  {row.project}
                </span>
              </span>
              <span
                className={cn(
                  "font-mono text-xl font-semibold tabular-nums",
                  leader ? "text-primary" : "text-foreground",
                )}
              >
                {row.total}
              </span>
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}

export function ProductCollage({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      inert
      className={cn(
        "flex flex-col select-none sm:grid sm:grid-cols-2 sm:items-start",
        className,
      )}
    >
      {/* display: contents on phones, so all four join one column (ordered
          by order-*); a column each from sm. */}
      <div className="contents sm:flex sm:flex-col sm:gap-5">
        <EventScreen />
        <ScorecardScreen />
      </div>
      <div className="contents sm:relative sm:z-10 sm:-ml-8 sm:mt-16 sm:flex sm:flex-col sm:gap-5">
        <TeamPassScreen />
        <RankingScreen />
      </div>
    </div>
  );
}
