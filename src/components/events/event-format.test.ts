import { describe, expect, it } from "vitest";

import { excerpt, formatEventDate, formatEventDates, plural } from "./event-format";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("formatEventDates", () => {
  it("formats a single day", () => {
    expect(formatEventDate(d("2026-10-26"))).toBe("26 Oct 2026");
    expect(formatEventDates(d("2026-10-26"), d("2026-10-26"))).toBe(
      "26 Oct 2026",
    );
  });

  it("formats ranges in the same month, across months and across years", () => {
    expect(formatEventDates(d("2026-10-29"), d("2026-10-30"))).toBe(
      "29–30 Oct 2026",
    );
    expect(formatEventDates(d("2026-10-30"), d("2026-11-02"))).toBe(
      "30 Oct – 2 Nov 2026",
    );
    expect(formatEventDates(d("2026-12-30"), d("2027-01-02"))).toBe(
      "30 Dec 2026 – 2 Jan 2027",
    );
  });
});

describe("excerpt", () => {
  it("keeps short text as it is, with whitespace flattened", () => {
    expect(excerpt("A  short\nline.")).toBe("A short line.");
  });

  it("cuts long text at a word and adds an ellipsis", () => {
    const text = `${"word ".repeat(60)}end`;
    const result = excerpt(text);
    expect(result.length).toBeLessThanOrEqual(161);
    expect(result.endsWith("word…")).toBe(true);
  });
});

describe("plural", () => {
  it("uses the singular only for one", () => {
    expect(plural(1, "participant")).toBe("1 participant");
    expect(plural(0, "participant")).toBe("0 participants");
    expect(plural(3, "member")).toBe("3 members");
  });
});
