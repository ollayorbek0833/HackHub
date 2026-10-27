import { eventPhase, type EventPhase } from "@/lib/domain/event-phase";
import type { EventState } from "@/lib/domain/event-state";
import {
  criteriaAreSet,
  publishBlocker,
  registrationBlocker,
  submissionsBlocker,
} from "@/lib/domain/event-switches";

// The organizer's command centre (redesign, Wed 28 Oct): which phase the event
// is in, a readiness checklist and the one next step. Pure functions over the
// counts the overview page reads. The step only ever points at an existing
// switch or at publishing, and whether it's allowed comes from the same
// blockers the actions check (event-switches.ts), so the card and the server
// can't disagree.

export type EventProgress = EventState & {
  registrations: number;
  teams: number;
  submissions: number;
  /** Submitted teams that at least one judge has scored on every criterion. */
  scoredTeams: number;
  scoreCount: number;
  criteria: { weightPercent: number }[];
};

/**
 * The phase is the one the event chip and the participant pages show
 * (`eventPhase` in event-phase.ts), so the organizer sees the same word
 * everywhere. This adds a line on what it means for the organizer.
 */
export const PHASE_HELP: Record<EventPhase, string> = {
  upcoming: "Participants can't register yet.",
  registration: "Participants can register and form teams.",
  building: "Teams are building and can submit.",
  judging: "Submissions are closed. Judges score the teams.",
  results: "The ranking is public. Nothing can change any more.",
};

/** The shared phase, from the switches and whether anyone has submitted. */
export function progressPhase(e: EventProgress): EventPhase {
  return eventPhase({ ...e, hasSubmissions: e.submissions > 0 });
}

export type StepKind =
  | "openRegistration"
  | "openSubmissions"
  | "closeSubmissions"
  | "publishResults"
  | "setCriteria"
  | "viewResults";

export type NextStep = {
  kind: StepKind;
  /** "Next: open submissions" */
  title: string;
  /** Exactly what changes when the organizer does it. */
  effect: string;
  /** The button's label. */
  action: string;
  /** For the steps that flip a switch or publish: the dialog's wording. */
  confirm?: { title: string; description: string; action: string };
  /** Why it can't happen yet; the card then says so instead of offering the button. */
  blocker?: string | null;
  /** Worth knowing before doing it, without blocking it. */
  note?: string;
};

/** The one thing the organizer should do next. */
export function nextStep(e: EventProgress, eventName: string): NextStep {
  const phase = progressPhase(e);
  // Not open yet, but people registered: the organizer closed registration
  // again, so the next step is submissions, not registration.
  const step =
    phase === "upcoming" && e.registrations > 0 ? "registration" : phase;
  switch (step) {
    case "upcoming":
      return {
        kind: "openRegistration",
        title: "Next: open registration",
        effect:
          "The event appears on Events, and participants can register and form teams.",
        action: "Open registration",
        confirm: {
          title: "Open registration?",
          description:
            "The event appears on Events, and participants can register and form teams. You can close it again at any time.",
          action: "Open registration",
        },
        blocker: registrationBlocker(e),
      };
    case "registration":
      return {
        kind: "openSubmissions",
        title: "Next: open submissions",
        effect:
          "Teams can submit their project and edit it until you close submissions.",
        action: "Open submissions",
        confirm: {
          title: "Open submissions?",
          description:
            "Teams can submit their project and edit it until you close submissions. Registration stays as it is.",
          action: "Open submissions",
        },
        blocker: submissionsBlocker(e, true, e.scoreCount),
      };
    case "building":
      return {
        kind: "closeSubmissions",
        title: "Next: close submissions",
        effect:
          "Teams can't submit or edit any more, and judges can start scoring.",
        action: "Close submissions",
        confirm: {
          title: "Close submissions?",
          description:
            "Teams can't submit or edit, and judges can start scoring.",
          action: "Close submissions",
        },
        blocker: submissionsBlocker(e, false, e.scoreCount),
        note:
          e.submissions === 0
            ? "No team has submitted yet, so there would be nothing to judge."
            : undefined,
      };
    case "judging":
      if (!criteriaAreSet(e.criteria)) {
        return {
          kind: "setCriteria",
          title: "Next: set the judging criteria",
          effect:
            "Judges score each team against the criteria, and their weights make up the ranking.",
          action: "Set criteria",
        };
      }
      return {
        kind: "publishResults",
        title: "Next: publish the results",
        effect:
          "Everyone sees the ranking, and judges can't change scores any more. This can't be undone.",
        action: "Publish results",
        confirm: {
          title: `Publish results for ${eventName}?`,
          description:
            "Everyone will see the ranking, and judges can't change scores any more. This can't be undone.",
          action: "Publish results",
        },
        blocker: publishBlocker(e, e.criteria),
        note:
          e.scoredTeams < e.submissions
            ? `Only ${e.scoredTeams} of ${e.submissions} submitted teams ${e.scoredTeams === 1 ? "has" : "have"} been scored on every criterion. Check with your judges first.`
            : undefined,
      };
    case "results":
      return {
        kind: "viewResults",
        title: "Results are published",
        effect: "The ranking is on the public event page.",
        action: "View the ranking",
      };
  }
}

export type ReadinessCheck = {
  label: string;
  done: boolean;
  /** Where to fix it, relative to the event's organizer pages. */
  fix?: "criteria" | "participants" | "ranking";
};

/** The readiness list: what has to be true before the results can go out. */
export function readinessChecks(e: EventProgress): ReadinessCheck[] {
  const weights = e.criteria.reduce((sum, c) => sum + c.weightPercent, 0);
  return [
    {
      label: criteriaAreSet(e.criteria)
        ? "Criteria total 100%"
        : e.criteria.length === 0
          ? "Criteria set (none yet)"
          : `Criteria total 100% (now ${weights}%)`,
      done: criteriaAreSet(e.criteria),
      fix: "criteria",
    },
    {
      label:
        e.registrations === 0
          ? "At least 1 participant registered"
          : `${e.registrations} ${e.registrations === 1 ? "participant" : "participants"} registered`,
      done: e.registrations > 0,
      fix: "participants",
    },
    {
      label:
        e.teams === 0
          ? "At least 1 team"
          : `${e.teams} ${e.teams === 1 ? "team" : "teams"} formed`,
      done: e.teams > 0,
      fix: "participants",
    },
    {
      label:
        e.submissions === 0
          ? "At least 1 submission"
          : `${e.submissions} ${e.submissions === 1 ? "team" : "teams"} submitted`,
      done: e.submissions > 0,
      fix: "participants",
    },
    {
      label:
        e.submissions === 0
          ? "All submitted teams scored"
          : `All submitted teams scored (${e.scoredTeams} of ${e.submissions})`,
      done: e.submissions > 0 && e.scoredTeams >= e.submissions,
      fix: "ranking",
    },
    {
      label: "Results published",
      done: e.resultsPublished,
    },
  ];
}
