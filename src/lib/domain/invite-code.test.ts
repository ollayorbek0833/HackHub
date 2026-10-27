import { describe, expect, it } from "vitest";

import {
  generateInviteCode,
  INVITE_CODE_ALPHABET,
  normalizeInviteCode,
} from "./invite-code";

describe("generateInviteCode", () => {
  it("builds 6 characters from the alphabet with the given random source", () => {
    const picks = [0, 1, 2, 29, 30, 31];
    let i = 0;
    const code = generateInviteCode(() => picks[i++]);
    expect(code).toBe("ABC789");
  });

  it("asks for numbers below the alphabet length", () => {
    const maxes: number[] = [];
    generateInviteCode((max) => {
      maxes.push(max);
      return 0;
    });
    expect(maxes).toEqual(Array(6).fill(INVITE_CODE_ALPHABET.length));
  });

  it("never uses the look-alike characters 0, O, 1 and I", () => {
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[0O1I]/);
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
  });

  it("produces codes that only use the alphabet", () => {
    const code = generateInviteCode((max) => Math.floor(Math.random() * max));
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("normalizeInviteCode", () => {
  it("trims and upper-cases what people type", () => {
    expect(normalizeInviteCode("  byteme ")).toBe("BYTEME");
    expect(normalizeInviteCode("NulPtr")).toBe("NULPTR");
  });
});
