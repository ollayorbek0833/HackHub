import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/generated/prisma/enums";

// The participants and teams view (#11), docs/06 TC-52…TC-57. The real guards
// from dal.ts run against a mocked session and database, so a participant or
// judge is refused the same way the page refuses them. redirect() and
// notFound() throw like the real ones.

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const db = {
  user: { findUnique: vi.fn() },
  // requireEvent() reads with findUnique; each tab with findUniqueOrThrow.
  event: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const { loadParticipants, loadTeams } = await import("./data");

const EVENT = {
  id: "event-1",
  name: "Demo Hack",
  startDate: new Date("2026-10-29"),
  endDate: new Date("2026-10-30"),
  maxTeamSize: 4,
  registrationOpen: false,
  submissionsOpen: false,
  resultsPublished: false,
  // The signed-in organizer (user-1) created it.
  createdById: "user-1",
};

function signInAs(role: Role | null) {
  auth.mockResolvedValue(role && { user: { id: "user-1" } });
  db.user.findUnique.mockResolvedValue(
    role && { id: "user-1", email: "user@hackhub.test", role },
  );
}

const user = (id: string, email: string, name?: string, faculty?: string) => ({
  id,
  email,
  profile: name
    ? {
        name,
        faculty: faculty ?? "Computer Science",
        phone: id === "u-ali" ? "+998901234567" : null,
        skills: ["Go"],
        bio: null,
        links: [],
      }
    : null,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.event.findUnique.mockResolvedValue(EVENT);
});

describe.each([
  ["loadParticipants", () => loadParticipants("event-1", "")],
  ["loadTeams", () => loadTeams("event-1")],
])("%s guards (TC-55, TC-57)", (_name, load) => {
  it.each([
    ["PARTICIPANT", "/my-events"],
    ["JUDGE", "/judge"],
  ] as const)("refuses a %s and sends them home", async (role, home) => {
    signInAs(role);
    await expect(load()).rejects.toThrow(
      `NEXT_REDIRECT ${home}?notice=no-access`,
    );
    expect(db.event.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("sends a signed-out visitor to /login", async () => {
    signInAs(null);
    await expect(load()).rejects.toThrow("NEXT_REDIRECT /login");
  });

  it("shows the not-found page for an unknown event", async () => {
    signInAs("ORGANIZER");
    db.event.findUnique.mockResolvedValue(null);
    await expect(load()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(db.event.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

describe("loadParticipants (TC-52, TC-56)", () => {
  beforeEach(() => {
    signInAs("ORGANIZER");
    db.event.findUniqueOrThrow.mockResolvedValue({
      _count: { registrations: 3, teams: 1 },
      registrations: [
        {
          createdAt: new Date("2026-10-27T10:00:00Z"),
          user: user("u-zara", "zara@hackhub.test", "Zara Usmonova", "Physics"),
          membership: null,
        },
        {
          createdAt: new Date("2026-10-27T09:00:00Z"),
          user: user("u-ali", "ali@hackhub.test", "ali Karimov"),
          membership: { team: { name: "Byte Me" } },
        },
        {
          createdAt: new Date("2026-10-27T11:00:00Z"),
          user: user("u-new", "bek@hackhub.test"),
          membership: null,
        },
      ],
    });
  });

  it("lists every registration sorted by name, with team or no team", async () => {
    const { counts, rows } = await loadParticipants("event-1", "");

    expect(counts).toEqual({ participants: 3, teams: 1 });
    expect(rows).toEqual([
      {
        userId: "u-ali",
        name: "ali Karimov",
        email: "ali@hackhub.test",
        faculty: "Computer Science",
        phone: "+998901234567",
        teamName: "Byte Me",
        registeredAt: new Date("2026-10-27T09:00:00Z"),
        skills: ["Go"],
        bio: null,
        links: [],
      },
      // No profile yet: sorted and shown by email.
      {
        userId: "u-new",
        name: null,
        email: "bek@hackhub.test",
        faculty: null,
        phone: null,
        teamName: null,
        registeredAt: new Date("2026-10-27T11:00:00Z"),
        skills: [],
        bio: null,
        links: [],
      },
      {
        userId: "u-zara",
        name: "Zara Usmonova",
        email: "zara@hackhub.test",
        faculty: "Physics",
        phone: null,
        teamName: null,
        registeredAt: new Date("2026-10-27T10:00:00Z"),
        skills: ["Go"],
        bio: null,
        links: [],
      },
    ]);
  });

  it("reads only this event and only the fields shown", async () => {
    await loadParticipants("event-1", "");

    const [args] = db.event.findUniqueOrThrow.mock.calls[0];
    expect(args.where).toEqual({ id: "event-1" });
    expect(args.select.registrations.where).toBeUndefined();
    expect(args.select.registrations.select).toEqual({
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              faculty: true,
              phone: true,
              skills: true,
              bio: true,
              links: true,
            },
          },
        },
      },
      membership: { select: { team: { select: { name: true } } } },
    });
  });

  it("searches by name or email, ignoring case", async () => {
    await loadParticipants("event-1", "Ali");

    const [args] = db.event.findUniqueOrThrow.mock.calls[0];
    const contains = { contains: "Ali", mode: "insensitive" };
    expect(args.select.registrations.where).toEqual({
      user: { OR: [{ email: contains }, { profile: { name: contains } }] },
    });
  });
});

describe("loadTeams (TC-53, TC-54, TC-56)", () => {
  beforeEach(() => {
    signInAs("ORGANIZER");
    db.event.findUniqueOrThrow.mockResolvedValue({
      _count: { registrations: 3, teams: 2 },
      teams: [
        {
          id: "t-solo",
          name: "solo",
          members: [{ user: user("u-bek", "bek@hackhub.test") }],
          submission: null,
        },
        {
          id: "t-byte",
          name: "Byte Me",
          members: [
            { user: user("u-zara", "zara@hackhub.test", "Zara Usmonova") },
            { user: user("u-ali", "ali@hackhub.test", "Ali Karimov") },
          ],
          submission: {
            title: "Queue Buddy",
            description: "Skip the canteen line.",
            repoUrl: "https://github.com/byte-me/queue-buddy",
            updatedAt: new Date("2026-10-28T08:00:00Z"),
          },
        },
      ],
    });
  });

  it("lists teams by name with sorted members and their submission", async () => {
    const { event, counts, rows } = await loadTeams("event-1");

    expect(event.maxTeamSize).toBe(4);
    expect(counts).toEqual({ participants: 3, teams: 2 });
    expect(rows).toEqual([
      {
        id: "t-byte",
        name: "Byte Me",
        members: [
          { userId: "u-ali", name: "Ali Karimov", email: "ali@hackhub.test" },
          {
            userId: "u-zara",
            name: "Zara Usmonova",
            email: "zara@hackhub.test",
          },
        ],
        submission: {
          title: "Queue Buddy",
          description: "Skip the canteen line.",
          repoUrl: "https://github.com/byte-me/queue-buddy",
          submittedAt: new Date("2026-10-28T08:00:00Z"),
        },
      },
      {
        id: "t-solo",
        name: "solo",
        members: [{ userId: "u-bek", name: null, email: "bek@hackhub.test" }],
        submission: null,
      },
    ]);
  });

  it("reads only this event's teams in one query", async () => {
    await loadTeams("event-1");

    expect(db.event.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    const [args] = db.event.findUniqueOrThrow.mock.calls[0];
    expect(args.where).toEqual({ id: "event-1" });
    expect(Object.keys(args.select.teams.select)).toEqual([
      "id",
      "name",
      "members",
      "submission",
    ]);
  });
});
