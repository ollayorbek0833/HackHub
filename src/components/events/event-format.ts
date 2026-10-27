// Display helpers for event pages. Event dates are calendar days stored at UTC
// midnight (@db.Date), so they're read in UTC: the GMT+5 offset doesn't move
// them. Formats from docs/08 > Accessibility and content rules.

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
export function formatEventDate(date: Date): string {
  return `${day(date)} ${month(date)} ${year(date)}`;
}

/** "26 Oct 2026", "29–30 Oct 2026", "30 Oct – 2 Nov 2026" or "30 Dec 2026 – 2 Jan 2027". */
export function formatEventDates(start: Date, end: Date): string {
  if (year(start) !== year(end)) {
    return `${formatEventDate(start)} – ${formatEventDate(end)}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${day(start)} ${month(start)} – ${formatEventDate(end)}`;
  }
  if (day(start) !== day(end)) {
    return `${day(start)}–${formatEventDate(end)}`;
  }
  return formatEventDate(start);
}

/** The first ~`max` characters of a description, cut at a word, for the /events list. */
export function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/, "")}…`;
}

/** "1 participant", "12 participants" */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
