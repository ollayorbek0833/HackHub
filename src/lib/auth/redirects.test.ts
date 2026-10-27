import { describe, expect, it } from "vitest";

import { isAuthPath, isProtectedPath, safeCallbackUrl } from "./redirects";

describe("isProtectedPath", () => {
  it("protects the signed-in areas from docs/07", () => {
    for (const path of [
      "/my-events",
      "/profile",
      "/profile/abc",
      "/events/abc/team",
      "/events/abc/team/submit",
      "/judge",
      "/judge/teams/abc",
      "/organizer",
      "/organizer/events/abc/criteria",
    ]) {
      expect(isProtectedPath(path), path).toBe(true);
    }
  });

  it("leaves public pages alone", () => {
    for (const path of [
      "/",
      "/events",
      "/events/abc",
      "/login",
      "/register",
      "/judgement",
      "/events/abc/teams-list",
    ]) {
      expect(isProtectedPath(path), path).toBe(false);
    }
  });
});

describe("isAuthPath", () => {
  it("matches only /login and /register", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/register")).toBe(true);
    expect(isAuthPath("/login/x")).toBe(false);
    expect(isAuthPath("/")).toBe(false);
  });
});

describe("safeCallbackUrl", () => {
  it("keeps same-site paths with their query", () => {
    expect(safeCallbackUrl("/judge")).toBe("/judge");
    expect(safeCallbackUrl("/events/abc/team?x=1")).toBe(
      "/events/abc/team?x=1",
    );
  });

  it("refuses other sites and non-strings", () => {
    expect(safeCallbackUrl("https://evil.com")).toBeNull();
    expect(safeCallbackUrl("//evil.com")).toBeNull();
    expect(safeCallbackUrl("/\\evil.com")).toBeNull();
    expect(safeCallbackUrl("/\t/evil.com")).toBeNull();
    expect(safeCallbackUrl("judge")).toBeNull();
    expect(safeCallbackUrl("")).toBeNull();
    expect(safeCallbackUrl(null)).toBeNull();
  });
});
