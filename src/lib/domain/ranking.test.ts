import { describe, expect, it } from "vitest";

import {
  rankTeams,
  type RankCriterion,
  type RankScore,
  type RankTeam,
} from "@/lib/domain/ranking";

// docs/03 > Ranking calculation, docs/07 > lib/domain (ranking.ts) and
// Decision 10. docs/06 TC-05, TC-101, TC-102, TC-105.

const team = (id: string, hasSubmission = true): RankTeam => ({
  id,
  hasSubmission,
});

const crit = (
  id: string,
  weightPercent: number,
  maxScore = 10,
): RankCriterion => ({ id, weightPercent, maxScore });

const score = (
  teamId: string,
  criterionId: string,
  value: number,
  judgeId = "j1",
): RankScore => ({ teamId, criterionId, judgeId, value });

/** [teamId, rank] pairs in ranked order, the shape most tests assert on. */
const order = (result: ReturnType<typeof rankTeams>) =>
  result.ranked.map((r) => [r.team.id, r.rank]);

describe("rankTeams", () => {
  it("normalizes each criterion by its max score and weights it", () => {
    const result = rankTeams({
      criteria: [crit("idea", 60, 10), crit("demo", 40, 5)],
      teams: [team("a")],
      scores: [score("a", "idea", 5), score("a", "demo", 5)],
    });

    // 60 × 5/10 + 40 × 5/5 = 30 + 40
    expect(result.ranked[0].total).toBeCloseTo(70);
    expect(result.ranked[0].normalized).toEqual({ idea: 0.5, demo: 1 });
  });

  it("averages the judges who scored a criterion (TC-05)", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("a")],
      scores: [
        score("a", "idea", 6, "j1"),
        score("a", "idea", 10, "j2"),
        score("a", "idea", 8, "j3"),
      ],
    });

    expect(result.ranked[0].total).toBeCloseTo(80);
  });

  it("is fair when teams have different numbers of judges", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("a"), team("b")],
      scores: [
        score("a", "idea", 9, "j1"),
        score("b", "idea", 8, "j1"),
        score("b", "idea", 10, "j2"),
      ],
    });

    // b averages 9, the same as a: a tie, not a win for the team with more judges.
    expect(result.ranked[0].total).toBeCloseTo(90);
    expect(result.ranked[1].total).toBeCloseTo(90);
    expect(result.ranked.map((r) => r.rank)).toEqual([1, 1]);
  });

  it("counts a criterion nobody scored as 0 (Decision 10, TC-124)", () => {
    const result = rankTeams({
      criteria: [crit("idea", 50), crit("demo", 50)],
      teams: [team("a")],
      scores: [score("a", "idea", 10)],
    });

    expect(result.ranked[0].total).toBeCloseTo(50);
    expect(result.ranked[0].normalized.demo).toBe(0);
  });

  it("gives every team 0 when there are no scores yet", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("a"), team("b")],
      scores: [],
    });

    expect(result.ranked.map((r) => [r.total, r.rank])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it("sorts by weighted total, highest first (TC-101)", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("low"), team("high"), team("mid")],
      scores: [
        score("low", "idea", 2),
        score("high", "idea", 9),
        score("mid", "idea", 5),
      ],
    });

    expect(order(result)).toEqual([
      ["high", 1],
      ["mid", 2],
      ["low", 3],
    ]);
  });

  it("breaks a tie on the highest-weight criterion, then the next (TC-102)", () => {
    const criteria = [crit("small", 20), crit("big", 50), crit("mid", 30)];
    // Both total 70. b is better on "big" (weight 50), so b wins.
    const result = rankTeams({
      criteria,
      teams: [team("a"), team("b")],
      scores: [
        score("a", "small", 10),
        score("a", "big", 4),
        score("a", "mid", 10),
        score("b", "small", 10),
        score("b", "big", 10),
        score("b", "mid", 0),
      ],
    });

    expect(result.ranked[0].total).toBeCloseTo(70);
    expect(result.ranked[1].total).toBeCloseTo(70);
    expect(order(result)).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("falls through to the next criterion when the highest-weight one is also tied", () => {
    const criteria = [crit("big", 40), crit("mid", 35), crit("small", 25)];
    // a: 20 + 17.5 + 0 = 37.5. b: 20 + 0 + 17.5 = 37.5. Equal on "big",
    // so "mid" (weight 35) decides, and a wins although b is listed first.
    const result = rankTeams({
      criteria,
      teams: [team("b"), team("a")],
      scores: [
        score("a", "big", 5),
        score("a", "mid", 5),
        score("a", "small", 0),
        score("b", "big", 5),
        score("b", "mid", 0),
        score("b", "small", 7),
      ],
    });

    expect(result.ranked[0].total).toBeCloseTo(result.ranked[1].total);
    expect(order(result)).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("shares a rank when teams are tied on every criterion, then skips (1, 2, 2, 4)", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("first"), team("tie1"), team("tie2"), team("last")],
      scores: [
        score("first", "idea", 9),
        score("tie1", "idea", 7),
        score("tie2", "idea", 7),
        score("last", "idea", 3),
      ],
    });

    expect(order(result)).toEqual([
      ["first", 1],
      ["tie1", 2],
      ["tie2", 2],
      ["last", 4],
    ]);
  });

  it("treats totals equal up to floating-point noise as a tie", () => {
    // Both totals are exactly 30⅓, but in floating point a comes out
    // 30.333333333333336 and b 30.333333333333332. Compared raw, a would win
    // on noise; compared rounded, they tie and the weight-52 criterion
    // (b 2/6 against a 1/6) decides for b.
    const result = rankTeams({
      criteria: [crit("x", 39, 9), crit("y", 9, 6), crit("z", 52, 6)],
      teams: [team("a"), team("b")],
      scores: [
        score("a", "x", 5),
        score("a", "y", 0),
        score("a", "z", 1),
        score("b", "x", 3),
        score("b", "y", 0),
        score("b", "z", 2),
      ],
    });

    expect(result.ranked[0].total).toBeCloseTo(result.ranked[1].total);
    expect(order(result)).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("does not rank teams without a submission (Decision 10, TC-105, TC-124)", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("a"), team("ghost", false), team("b")],
      scores: [
        score("a", "idea", 5),
        score("b", "idea", 8),
        score("ghost", "idea", 10),
      ],
    });

    expect(order(result)).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
    expect(result.unranked.map((t) => t.id)).toEqual(["ghost"]);
  });

  it("counts how many judges scored each team", () => {
    const result = rankTeams({
      criteria: [crit("idea", 50), crit("demo", 50)],
      teams: [team("a"), team("b")],
      scores: [
        score("a", "idea", 5, "j1"),
        score("a", "demo", 5, "j1"),
        score("a", "idea", 5, "j2"),
      ],
    });

    const byId = Object.fromEntries(
      result.ranked.map((r) => [r.team.id, r.judgeCount]),
    );
    expect(byId).toEqual({ a: 2, b: 0 });
  });

  it("ignores scores for criteria or teams it wasn't given", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [team("a")],
      scores: [
        score("a", "idea", 5),
        score("a", "other-event-criterion", 10),
        score("stranger", "idea", 10),
      ],
    });

    expect(result.ranked).toHaveLength(1);
    expect(result.ranked[0].total).toBeCloseTo(50);
    expect(result.ranked[0].judgeCount).toBe(1);
  });

  it("keeps the caller's team objects, so pages can render extra fields", () => {
    const result = rankTeams({
      criteria: [crit("idea", 100)],
      teams: [{ id: "a", hasSubmission: true, name: "Byte Me" }],
      scores: [],
    });

    expect(result.ranked[0].team.name).toBe("Byte Me");
  });

  it("returns empty lists for an event with no teams", () => {
    expect(
      rankTeams({ criteria: [crit("idea", 100)], teams: [], scores: [] }),
    ).toEqual({
      ranked: [],
      unranked: [],
    });
  });
});
