// Event dates are calendar days stored at UTC midnight (@db.Date), so they are
// read in UTC: a GMT+5 offset would not move them, and UTC keeps them exact.
// Formats from docs/08 > Accessibility and content rules: "26 Oct 2026",
// ranges "29–30 Oct 2026".

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const day = (d: Date) => d.getUTCDate();
const month = (d: Date) => MONTHS[d.getUTCMonth()];
const year = (d: Date) => d.getUTCFullYear();

/** "26 Oct 2026" */
export function formatDate(date: Date): string {
  return `${day(date)} ${month(date)} ${year(date)}`;
}

/** "26 Oct 2026", "29–30 Oct 2026", "30 Oct – 2 Nov 2026" or "30 Dec 2026 – 2 Jan 2027". */
export function formatDateRange(start: Date, end: Date): string {
  if (year(start) !== year(end)) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${day(start)} ${month(start)} – ${formatDate(end)}`;
  }
  if (day(start) !== day(end)) {
    return `${day(start)}–${formatDate(end)}`;
  }
  return formatDate(start);
}
