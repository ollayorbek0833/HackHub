import { describe, expect, it } from "vitest";

import { setUserRoleSchema, usersFilterSchema } from "./roles";

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
