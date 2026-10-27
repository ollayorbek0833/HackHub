import { describe, expect, it } from "vitest";

import { formatDateTime } from "./format";

describe("formatDateTime", () => {
  it("shows UTC times in GMT+5, 24-hour", () => {
    expect(formatDateTime(new Date("2026-10-26T09:05:00Z"))).toBe("26 Oct 2026, 14:05");
    expect(formatDateTime(new Date("2026-10-26T20:30:00Z"))).toBe("27 Oct 2026, 01:30");
  });
});
