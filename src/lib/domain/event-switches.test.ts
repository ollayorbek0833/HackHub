import { describe, expect, it } from "vitest";

import {
  SWITCH_MESSAGES,
  criteriaAreSet,
  criteriaStatus,
  publishBlocker,
  registrationBlocker,
  submissionsBlocker,
} from "@/lib/domain/event-switches";

// docs/08 > Event overview; docs/02 > Publishing, Decisions 3 and 6. TC-123.

const event = (submissionsOpen: boolean, resultsPublished: boolean) => ({
  submissionsOpen,
  resultsPublished,
});
const demoCriteria = [
  { weightPercent: 50 },
  { weightPercent: 30 },
  { weightPercent: 20 },
];

describe("criteriaAreSet", () => {
  it("needs at least one criterion", () => {
    expect(criteriaAreSet([])).toBe(false);
  });

  it("needs the weights to total exactly 100%", () => {
    expect(criteriaAreSet(demoCriteria)).toBe(true);
    expect(criteriaAreSet([{ weightPercent: 100 }])).toBe(true);
    expect(criteriaAreSet([{ weightPercent: 50 }, { weightPercent: 40 }])).toBe(
      false,
    );
  });
});

describe("criteriaStatus", () => {
  it("reads Not set, Set or Locked", () => {
    expect(criteriaStatus([], 0)).toBe("Not set");
    expect(criteriaStatus(demoCriteria, 0)).toBe("Set: weights total 100%");
    expect(criteriaStatus(demoCriteria, 1)).toBe("Locked");
  });
});

describe("registrationBlocker", () => {
  it("allows either direction until results are published", () => {
    expect(registrationBlocker(event(false, false))).toBeNull();
    expect(registrationBlocker(event(true, false))).toBeNull();
  });

  it("refuses once results are published", () => {
    expect(registrationBlocker(event(false, true))).toBe(
      SWITCH_MESSAGES.published,
    );
  });
});

describe("submissionsBlocker", () => {
  it("opens and closes freely before any score exists", () => {
    expect(submissionsBlocker(event(false, false), true, 0)).toBeNull();
    expect(submissionsBlocker(event(true, false), false, 0)).toBeNull();
  });

  it("can't reopen once any score exists", () => {
    expect(submissionsBlocker(event(false, false), true, 1)).toBe(
      "Judges have started scoring, so submissions can't reopen.",
    );
  });

  it("can still close while scores exist", () => {
    expect(submissionsBlocker(event(true, false), false, 3)).toBeNull();
  });

  it("refuses any change once results are published", () => {
    expect(submissionsBlocker(event(false, true), true, 0)).toBe(
      SWITCH_MESSAGES.published,
    );
    expect(submissionsBlocker(event(false, true), false, 0)).toBe(
      SWITCH_MESSAGES.published,
    );
  });
});

describe("publishBlocker", () => {
  it("allows publishing with submissions closed and criteria set", () => {
    expect(publishBlocker(event(false, false), demoCriteria)).toBeNull();
  });

  it("refuses while submissions are open", () => {
    expect(publishBlocker(event(true, false), demoCriteria)).toBe(
      "Close submissions first.",
    );
  });

  it("refuses without criteria", () => {
    expect(publishBlocker(event(false, false), [])).toBe(
      "Set the judging criteria first.",
    );
  });

  it("asks to close submissions before asking for criteria", () => {
    expect(publishBlocker(event(true, false), [])).toBe(
      "Close submissions first.",
    );
  });

  it("can't be undone or repeated", () => {
    expect(publishBlocker(event(false, true), demoCriteria)).toBe(
      SWITCH_MESSAGES.published,
    );
  });
});
