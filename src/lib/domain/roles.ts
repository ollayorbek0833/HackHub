import type { Role } from "@/generated/prisma/enums";

// Who may become a judge or a participant again (docs/02 > Judge role,
// Decision 11). Pure: no Prisma or Next.js imports. Type-only Role import, so
// the users page and the action share it.

export type RoleChangeTarget = {
  id: string;
  role: Role;
  /** Name from the profile, or the email when there's no name yet. */
  displayName: string;
  /** Names of the events the user is on a team in. */
  teamEvents: string[];
};

/** The role a user can be switched to: participant ↔ judge, nothing else. */
export function nextRole(role: Role): Role | null {
  if (role === "PARTICIPANT") return "JUDGE";
  if (role === "JUDGE") return "PARTICIPANT";
  return null;
}

export const ROLE_MESSAGES = {
  organizer: "Organizers' roles can't be changed here.",
  self: "You can't change your own role.",
  unchanged: "This user already has that role.",
  onTeam: (name: string, event: string) =>
    `${name} is on a team in ${event}, so they can't become a judge.`,
  changed: (name: string, role: Role) =>
    role === "JUDGE" ? `${name} is now a judge.` : `${name} is now a participant.`,
} as const;

/**
 * Why `actorId` can't give `target` the role `to`, or null when the change is
 * allowed. Only PARTICIPANT ↔ JUDGE; never an organizer, never yourself; and
 * a participant on a team in any event can't become a judge.
 */
export function roleChangeError(
  actorId: string,
  target: RoleChangeTarget,
  to: Role,
): string | null {
  if (target.role === "ORGANIZER" || to === "ORGANIZER") return ROLE_MESSAGES.organizer;
  if (target.id === actorId) return ROLE_MESSAGES.self;
  if (nextRole(target.role) !== to) return ROLE_MESSAGES.unchanged;
  if (to === "JUDGE" && target.teamEvents.length > 0) {
    return ROLE_MESSAGES.onTeam(target.displayName, target.teamEvents.join(", "));
  }
  return null;
}
