import { describe, expect, it } from "vitest";

import {
  ALREADY_REGISTERED,
  compareMyEvents,
  isProfileComplete,
  PROFILE_INCOMPLETE,
  REGISTRATION_CLOSED,
  registrationRefusal,
} from "./registration";

const open = { registrationOpen: true };
const closed = { registrationOpen: false };
const profile = { name: "Aziza Karimova", faculty: "Computer Science" };

describe("isProfileComplete", () => {
  it("needs both a name and a faculty", () => {
    expect(isProfileComplete(profile)).toBe(true);
    expect(isProfileComplete({ name: "Aziza", faculty: "" })).toBe(false);
    expect(isProfileComplete({ name: "  ", faculty: "CS" })).toBe(false);
  });

  it("is false without a profile", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete(undefined)).toBe(false);
  });
});

describe("registrationRefusal", () => {
  it("allows a participant with a profile while registration is open (TC-41)", () => {
    expect(
      registrationRefusal({ event: open, profile, alreadyRegistered: false }),
    ).toBeNull();
  });

  it("refuses while registration is closed (TC-38, TC-43)", () => {
    expect(
      registrationRefusal({ event: closed, profile, alreadyRegistered: false }),
    ).toBe(REGISTRATION_CLOSED);
  });

  it("refuses a second registration (TC-39, TC-42)", () => {
    expect(
      registrationRefusal({ event: open, profile, alreadyRegistered: true }),
    ).toBe(ALREADY_REGISTERED);
  });

  it("refuses until the profile has a name and faculty", () => {
    expect(
      registrationRefusal({
        event: open,
        profile: null,
        alreadyRegistered: false,
      }),
    ).toBe(PROFILE_INCOMPLETE);
  });

  it("says closed before profile incomplete", () => {
    expect(
      registrationRefusal({
        event: closed,
        profile: null,
        alreadyRegistered: false,
      }),
    ).toBe(REGISTRATION_CLOSED);
  });
});

describe("compareMyEvents", () => {
  const event = (name: string, start: string, resultsPublished = false) => ({
    name,
    startDate: new Date(`${start}T00:00:00Z`),
    resultsPublished,
  });

  it("puts unpublished events first, each group by start date", () => {
    const list = [
      event("Old results", "2026-09-01", true),
      event("Later", "2026-11-10"),
      event("Newer results", "2026-10-01", true),
      event("Sooner", "2026-10-29"),
    ];
    expect(list.sort(compareMyEvents).map((e) => e.name)).toEqual([
      "Sooner",
      "Later",
      "Old results",
      "Newer results",
    ]);
  });
});
