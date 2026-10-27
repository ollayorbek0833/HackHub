import { describe, expect, it } from "vitest";

import {
  eventPhase,
  nextStep,
  readinessChecks,
  type EventProgress,
} from "./event-readiness";

const SET = [{ weightPercent: 60 }, { weightPercent: 40 }];

const base: EventProgress = {
  registrationOpen: false,
  submissionsOpen: false,
  resultsPublished: false,
  registrations: 0,
  teams: 0,
  submissions: 0,
  scoredTeams: 0,
  scoreCount: 0,
  criteria: [],
};
const at = (patch: Partial<EventProgress>) => ({ ...base, ...patch });

describe("eventPhase and nextStep", () => {
  it("a new event is being set up; next, open registration", () => {
    expect(eventPhase(base)).toBe("setup");
    expect(nextStep(base, "Demo")).toMatchObject({
      kind: "openRegistration",
      title: "Next: open registration",
      blocker: null,
    });
  });

  it("with registration open, next is opening submissions", () => {
    const e = at({ registrationOpen: true, registrations: 5, teams: 2 });
    expect(eventPhase(e)).toBe("registration");
    expect(nextStep(e, "Demo")).toMatchObject({
      kind: "openSubmissions",
      blocker: null,
    });
  });

  it("registration closed again, with people registered, is still registration", () => {
    expect(eventPhase(at({ registrations: 3 }))).toBe("registration");
  });

  it("with submissions open, next is closing them, with a confirm dialog", () => {
    const e = at({ registrationOpen: true, submissionsOpen: true });
    expect(eventPhase(e)).toBe("building");
    const step = nextStep(e, "Demo");
    expect(step.kind).toBe("closeSubmissions");
    expect(step.confirm?.title).toBe("Close submissions?");
  });

  it("after submissions close, judging; publishing needs criteria first", () => {
    const e = at({ submissions: 2 });
    expect(eventPhase(e)).toBe("judging");
    expect(nextStep(e, "Demo").kind).toBe("setCriteria");
    const ready = at({ submissions: 2, criteria: SET, scoreCount: 6 });
    expect(nextStep(ready, "Demo")).toMatchObject({
      kind: "publishResults",
      blocker: null,
      confirm: { title: "Publish results for Demo?" },
      note: "Only 0 of 2 submitted teams have been scored on every criterion. Check with your judges first.",
    });
    expect(nextStep({ ...ready, scoredTeams: 2 }, "Demo").note).toBeUndefined();
    expect(nextStep({ ...ready, scoredTeams: 1 }, "Demo").note).toMatch(
      /^Only 1 of 2 submitted teams has been scored/,
    );
  });

  it("criteria that don't total 100% still ask for criteria", () => {
    const e = at({ submissions: 1, criteria: [{ weightPercent: 50 }] });
    expect(nextStep(e, "Demo").kind).toBe("setCriteria");
  });

  it("once published, there's nothing to switch: view the ranking", () => {
    const e = at({ resultsPublished: true, submissions: 2, criteria: SET });
    expect(eventPhase(e)).toBe("published");
    const step = nextStep(e, "Demo");
    expect(step.kind).toBe("viewResults");
    expect(step.confirm).toBeUndefined();
  });

  it("uses the switch rules for the blocker (no reopening after scoring)", () => {
    // Submissions open with scores can only be reached by data drift, but the
    // card must still say what the server would say.
    const e = at({ submissionsOpen: true, scoreCount: 1 });
    expect(nextStep(e, "Demo").blocker).toBeNull();
    const published = at({ resultsPublished: true });
    expect(nextStep(published, "Demo").blocker).toBeUndefined();
  });
});

describe("readinessChecks", () => {
  it("starts with everything to do", () => {
    const checks = readinessChecks(base);
    expect(checks.map((c) => c.done)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(checks[0].label).toBe("Criteria set (none yet)");
  });

  it("names the current weight total when it isn't 100%", () => {
    const checks = readinessChecks(at({ criteria: [{ weightPercent: 70 }] }));
    expect(checks[0]).toMatchObject({
      label: "Criteria total 100% (now 70%)",
      done: false,
    });
  });

  it("counts teams scored against teams submitted", () => {
    const partly = readinessChecks(at({ submissions: 3, scoredTeams: 2 }));
    expect(partly[4]).toMatchObject({
      label: "All submitted teams scored (2 of 3)",
      done: false,
    });
    const all = readinessChecks(at({ submissions: 3, scoredTeams: 3 }));
    expect(all[4].done).toBe(true);
  });

  it("is all done for a published event", () => {
    const done = readinessChecks(
      at({
        registrations: 8,
        teams: 3,
        submissions: 2,
        scoredTeams: 2,
        criteria: SET,
        resultsPublished: true,
      }),
    );
    expect(done.every((c) => c.done)).toBe(true);
    expect(done[1].label).toBe("8 participants registered");
    expect(done[2].label).toBe("3 teams formed");
    expect(done[3].label).toBe("2 teams submitted");
  });
});
