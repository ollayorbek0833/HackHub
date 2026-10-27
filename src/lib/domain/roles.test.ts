import { describe, expect, it } from "vitest";

import { nextRole, ROLE_MESSAGES, roleChangeError, type RoleChangeTarget } from "./roles";

const user = (overrides: Partial<RoleChangeTarget> = {}): RoleChangeTarget => ({
  id: "u1",
  role: "PARTICIPANT",
  displayName: "Ana",
  teamEvents: [],
  ...overrides,
});

describe("nextRole", () => {
  it("switches participant and judge, and leaves organizers alone", () => {
    expect(nextRole("PARTICIPANT")).toBe("JUDGE");
    expect(nextRole("JUDGE")).toBe("PARTICIPANT");
    expect(nextRole("ORGANIZER")).toBeNull();
  });
});

describe("roleChangeError (Decision 11, TC-76)", () => {
  it("lets an organizer make a participant a judge, and back", () => {
    expect(roleChangeError("org", user(), "JUDGE")).toBeNull();
    expect(roleChangeError("org", user({ role: "JUDGE" }), "PARTICIPANT")).toBeNull();
  });

  it("refuses a participant who is on a team, naming the event", () => {
    expect(
      roleChangeError("org", user({ teamEvents: ["Demo Hack"] }), "JUDGE"),
    ).toBe("Ana is on a team in Demo Hack, so they can't become a judge.");
  });

  it("refuses organizers, as target or as the new role", () => {
    expect(roleChangeError("org", user({ role: "ORGANIZER" }), "JUDGE")).toBe(
      ROLE_MESSAGES.organizer,
    );
    expect(roleChangeError("org", user(), "ORGANIZER")).toBe(ROLE_MESSAGES.organizer);
  });

  it("refuses changing your own role", () => {
    expect(roleChangeError("u1", user({ role: "JUDGE" }), "PARTICIPANT")).toBe(
      ROLE_MESSAGES.self,
    );
  });

  it("refuses a change to the role the user already has", () => {
    expect(roleChangeError("org", user(), "PARTICIPANT")).toBe(ROLE_MESSAGES.unchanged);
  });
});

describe("ROLE_MESSAGES.changed", () => {
  it("uses the docs/08 toast text", () => {
    expect(ROLE_MESSAGES.changed("Ana", "JUDGE")).toBe("Ana is now a judge.");
    expect(ROLE_MESSAGES.changed("Ana", "PARTICIPANT")).toBe("Ana is now a participant.");
  });
});
