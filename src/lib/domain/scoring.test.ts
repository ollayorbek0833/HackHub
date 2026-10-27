import { describe, expect, it } from "vitest";

import {
  nextTeamToScore,
  planScoreChanges,
  parseScore,
  SCORING_MESSAGES,
  scoringBlockedReason,
  scoringStatus,
  type ScoringStatus,
} from "./scoring";

describe("scoringStatus", () => {
  it("is Not started, In progress or Scored by how many criteria have a score", () => {
    expect(scoringStatus(0, 3)).toBe("NOT_STARTED");
    expect(scoringStatus(2, 3)).toBe("IN_PROGRESS");
    expect(scoringStatus(3, 3)).toBe("SCORED");
  });

  it("is never Scored without criteria", () => {
    expect(scoringStatus(0, 0)).toBe("NOT_STARTED");
  });
});

describe("scoringBlockedReason (Decision 2, TC-04, TC-08)", () => {
  const open = { submissionsOpen: false, resultsPublished: false, criteriaCount: 3 };

  it("allows scoring once submissions close, until results are published", () => {
    expect(scoringBlockedReason(open)).toBeNull();
  });

  it("refuses while submissions are open, after publishing, and without criteria", () => {
    expect(scoringBlockedReason({ ...open, submissionsOpen: true })).toBe(
      SCORING_MESSAGES.submissionsOpen,
    );
    expect(scoringBlockedReason({ ...open, resultsPublished: true })).toBe(
      SCORING_MESSAGES.published,
    );
    expect(scoringBlockedReason({ ...open, criteriaCount: 0 })).toBe(SCORING_MESSAGES.noCriteria);
  });
});

describe("parseScore (TC-02, TC-07)", () => {
  it("accepts whole numbers from 0 to the max", () => {
    expect(parseScore("0", 10)).toEqual({ ok: true, value: 0 });
    expect(parseScore(" 10 ", 10)).toEqual({ ok: true, value: 10 });
  });

  it("treats empty as not scored", () => {
    expect(parseScore("", 10)).toEqual({ ok: true, value: null });
    expect(parseScore("  ", 10)).toEqual({ ok: true, value: null });
  });

  it("refuses out of range, negative, decimal and non-numbers", () => {
    for (const raw of ["11", "-1", "7.5", "abc", "1e1", "+3"]) {
      expect(parseScore(raw, 10), raw).toEqual({
        ok: false,
        error: "Enter a whole number from 0 to 10.",
      });
    }
  });
});

describe("planScoreChanges", () => {
  const criteria = [
    { id: "a", maxScore: 10 },
    { id: "b", maxScore: 5 },
    { id: "c", maxScore: 10 },
  ];

  it("upserts typed scores, deletes only boxes submitted blank, keeps missing ones", () => {
    expect(planScoreChanges(criteria, { a: "7", b: "" })).toEqual({
      errors: {},
      upserts: [{ criterionId: "a", value: 7 }],
      deletes: ["b"],
    });
  });

  it("refuses junk such as 1e instead of treating it as empty (review on #35)", () => {
    expect(planScoreChanges(criteria, { a: "1e", b: "6", c: "" })).toEqual({
      errors: {
        a: "Enter a whole number from 0 to 10.",
        b: "Enter a whole number from 0 to 5.",
      },
      upserts: [],
      deletes: ["c"],
    });
  });
});

describe("nextTeamToScore", () => {
  const teams = (statuses: ScoringStatus[]) =>
    statuses.map((status, i) => ({ id: `t${i}`, status }));

  it("finds the next unscored team after the current one, wrapping round", () => {
    const list = teams(["NOT_STARTED", "SCORED", "SCORED", "IN_PROGRESS"]);
    expect(nextTeamToScore(list, "t1")?.id).toBe("t3");
    expect(nextTeamToScore(list, "t3")?.id).toBe("t0");
  });

  it("never returns the current team, and null when the rest are scored", () => {
    expect(nextTeamToScore(teams(["IN_PROGRESS", "SCORED"]), "t0")).toBeNull();
    expect(nextTeamToScore(teams(["SCORED"]), "t0")).toBeNull();
  });
});
