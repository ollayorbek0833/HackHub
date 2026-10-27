import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateRange,
} from "@/components/organizer/event-dates";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("formatDate", () => {
  it("writes day, short month and year", () => {
    expect(formatDate(d("2026-10-26"))).toBe("26 Oct 2026");
    expect(formatDate(d("2026-01-05"))).toBe("5 Jan 2026");
  });
});

describe("formatDateRange", () => {
  it("shows one date for a same-day event", () => {
    expect(formatDateRange(d("2026-10-29"), d("2026-10-29"))).toBe(
      "29 Oct 2026",
    );
  });

  it("shares the month and year inside one month", () => {
    expect(formatDateRange(d("2026-10-29"), d("2026-10-30"))).toBe(
      "29–30 Oct 2026",
    );
  });

  it("shares the year across months", () => {
    expect(formatDateRange(d("2026-10-30"), d("2026-11-02"))).toBe(
      "30 Oct – 2 Nov 2026",
    );
  });

  it("writes both dates in full across years", () => {
    expect(formatDateRange(d("2026-12-30"), d("2027-01-02"))).toBe(
      "30 Dec 2026 – 2 Jan 2027",
    );
  });
});
