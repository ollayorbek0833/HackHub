import { describe, expect, it } from "vitest";

import { setUserRoleSchema, userIdSchema, usersFilterSchema } from "./roles";

describe("userIdSchema", () => {
  it("accepts a cuid and refuses anything else", () => {
    expect(userIdSchema.safeParse("cmvqpyg5b000ajxp118sgjwv1").success).toBe(true);
    for (const bad of ["", "x".repeat(65), "a b", "id'--", 42, null]) {
      expect(userIdSchema.safeParse(bad).success, String(bad)).toBe(false);
    }
  });
});

describe("setUserRoleSchema", () => {
  it("accepts only participant or judge", () => {
    expect(setUserRoleSchema.safeParse({ role: "JUDGE" }).success).toBe(true);
    expect(setUserRoleSchema.safeParse({ role: "PARTICIPANT" }).success).toBe(true);
    expect(setUserRoleSchema.safeParse({ role: "ORGANIZER" }).success).toBe(false);
    expect(setUserRoleSchema.safeParse({}).success).toBe(false);
  });
});

describe("usersFilterSchema", () => {
  it("trims the query and ignores an unknown role", () => {
    expect(usersFilterSchema.parse({ q: "  ana ", role: "ADMIN" })).toEqual({
      q: "ana",
      role: undefined,
    });
    expect(usersFilterSchema.parse({})).toEqual({ q: "", role: undefined });
    expect(usersFilterSchema.parse({ q: ["a", "b"], role: "JUDGE" })).toEqual({
      q: "",
      role: "JUDGE",
    });
  });
});
