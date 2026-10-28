"use client";

import { CalculatorIcon, ScaleIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { DrawIn } from "@/components/landing/draw-in";
import { LandingSection } from "@/components/landing/section";
import { Badge } from "@/components/ui/badge";
import {
  rankTeams,
  type RankCriterion,
  type RankScore,
  type RankTeam,
} from "@/lib/domain/ranking";
import { cn } from "@/lib/utils";

import styles from "./fair-judging.module.css";

// Landing > Fair judging (agent-briefs/landing.md, PRODUCT.md > Product
// Principles: "the rules are explicit, the weights add up, and the ranking can
// be explained"). Three short points, then a small worked example marked
// "Example". The example's totals and ranks come from the app's own rankTeams
// (lib/domain/ranking) on the static sample below, at render time, so the
// landing page can't drift from how a real ranking is computed.
//
// Motion, once, as the example scrolls into view, and only with motion allowed:
// the three points rise in; each team's points bar fills and its total counts
// up with it (Total), team after team in rank order; the leader's rank glows
// amber once. The server renders every final value and every full bar, so the
// section is complete without JavaScript, without IntersectionObserver and
// with reduced motion (see fair-judging.module.css, DrawIn and Total).

type ExampleCriterion = RankCriterion & { name: string };
type ExampleTeam = RankTeam & { name: string };

const JUDGES = ["judge-1", "judge-2"] as const;

const CRITERIA: ExampleCriterion[] = [
  { id: "innovation", name: "Innovation", weightPercent: 40, maxScore: 10 },
  { id: "execution", name: "Execution", weightPercent: 35, maxScore: 10 },
  { id: "presentation", name: "Presentation", weightPercent: 25, maxScore: 10 },
];

const TEAMS: ExampleTeam[] = [
  { id: "bytes", name: "Bytes of Bukhara", hasSubmission: true },
  { id: "kompas", name: "Team Kompas", hasSubmission: true },
  { id: "nosleep", name: "NoSleep.js", hasSubmission: true },
];

/** Team id → criterion id → [judge 1, judge 2], each out of the max score. */
const SCORES: Record<string, Record<string, readonly [number, number]>> = {
  bytes: { innovation: [7, 7], execution: [9, 9], presentation: [8, 8] },
  kompas: { innovation: [9, 8], execution: [8, 8], presentation: [7, 9] },
  nosleep: { innovation: [6, 8], execution: [7, 7], presentation: [10, 8] },
};

/** The sample input, in the shape rankTeams takes. */
export const FAIR_JUDGING_SAMPLE = {
  criteria: CRITERIA,
  teams: TEAMS,
  judges: JUDGES,
  scores: TEAMS.flatMap((team) =>
    CRITERIA.flatMap((criterion) =>
      JUDGES.map((judgeId, j): RankScore => ({
        teamId: team.id,
        criterionId: criterion.id,
        judgeId,
        value: SCORES[team.id][criterion.id][j],
      })),
    ),
  ),
};

export type FairJudgingRow = {
  criterion: ExampleCriterion;
  /** One score per judge, in JUDGES order. */
  scores: number[];
  average: number;
  /** average ÷ max score × weight: this criterion's share of the total. */
  points: number;
};

export type FairJudgingTeam = {
  team: ExampleTeam;
  rank: number;
  /** 0–100, from rankTeams. */
  total: number;
  rows: FairJudgingRow[];
};

/** The worked example: rankTeams on the sample, best first, with each row. */
export function fairJudgingExample(): FairJudgingTeam[] {
  const { criteria, teams, scores } = FAIR_JUDGING_SAMPLE;
  return rankTeams({ criteria, teams, scores }).ranked.map((ranked) => ({
    team: ranked.team,
    rank: ranked.rank,
    total: ranked.total,
    rows: criteria.map((criterion) => {
      const values = JUDGES.map(
        (judgeId) =>
          scores.find(
            (s) =>
              s.teamId === ranked.team.id &&
              s.criterionId === criterion.id &&
              s.judgeId === judgeId,
          )?.value ?? 0,
      );
      return {
        criterion,
        scores: values,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        points: ranked.normalized[criterion.id] * criterion.weightPercent,
      };
    }),
  }));
}

/** One decimal, as the app shows totals (docs/03 > Ranking calculation). */
export const oneDecimal = (n: number) => n.toFixed(1);

const POINTS = [
  {
    icon: ScaleIcon,
    title: "Weights add up to exactly 100",
    text: "Organizers give each criterion a whole-percent weight. The criteria can't be saved until the weights total 100%, and they lock once judges start scoring.",
  },
  {
    icon: UsersIcon,
    title: "Every judge scores every team",
    text: "Each judge scores every submitted team on every criterion, on the same scale.",
  },
  {
    icon: CalculatorIcon,
    title: "The ranking shows its working",
    text: "Totals are computed from the judges' scores, never typed in, so any result can be traced back to them.",
  },
];

const NUM = "font-mono tabular-nums";
// The score table has to fit a 292 px card at 360 px, so phones get tighter
// gutters and the short "J1"/"J2" headers; only the wide single-card layout
// (sm to lg) has room for "Judge 1".
/** The table's outer gutters, matching the card header from sm up. */
const FIRST = "pl-3 sm:pl-4";
const LAST = "pr-3 sm:pr-4";
/** A number column: right-aligned, with room between neighbouring figures. */
const CELL = "py-2 pl-2 text-right whitespace-nowrap sm:pl-3";
/** A judge's column: centred under its header, so it never crowds "Avg". */
const JUDGE_CELL = "py-2 pl-2 text-center whitespace-nowrap sm:pl-3";
/** The stagger position, read by fair-judging.module.css. */
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * A team's total. It counts up with its card's points bar, frame by frame,
 * so the number and the bar start and land together. Nothing starts it but
 * its card's DrawIn reveal:
 * - When DrawIn holds the card back (idle: below the fold, motion allowed),
 *   it shows 0.0, the same as the empty bar.
 * - When the card is revealed (done), each frame it shows the value times how
 *   far the bar has filled (its rendered scale, from the transition in
 *   fair-judging.module.css), so it only goes up and lands exactly on the
 *   value when the bar is full.
 * - Otherwise (no JavaScript, no IntersectionObserver, reduced motion, or the
 *   card on screen at load) DrawIn never holds the card back, so it shows the
 *   final value and never moves. It never shows the final value first and then
 *   drops.
 * Screen readers only ever get the final value.
 */
function Total({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    // This runs before DrawIn's effect (children first), so it sees "idle".
    const card = ref.current?.closest<HTMLElement>("[data-draw-item]");
    const fill = card?.querySelector<HTMLElement>("[data-points-fill]");
    if (!card || !fill) return;

    let held = false;
    let frame = 0;
    /** How far the bar has filled, 0–1 (its scaleX; "none" once full). */
    const filled = () => {
      const transform = getComputedStyle(fill).transform;
      if (transform === "none") return 1;
      return Math.min(1, Math.max(0, new DOMMatrixReadOnly(transform).a));
    };
    const count = () => {
      const share = filled();
      setShown(share < 1 ? value * share : value);
      if (share < 1) frame = requestAnimationFrame(count);
    };

    const observer = new MutationObserver(() => {
      const state = card.dataset.draw;
      if (state === "idle") {
        held = true;
        setShown(0);
      } else if (state === "done" && held) {
        observer.disconnect();
        frame = requestAnimationFrame(count);
      }
    });
    observer.observe(card, {
      attributes: true,
      attributeFilter: ["data-draw"],
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref}>
      <span aria-hidden>{oneDecimal(shown)}</span>
      {/* Not selectable, so copying the card gives the number once. */}
      <span className="sr-only select-none">{oneDecimal(value)}</span>
    </span>
  );
}

/**
 * The total out of 100 as a bar, split into each criterion's points in table
 * order, with a gap between them. DESIGN.md > Ranking (the fixed ramp): only
 * the leader is full-strength amber; ranks 2 and below are amber at 70%. Both
 * are at least 3:1 against the track (5.7:1 and 4.2:1), and the gaps show the
 * track, so each segment stands apart. One colour per bar, not one per
 * criterion: amber only clears 3:1 on the track from about 60% up, too narrow
 * for three steps anyone could tell apart.
 */
function PointsBar({ entry }: { entry: FairJudgingTeam }) {
  const leader = entry.rank === 1;
  return (
    <div
      aria-hidden
      className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10"
    >
      <div
        data-points-fill
        className={cn(styles.fill, "flex h-full gap-0.5")}
        style={{ width: `${entry.total}%` }}
      >
        {entry.rows.map((row) => (
          <span
            key={row.criterion.id}
            className={cn("h-full", leader ? "bg-primary" : "bg-primary/70")}
            style={{ flex: `${row.points} 1 0` }}
          />
        ))}
      </div>
    </div>
  );
}

function TeamCard({
  entry,
  index,
}: {
  entry: FairJudgingTeam;
  /** Position in rank order, for the stagger. */
  index: number;
}) {
  const leader = entry.rank === 1;
  const headingId = `fair-judging-${entry.team.id}`;
  return (
    <li
      data-draw-item
      style={stagger(index)}
      className={cn(
        styles.card,
        "flex min-w-0 flex-col rounded-xl border bg-card text-card-foreground",
        leader && "border-primary/45 bg-primary/10",
      )}
    >
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex w-9 shrink-0 items-center gap-1 text-xl font-semibold",
              NUM,
              leader ? "text-primary" : "text-primary/70",
              leader && styles.leaderGlow,
            )}
          >
            <span className="sr-only">Rank </span>
            {entry.rank}
            {leader && (
              <TrophyIcon
                role="img"
                aria-label="Leader"
                className="size-4 text-live"
              />
            )}
          </span>
          <h4
            id={headingId}
            className="min-w-0 flex-1 font-semibold break-words"
          >
            {entry.team.name}
          </h4>
          <p className="shrink-0 text-right whitespace-nowrap">
            <span className="sr-only">Total </span>
            {/* Four tabular figures wide, so counting up never shifts it. */}
            <span
              data-total
              className={cn(
                "inline-block min-w-[4ch] text-right text-2xl font-semibold",
                NUM,
              )}
            >
              <Total value={entry.total} />
            </span>
            <span className="text-small text-muted-foreground"> / 100</span>
          </p>
        </div>
        <PointsBar entry={entry} />
      </div>

      <table
        aria-labelledby={headingId}
        className="w-full border-collapse text-left text-small"
      >
        <thead className="text-muted-foreground">
          <tr>
            <th scope="col" className={cn("py-2 font-medium", FIRST)}>
              Criterion
            </th>
            {JUDGES.map((_, j) => (
              <th key={j} scope="col" className={cn(JUDGE_CELL, "font-medium")}>
                {/* "J1" on phones and in the three-up cards, "Judge 1" between. */}
                <span aria-hidden>
                  <span className="sm:hidden lg:inline">J</span>
                  <span className="hidden sm:inline lg:hidden">Judge </span>
                  {j + 1}
                </span>
                <span className="sr-only">Judge {j + 1}</span>
              </th>
            ))}
            <th scope="col" className={cn(CELL, "font-medium")}>
              Avg
            </th>
            <th
              scope="col"
              className={cn("py-2 pl-2 text-right font-medium sm:pl-3", LAST)}
            >
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {entry.rows.map((row) => (
            <tr key={row.criterion.id} className="border-t">
              <th
                scope="row"
                className={cn("py-2 text-left font-normal", FIRST)}
              >
                <span className="block break-words text-foreground">
                  {row.criterion.name}
                </span>
                <span className={cn("block text-muted-foreground", NUM)}>
                  {row.criterion.weightPercent}%
                </span>
              </th>
              {row.scores.map((score, j) => (
                <td key={j} className={cn(JUDGE_CELL, NUM)}>
                  {score}
                </td>
              ))}
              <td className={cn(CELL, NUM)}>{oneDecimal(row.average)}</td>
              <td
                className={cn(
                  "py-2 pl-2 text-right font-semibold text-foreground sm:pl-3",
                  LAST,
                  NUM,
                )}
              >
                {oneDecimal(row.points)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </li>
  );
}

export function FairJudging() {
  const example = fairJudgingExample();
  const { criteria } = FAIR_JUDGING_SAMPLE;
  // The first row of the winning team, written out as a worked sum.
  const shown = example[0];
  const step = shown.rows[0];
  const maxScores = new Set(criteria.map((c) => c.maxScore));
  const sameMax = maxScores.size === 1 ? [...maxScores][0] : null;

  return (
    <LandingSection
      id="fair-judging"
      eyebrow="Fair judging"
      title="Judging that's visibly fair"
      intro="The rules are set before anyone scores, and every total in the ranking can be traced back to the judges' scores."
    >
      <DrawIn>
        <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
          {POINTS.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              data-draw-item
              style={stagger(i)}
              className={cn(styles.point, "flex flex-col gap-2")}
            >
              <Icon aria-hidden className="size-5 text-primary" />
              <h3 className="font-semibold text-balance">{title}</h3>
              <p className="text-pretty text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </DrawIn>

      <figure
        aria-labelledby="fair-judging-example"
        className="mt-10 rounded-2xl border p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 id="fair-judging-example" className="font-semibold">
            How a ranking is worked out
          </h3>
          <Badge variant="outline">Example</Badge>
        </div>

        <p className="mt-2 text-pretty text-muted-foreground">
          Three criteria
          {sameMax !== null && <>, each scored out of {sameMax}</>}:{" "}
          {criteria.map((c, i) => (
            <span key={c.id}>
              {i > 0 && (i === criteria.length - 1 ? " and " : ", ")}
              <span className="text-foreground">{c.name}</span>{" "}
              <span className={NUM}>{c.weightPercent}%</span>
            </span>
          ))}
          . Two judges (J1 and J2) score three teams. The bar under each total
          splits it into each criterion&apos;s points, in table order.
        </p>

        <div className="mt-4 rounded-lg bg-muted px-4 py-3">
          <p className="font-medium text-pretty">
            Points for a criterion = the judges&apos; average ÷ the max score ×
            the weight. The total adds up the points for every criterion, out of
            100.
          </p>
          <p className="mt-2 text-small text-muted-foreground">
            {shown.team.name}, {step.criterion.name}:{" "}
            <span className={NUM}>
              ({step.scores.join(" + ")}) ÷ {step.scores.length} ={" "}
              {oneDecimal(step.average)}
            </span>
            , then{" "}
            <span className={NUM}>
              {oneDecimal(step.average)} ÷ {step.criterion.maxScore} ×{" "}
              {step.criterion.weightPercent} = {oneDecimal(step.points)}
            </span>{" "}
            points.
          </p>
        </div>

        <DrawIn className="mt-6">
          <ol
            aria-label="Example ranking, best first"
            className="grid gap-4 lg:grid-cols-3"
          >
            {example.map((entry, i) => (
              <TeamCard key={entry.team.id} entry={entry} index={i} />
            ))}
          </ol>
        </DrawIn>

        <figcaption className="mt-4 text-small text-pretty text-muted-foreground">
          Sample teams and scores. The totals and ranks are computed by the same
          code that ranks real events.
        </figcaption>
      </figure>
    </LandingSection>
  );
}
