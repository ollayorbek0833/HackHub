import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the organizer who created an event can change it. Server actions are
// public endpoints, so another organizer posting to an action bound to this
// event's id must get the not-found page before anything is read or written.
// The real guards from dal.ts run against a mocked session and database;
// notFound() and redirect() throw like the real ones.

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
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
  event: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
  criterion: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
  submission: { count: vi.fn() },
  score: { count: vi.fn() },
  team: { findFirst: vi.fn() },
  $queryRaw: vi.fn(),
};
const transaction = vi.fn((fn: (tx: typeof db) => Promise<unknown>) => fn(db));
vi.mock("@/lib/prisma", () => ({
  prisma: { ...db, $transaction: transaction },
}));

const { publishResults, setRegistrationOpen, setSubmissionsOpen } =
  await import("@/app/organizer/events/[eventId]/actions");
const { updateEvent } =
  await import("@/app/organizer/events/[eventId]/edit/actions");
const { saveCriteria } =
  await import("@/app/organizer/events/[eventId]/criteria/actions");
const { loadParticipants, loadTeams } =
  await import("@/app/organizer/events/[eventId]/participants/data");

const SWITCHES = {
  registrationOpen: false,
  submissionsOpen: false,
  resultsPublished: false,
};

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  // organizer-1 is signed in.
  auth.mockResolvedValue({ user: { id: "organizer-1" } });
  db.user.findUnique.mockResolvedValue({
    id: "organizer-1",
    email: "one@hackhub.test",
    role: "ORGANIZER",
  });
  db.event.findUniqueOrThrow.mockResolvedValue(SWITCHES);
  db.score.count.mockResolvedValue(0);
});

describe("another organizer's event", () => {
  beforeEach(() => {
    db.event.findUnique.mockResolvedValue({
      id: "event-2",
      createdById: "organizer-2",
      ...SWITCHES,
    });
  });

  it.each([
    [
      "setRegistrationOpen",
      () => setRegistrationOpen("event-2", null, form({ open: "true" })),
    ],
    [
      "setSubmissionsOpen",
      () => setSubmissionsOpen("event-2", null, form({ open: "true" })),
    ],
    ["publishResults", () => publishResults("event-2")],
    [
      "updateEvent",
      () =>
        updateEvent(
          "event-2",
          null,
          form({
            name: "Taken over",
            description: "Not yours.",
            startDate: "2026-10-29",
            endDate: "2026-10-30",
            maxTeamSize: "4",
          }),
        ),
    ],
    [
      "saveCriteria",
      () =>
        saveCriteria(
          "event-2",
          null,
          form({ name: "Innovation", weightPercent: "100", maxScore: "10" }),
        ),
    ],
  ])("%s shows the not-found page and writes nothing", async (_name, call) => {
    await expect(call()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(transaction).not.toHaveBeenCalled();
    expect(db.$queryRaw).not.toHaveBeenCalled();
    expect(db.event.update).not.toHaveBeenCalled();
    expect(db.criterion.deleteMany).not.toHaveBeenCalled();
  });

  it.each([
    ["loadParticipants", () => loadParticipants("event-2", "")],
    ["loadTeams", () => loadTeams("event-2")],
  ])("%s shows the not-found page and reads no people", async (_n, load) => {
    await expect(load()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(db.event.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

describe("the organizer's own event", () => {
  it("re-reads the event under its lock scoped to the owner", async () => {
    db.event.findUnique.mockResolvedValue({
      id: "event-1",
      createdById: "organizer-1",
      ...SWITCHES,
    });

    await expect(
      setRegistrationOpen("event-1", null, form({ open: "true" })),
    ).resolves.toEqual({ ok: true, message: "Registration opened." });
    expect(db.event.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event-1", createdById: "organizer-1" },
      }),
    );
    expect(db.event.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { registrationOpen: true },
    });
  });
});
