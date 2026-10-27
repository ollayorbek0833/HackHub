import { describe, expect, it } from "vitest";

import {
  canRegister,
  canScore,
  canSubmit,
  isListed,
  validateEventDates,
} from "@/lib/domain/event-state";

// docs/07 > lib/domain; docs/02 Decisions 2 and 5.

const event = (
  registrationOpen: boolean,
  submissionsOpen: boolean,
  resultsPublished: boolean,
) => ({ registrationOpen, submissionsOpen, resultsPublished });

describe("canRegister (TC-35)", () => {
  it("follows the registration switch", () => {
    expect(canRegister(event(true, false, false))).toBe(true);
    expect(canRegister(event(false, false, false))).toBe(false);
  });

  it("ignores the other switches", () => {
    expect(canRegister(event(true, true, true))).toBe(true);
    expect(canRegister(event(false, true, false))).toBe(false);
  });
});

describe("canSubmit (TC-35, TC-67)", () => {
  it("is allowed while submissions are open", () => {
    expect(canSubmit(event(false, true, false))).toBe(true);
  });

  it("is refused while submissions are closed", () => {
    expect(canSubmit(event(true, false, false))).toBe(false);
  });

  it("is refused once results are published, even if the switch is on", () => {
    expect(canSubmit(event(false, true, true))).toBe(false);
  });
});

describe("canScore", () => {
  it("is allowed once submissions close (Decision 2)", () => {
    expect(canScore(event(false, false, false))).toBe(true);
    expect(canScore(event(true, false, false))).toBe(true);
  });

  it("is refused while submissions are open", () => {
    expect(canScore(event(false, true, false))).toBe(false);
  });

  it("is refused once results are published", () => {
    expect(canScore(event(false, false, true))).toBe(false);
  });
});

describe("isListed", () => {
  it("lists an event only while registration is open (Decision 5)", () => {
    expect(isListed(event(true, false, false))).toBe(true);
    expect(isListed(event(false, true, false))).toBe(false);
  });
});

describe("validateEventDates", () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  it("accepts an end after the start", () => {
    expect(validateEventDates(day("2026-10-28"), day("2026-10-30"))).toBe(true);
  });

  it("accepts an event that starts and ends on the same day", () => {
    expect(validateEventDates(day("2026-10-28"), day("2026-10-28"))).toBe(true);
  });

  it("refuses an end before the start", () => {
    expect(validateEventDates(day("2026-10-28"), day("2026-10-27"))).toBe(
      false,
    );
  });
});
