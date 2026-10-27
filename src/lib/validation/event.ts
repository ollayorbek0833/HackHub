import { z } from "zod";

import { validateEventDates } from "@/lib/domain/event-state";

// Field rules and messages from docs/08-ui-spec.md > Event form. Used by the
// createEvent and updateEvent actions. The end date's order against the start
// date is a product rule (validateEventDates in lib/domain/event-state.ts), so
// the actions check it after parsing.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" → that day at UTC midnight, or null if it isn't a real day. */
export function parseDateInput(value: string): Date | null {
  if (!ISO_DAY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  // new Date() rolls 2026-02-30 over to 2 Mar: only accept the exact day.
  return !Number.isNaN(date.getTime()) && toDateInput(date) === value
    ? date
    : null;
}

/** A stored event day (UTC midnight) → "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const day = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .transform((value, ctx) => {
      const date = parseDateInput(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return date;
    });

const TEAM_SIZE = "Team size must be a whole number from 1 to 10.";

/** The actions' message when validateEventDates refuses the dates (TC-24). */
export const END_BEFORE_START = "The end date can't be before the start date.";

export const eventSchema = z.object({
  name: z
    .string({ error: "Enter the event name." })
    .trim()
    .min(1, "Enter the event name.")
    .max(100, "Keep the name under 100 characters."),
  description: z
    .string({ error: "Add a description." })
    .trim()
    .min(1, "Add a description.")
    .max(2000, "Keep the description under 2000 characters."),
  startDate: day("Choose a start date."),
  endDate: day("Choose an end date."),
  // A blank or missing field means the default, 4.
  maxTeamSize: z
    .string({ error: TEAM_SIZE })
    .trim()
    .transform((value) => (value === "" ? "4" : value))
    .pipe(
      z.coerce
        .number<string>({ error: TEAM_SIZE })
        .int(TEAM_SIZE)
        .min(1, TEAM_SIZE)
        .max(10, TEAM_SIZE),
    )
    .optional()
    .transform((value) => value ?? 4),
});

export type EventInput = z.output<typeof eventSchema>;

/**
 * The schema's field errors plus the date-order error, so a refused form shows
 * every problem at once: an end before the start is reported even when another
 * field (say the team size) also failed.
 */
export function withDateOrderError(
  fieldErrors: Record<string, string[]> | undefined,
  values: { startDate: string; endDate: string },
): Record<string, string[]> {
  const start = parseDateInput(values.startDate.trim());
  const end = parseDateInput(values.endDate.trim());
  if (start && end && !validateEventDates(start, end)) {
    return { ...fieldErrors, endDate: [END_BEFORE_START] };
  }
  return fieldErrors ?? {};
}

/** The event form's fields as plain strings, also echoed back as `values` on failure. */
export function readEventForm(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    name: text("name"),
    description: text("description"),
    startDate: text("startDate"),
    endDate: text("endDate"),
    maxTeamSize: text("maxTeamSize"),
  };
}
