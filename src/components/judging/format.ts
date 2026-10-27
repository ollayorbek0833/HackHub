// Times are stored in UTC and shown in GMT+5 (Tashkent) as "26 Oct 2026, 14:05"
// (docs/08 > Dates and times).
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(date: Date): string {
  return DATE_TIME.format(date);
}
