import { describe, expect, it } from "vitest";

import { submissionPhase } from "@/lib/domain/submission";

// docs/08 > Submit project: the "not open yet", open and closed states.

const base = {
  submissionsOpen: false,
  resultsPublished: false,
  eventHasSubmissions: false,
  endDate: new Date("2026-10-30T00:00:00Z"),
  now: new Date("2026-10-28T10:00:00Z"),
};

describe("submissionPhase", () => {
  it("is open while the switch is on", () => {
    expect(submissionPhase({ ...base, submissionsOpen: true })).toBe("open");
  });

  it("is not open yet before anyone could submit", () => {
    expect(submissionPhase(base)).toBe("not-open");
  });

  it("is closed once the switch is off and a team has submitted (TC-67)", () => {
    expect(submissionPhase({ ...base, eventHasSubmissions: true })).toBe(
      "closed",
    );
  });

  it("is closed after results are published, whatever the switch says", () => {
    expect(
      submissionPhase({
        ...base,
        submissionsOpen: true,
        resultsPublished: true,
      }),
    ).toBe("closed");
  });

  it("is closed once the last day is over in GMT+5", () => {
    // 30 Oct ends at 31 Oct 00:00 GMT+5, which is 30 Oct 19:00 UTC.
    expect(
      submissionPhase({ ...base, now: new Date("2026-10-30T18:59:59Z") }),
    ).toBe("not-open");
    expect(
      submissionPhase({ ...base, now: new Date("2026-10-30T19:00:00Z") }),
    ).toBe("closed");
  });
});
