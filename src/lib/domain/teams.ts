// Team rules (docs/02 > Teams, docs/07 > lib/domain, Decisions 4 and 9). Pure
// functions: no Prisma or Next.js imports. The team actions load the rows
// inside a transaction, with the team row locked, and call these.

export const NOT_REGISTERED = "Register for this event before joining a team.";
export const ALREADY_ON_TEAM =
  "You're already on a team in this event. Leave it first.";
export const TEAM_SUBMITTED =
  "This team has already submitted, so it can't take new members.";
export const CANT_LEAVE_SUBMITTED =
  "You can't leave after your team has submitted.";
export const teamFullMessage = (maxTeamSize: number) =>
  `This team is full (${maxTeamSize} members).`;

export type JoinCheck = {
  /** The joining participant is registered for the event. */
  registered: boolean;
  /** They're already on a team in this event (any team). */
  alreadyOnTeam: boolean;
  memberCount: number;
  maxTeamSize: number;
  /** The team has a submission. */
  submitted: boolean;
};

/** Why this participant can't join the team, as the message to show, or null. */
export function joinRefusal(check: JoinCheck): string | null {
  if (!check.registered) return NOT_REGISTERED;
  if (check.alreadyOnTeam) return ALREADY_ON_TEAM;
  if (check.submitted) return TEAM_SUBMITTED;
  if (check.memberCount >= check.maxTeamSize) {
    return teamFullMessage(check.maxTeamSize);
  }
  return null;
}

export function canJoin(check: JoinCheck): boolean {
  return joinRefusal(check) === null;
}

/** Leaving is allowed until the team submits (Decision 9). */
export function canLeave(team: { submitted: boolean }): boolean {
  return !team.submitted;
}

/** The team is at its event's max size: the code stays visible, nobody else can join. */
export function isTeamFull(memberCount: number, maxTeamSize: number): boolean {
  return memberCount >= maxTeamSize;
}
