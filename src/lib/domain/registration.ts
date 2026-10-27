// Registering for an event (docs/02 > Product rules: Profile, Events; docs/08 >
// Event details). Pure functions: no Prisma or Next.js imports. The register
// action calls these inside its transaction.

import { canRegister } from "./event-state";

export const REGISTRATION_CLOSED = "Registration for this event is closed.";
export const ALREADY_REGISTERED = "You're already registered for this event.";
export const PROFILE_INCOMPLETE = "Complete your profile before registering.";

type ProfileFields = { name: string; faculty: string } | null | undefined;

/** A participant needs a saved name and faculty before registering. */
export function isProfileComplete(profile: ProfileFields): boolean {
  return Boolean(profile?.name.trim() && profile.faculty.trim());
}

/**
 * Why this participant can't register, as the message to show, or null when
 * they can. A duplicate is caught by the unique index (P2002) as well, for the
 * double-click race.
 */
export function registrationRefusal({
  event,
  profile,
  alreadyRegistered,
}: {
  event: { registrationOpen: boolean };
  profile: ProfileFields;
  alreadyRegistered: boolean;
}): string | null {
  if (alreadyRegistered) return ALREADY_REGISTERED;
  if (!canRegister(event)) return REGISTRATION_CLOSED;
  if (!isProfileComplete(profile)) return PROFILE_INCOMPLETE;
  return null;
}

type MyEvent = { resultsPublished: boolean; startDate: Date; name: string };

/** /my-events order: events whose results aren't published first, then by start date. */
export function compareMyEvents(a: MyEvent, b: MyEvent): number {
  if (a.resultsPublished !== b.resultsPublished) {
    return a.resultsPublished ? 1 : -1;
  }
  const byDate = a.startDate.getTime() - b.startDate.getTime();
  return byDate !== 0 ? byDate : a.name.localeCompare(b.name);
}
