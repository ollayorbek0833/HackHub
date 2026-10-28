import { describe, expect, it } from "vitest";

import {
  FAIR_JUDGING_SAMPLE,
  fairJudgingExample,
  oneDecimal,
} from "@/components/landing/fair-judging";
import { validateCriteria, weightTotal } from "@/lib/domain/criteria";
import { rankTeams } from "@/lib/domain/ranking";

// The landing page's worked example must stay a valid event and must show
// exactly what the app's ranking computes.

const { criteria, teams, judges, scores } = FAIR_JUDGING_SAMPLE;

describe("fair judging example", () => {
  it("uses criteria an organizer could save: weights total exactly 100", () => {
    expect(weightTotal(criteria)).toBe(100);
    expect(validateCriteria(criteria)).toEqual([]);
  });

  it("has every judge score every team on every criterion, within the scale", () => {
    expect(judges).toHaveLength(2);
    expect(scores).toHaveLength(teams.length * criteria.length * judges.length);
    for (const team of teams) {
      for (const c of criteria) {
        const given = scores.filter(
          (s) => s.teamId === team.id && s.criterionId === c.id,
        );
        expect(given.map((s) => s.judgeId).sort()).toEqual([...judges].sort());
        for (const s of given) {
          expect(Number.isInteger(s.value)).toBe(true);
          expect(s.value).toBeGreaterThanOrEqual(0);
          expect(s.value).toBeLessThanOrEqual(c.maxScore);
        }
      }
    }
  });

  it("shows the totals and ranks rankTeams computes", () => {
    const ranking = rankTeams({ criteria, teams, scores });
    const shown = fairJudgingExample();

    expect(shown.map((t) => [t.team.id, t.rank, t.total])).toEqual(
      ranking.ranked.map((r) => [r.team.id, r.rank, r.total]),
    );
    // Worked by hand: average ÷ 10 × weight, summed.
    expect(shown.map((t) => [t.team.name, t.rank, oneDecimal(t.total)])).toEqual([
      ["Team Kompas", 1, "82.0"],
      ["Bytes of Bukhara", 2, "79.5"],
      ["NoSleep.js", 3, "75.0"],
    ]);
  });

  it("has rows whose shown points add up to the shown total", () => {
    for (const team of fairJudgingExample()) {
      for (const row of team.rows) {
        const average =
          row.scores.reduce((a, b) => a + b, 0) / row.scores.length;
        expect(row.average).toBe(average);
        expect(row.points).toBeCloseTo(
          (average / row.criterion.maxScore) * row.criterion.weightPercent,
          9,
        );
        // One decimal shows every point value exactly, so nothing is hidden
        // by rounding.
        expect(Number(oneDecimal(row.points))).toBeCloseTo(row.points, 9);
      }
      const sum = team.rows.reduce((n, row) => n + Number(oneDecimal(row.points)), 0);
      expect(oneDecimal(sum)).toBe(oneDecimal(team.total));
    }
  });
});
