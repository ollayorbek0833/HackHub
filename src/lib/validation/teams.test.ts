import { describe, expect, it } from "vitest";

import { createTeamSchema, joinTeamSchema } from "./teams";

const errorsOf = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.message);

describe("createTeamSchema", () => {
  it("accepts 2 to 40 characters, trimmed", () => {
    const r = createTeamSchema.safeParse({ name: "  Null Pointers " });
    expect(r.success && r.data.name).toBe("Null Pointers");
  });

  it("asks for a name when it's empty", () => {
    expect(errorsOf(createTeamSchema.safeParse({ name: "   " }))).toEqual([
      "Enter a team name.",
    ]);
    expect(errorsOf(createTeamSchema.safeParse({}))).toEqual([
      "Enter a team name.",
    ]);
  });

  it("refuses 1 character and more than 40", () => {
    expect(createTeamSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(createTeamSchema.safeParse({ name: "A".repeat(41) }).success).toBe(
      false,
    );
    expect(createTeamSchema.safeParse({ name: "A".repeat(40) }).success).toBe(
      true,
    );
  });
});

describe("joinTeamSchema", () => {
  it("normalises the code (Decision 4)", () => {
    const r = joinTeamSchema.safeParse({ code: " byteme " });
    expect(r.success && r.data.code).toBe("BYTEME");
  });

  it("asks for 6 characters", () => {
    for (const code of ["", "ABC", "ABCDEFG"]) {
      expect(errorsOf(joinTeamSchema.safeParse({ code }))).toEqual([
        "Enter the 6-character code.",
      ]);
    }
    expect(errorsOf(joinTeamSchema.safeParse({}))).toEqual([
      "Enter the 6-character code.",
    ]);
  });
});
