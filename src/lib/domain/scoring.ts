// Judging rules (docs/02 > Scoring, Decisions 1 and 2). Pure functions: no
// Prisma or Next.js imports. Whether an event can be scored at all is
// canScore() in ./event-state.

export type ScoringStatus = "NOT_STARTED" | "IN_PROGRESS" | "SCORED";

export const SCORING_STATUS_LABEL: Record<ScoringStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SCORED: "Scored",
};

export const SCORING_MESSAGES = {
  submissionsOpen: "Scoring starts when the organizer closes submissions.",
  noCriteria: "The organizer hasn't set the criteria yet.",
  published: "Results are published, so scores can't be changed.",
  noSubmission: "This team has no submission, so it can't be scored.",
  unknownCriterion: "These criteria don't belong to this event. Reload the page and try again.",
  range: (maxScore: number) => `Enter a whole number from 0 to ${maxScore}.`,
  allScored: (event: string) => `You've scored every team in ${event}.`,
} as const;

/**
 * One judge's status for one team: "Scored" once every criterion has a score,
 * "In progress" when some have, otherwise "Not started".
 */
export function scoringStatus(scoredCount: number, criteriaCount: number): ScoringStatus {
  if (criteriaCount > 0 && scoredCount >= criteriaCount) return "SCORED";
  if (scoredCount > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

/** Why a judge can't score in this event right now, or null when they can. */
export function scoringBlockedReason(event: {
  submissionsOpen: boolean;
  resultsPublished: boolean;
  criteriaCount: number;
}): string | null {
  if (event.resultsPublished) return SCORING_MESSAGES.published;
  if (event.submissionsOpen) return SCORING_MESSAGES.submissionsOpen;
  if (event.criteriaCount === 0) return SCORING_MESSAGES.noCriteria;
  return null;
}

/**
 * A score as typed: "" means "not scored yet"; anything else must be a whole
 * number from 0 to maxScore. Returns the number, null for empty, or an error.
 */
export function parseScore(
  raw: string,
  maxScore: number,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const text = raw.trim();
  if (text === "") return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false, error: SCORING_MESSAGES.range(maxScore) };
  const value = Number(text);
  if (value > maxScore) return { ok: false, error: SCORING_MESSAGES.range(maxScore) };
  return { ok: true, value };
}

export type ScoreChanges = {
  /** Range errors by criterion id. Nothing is written when there are any. */
  errors: Record<string, string>;
  /** Scores to create or update. */
  upserts: { criterionId: string; value: number }[];
  /** Criteria whose box was submitted blank: this judge's score is removed. */
  deletes: string[];
};

/**
 * What a save does with the typed scores. Only a box that was submitted and
 * left blank removes a score; a criterion missing from the form keeps its
 * score untouched, so a stale or partial form never deletes anything by
 * accident.
 */
export function planScoreChanges(
  criteria: { id: string; maxScore: number }[],
  typed: Record<string, string>,
): ScoreChanges {
  const changes: ScoreChanges = { errors: {}, upserts: [], deletes: [] };
  for (const { id, maxScore } of criteria) {
    if (!Object.hasOwn(typed, id)) continue;
    const result = parseScore(typed[id], maxScore);
    if (!result.ok) changes.errors[id] = result.error;
    else if (result.value === null) changes.deletes.push(id);
    else changes.upserts.push({ criterionId: id, value: result.value });
  }
  return changes;
}

/**
 * The team to open after "Save and go to next team": the first team after the
 * current one (in list order, wrapping round) that this judge hasn't fully
 * scored. Null when every other team is scored.
 */
export function nextTeamToScore<T extends { id: string; status: ScoringStatus }>(
  teams: T[],
  currentId: string,
): T | null {
  const start = teams.findIndex((t) => t.id === currentId);
  for (let step = 1; step <= teams.length; step++) {
    const team = teams[(start + step) % teams.length];
    if (team.id !== currentId && team.status !== "SCORED") return team;
  }
  return null;
}
