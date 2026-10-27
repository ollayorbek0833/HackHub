import { describe, expect, it } from "vitest";

import {
  ALREADY_ON_TEAM,
  canJoin,
  canLeave,
  isTeamFull,
  joinRefusal,
  NOT_REGISTERED,
  TEAM_SUBMITTED,
  teamFullMessage,
  type JoinCheck,
} from "./teams";

const ok: JoinCheck = {
  registered: true,
  alreadyOnTeam: false,
  memberCount: 2,
  maxTeamSize: 4,
  submitted: false,
};

describe("joinRefusal / canJoin", () => {
  it("lets a registered participant without a team join a team with room (TC-15, TC-21)", () => {
    expect(joinRefusal(ok)).toBeNull();
    expect(canJoin(ok)).toBe(true);
  });

  it("refuses participants who aren't registered for the event (TC-16)", () => {
    expect(joinRefusal({ ...ok, registered: false })).toBe(NOT_REGISTERED);
  });

  it("refuses a second team in the same event (TC-17, TC-22)", () => {
    expect(joinRefusal({ ...ok, alreadyOnTeam: true })).toBe(ALREADY_ON_TEAM);
    expect(canJoin({ ...ok, alreadyOnTeam: true })).toBe(false);
  });

  it("refuses a full team, naming the max size", () => {
    expect(joinRefusal({ ...ok, memberCount: 4 })).toBe(teamFullMessage(4));
    expect(teamFullMessage(4)).toBe("This team is full (4 members).");
    expect(joinRefusal({ ...ok, memberCount: 3 })).toBeNull();
  });

  it("refuses a team that has submitted", () => {
    expect(joinRefusal({ ...ok, submitted: true })).toBe(TEAM_SUBMITTED);
  });

  it("works with a max team size of 1", () => {
    expect(joinRefusal({ ...ok, memberCount: 1, maxTeamSize: 1 })).toBe(
      teamFullMessage(1),
    );
  });
});

describe("canLeave", () => {
  it("allows leaving until the team submits (TC-18, Decision 9)", () => {
    expect(canLeave({ submitted: false })).toBe(true);
    expect(canLeave({ submitted: true })).toBe(false);
  });
});

describe("isTeamFull", () => {
  it("is full at the max size", () => {
    expect(isTeamFull(4, 4)).toBe(true);
    expect(isTeamFull(3, 4)).toBe(false);
  });
});
