import { describe, expect, it } from "vitest";

import { formatTashkentDate, isWebUrl } from "./participants-format";

describe("formatTashkentDate", () => {
  it("shows the day in GMT+5", () => {
    expect(formatTashkentDate(new Date("2026-10-26T12:00:00Z"))).toBe(
      "26 Oct 2026",
    );
  });

  it("moves a late-evening UTC time to the next Tashkent day", () => {
    expect(formatTashkentDate(new Date("2026-10-26T19:30:00Z"))).toBe(
      "27 Oct 2026",
    );
  });
});

describe("isWebUrl", () => {
  it.each(["https://github.com/team/repo", "http://example.com"])(
    "accepts %s",
    (url) => expect(isWebUrl(url)).toBe(true),
  );

  it.each(["javascript:alert(1)", "github.com/team/repo", ""])(
    "refuses %s",
    (url) => expect(isWebUrl(url)).toBe(false),
  );
});
