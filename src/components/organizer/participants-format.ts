import { formatDate } from "@/components/organizer/event-dates";

// Display helpers for the participants and teams view (#11).

const GMT_PLUS_5_MS = 5 * 60 * 60 * 1000;

/**
 * A timestamp's calendar day in Tashkent time (docs/08: times are stored in
 * UTC and shown in GMT+5), as "26 Oct 2026".
 */
export function formatTashkentDate(date: Date): string {
  return formatDate(new Date(date.getTime() + GMT_PLUS_5_MS));
}

/** Only http(s) links are rendered as links; anything else stays plain text. */
export function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
