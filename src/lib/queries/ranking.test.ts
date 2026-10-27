import { beforeEach, describe, expect, it, vi } from "vitest";

// getEventRanking() with the database mocked: it reads the event's rows and
// hands them to rankTeams(). The ranking rules themselves are tested in
// lib/domain/ranking.test.ts.

vi.mock("server-only", () => ({}));

const criterionFindMany = vi.fn();
const teamFindMany = vi.fn();
const scoreFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    criterion: { findMany: (args: unknown) => criterionFindMany(args) },
    team: { findMany: (args: unknown) => teamFindMany(args) },
    score: { findMany: (args: unknown) => scoreFindMany(args) },
  },
}));

const { getEventRanking, toRankInput } = await import("@/lib/queries/ranking");

const member = (userId: string, name: string | null) => ({
  userId,
  user: { profile: name === null ? null : { name } },
});

const criteria = [
  { id: "idea", name: "Idea", weightPercent: 60, maxScore: 10 },
  { id: "demo", name: "Demo", weightPercent: 40, maxScore: 10 },
];

const teams = [
  {
    id: "t1",
    name: "Byte Me",
    submission: { id: "s1" },
    members: [member("u1", "Ana"), member("u2", null)],
  },
  {
    id: "t2",
    name: "Null Pointers",
    submission: { id: "s2" },
    members: [member("u3", "Bek")],
  },
  { id: "t3", name: "Ghosts", submission: null, members: [] },
];

const scores = [
  { teamId: "t1", criterionId: "idea", judgeId: "j1", value: 5 },
  { teamId: "t1", criterionId: "demo", judgeId: "j1", value: 5 },
  { teamId: "t2", criterionId: "idea", judgeId: "j1", value: 10 },
  { teamId: "t2", criterionId: "demo", judgeId: "j2", value: 10 },
];

describe("toRankInput", () => {
  it("maps rows to plain teams with a submission flag and member names", () => {
    const input = toRankInput({ criteria, teams, scores });

    expect(input.teams).toEqual([
      {
        id: "t1",
        name: "Byte Me",
        hasSubmission: true,
        members: [
          { userId: "u1", name: "Ana" },
          { userId: "u2", name: null },
        ],
      },
      {
        id: "t2",
        name: "Null Pointers",
        hasSubmission: true,
        members: [{ userId: "u3", name: "Bek" }],
      },
      { id: "t3", name: "Ghosts", hasSubmission: false, members: [] },
    ]);
    expect(input.criteria).toBe(criteria);
    expect(input.scores).toBe(scores);
  });
});

describe("getEventRanking", () => {
  beforeEach(() => {
    criterionFindMany.mockReset().mockResolvedValue(criteria);
    teamFindMany.mockReset().mockResolvedValue(teams);
    scoreFindMany.mockReset().mockResolvedValue(scores);
  });

  it("queries only this event's rows", async () => {
    await getEventRanking("event-1");

    expect(criterionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: "event-1" } }),
    );
    expect(teamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: "event-1" } }),
    );
    expect(scoreFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { team: { eventId: "event-1" } } }),
    );
  });

  it("ranks submitted teams and lists the rest as unranked (TC-124)", async () => {
    const ranking = await getEventRanking("event-1");

    expect(
      ranking.ranked.map((r) => [r.team.name, r.rank, r.total, r.judgeCount]),
    ).toEqual([
      ["Null Pointers", 1, 100, 2],
      ["Byte Me", 2, 50, 1],
    ]);
    expect(ranking.unranked.map((t) => t.name)).toEqual(["Ghosts"]);
    expect(ranking.criteria).toBe(criteria);
    expect(ranking.scoreCount).toBe(4);
  });

  it("reports no scores yet with every total at 0", async () => {
    scoreFindMany.mockResolvedValue([]);

    const ranking = await getEventRanking("event-1");

    expect(ranking.scoreCount).toBe(0);
    expect(ranking.ranked.map((r) => [r.total, r.rank])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });
});
