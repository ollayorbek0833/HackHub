import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/generated/prisma/enums";

// publishResults (#12): the server refuses to publish an event nobody
// submitted to, even though its submissions are "closed" (they never opened).
// The real guards and rules run against a mocked session and database.

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
  criterion: { findMany: vi.fn() },
  submission: { count: vi.fn() },
  $queryRaw: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ...db,
    $transaction: (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  },
}));

const { publishResults } =
  await import("@/app/organizer/events/[eventId]/actions");

function signInAs(role: Role) {
  auth.mockResolvedValue({ user: { id: "user-1" } });
  db.user.findUnique.mockResolvedValue({
    id: "user-1",
    email: "organizer@hackhub.test",
    role,
  });
}

const CLOSED = {
  registrationOpen: true,
  submissionsOpen: false,
  resultsPublished: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  signInAs("ORGANIZER");
  // user-1 created it: only the event's own organizer can publish.
  db.event.findUnique.mockResolvedValue({
    id: "event-1",
    createdById: "user-1",
    ...CLOSED,
  });
  db.event.findUniqueOrThrow.mockResolvedValue(CLOSED);
  db.criterion.findMany.mockResolvedValue([
    { weightPercent: 60 },
    { weightPercent: 40 },
  ]);
});

describe("publishResults", () => {
  it("refuses an event with no submissions, and writes nothing", async () => {
    db.submission.count.mockResolvedValue(0);
    expect(await publishResults("event-1")).toEqual({
      ok: false,
      formError:
        "You can publish once at least one team has submitted and submissions are closed.",
    });
    expect(db.submission.count).toHaveBeenCalledWith({
      where: { team: { eventId: "event-1" } },
    });
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("publishes once a team has submitted and submissions are closed", async () => {
    db.submission.count.mockResolvedValue(2);
    expect(await publishResults("event-1")).toEqual({
      ok: true,
      message: "Results published.",
    });
    expect(db.event.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { resultsPublished: true },
    });
  });

  it("still refuses while submissions are open", async () => {
    db.event.findUniqueOrThrow.mockResolvedValue({
      ...CLOSED,
      submissionsOpen: true,
    });
    db.submission.count.mockResolvedValue(3);
    expect(await publishResults("event-1")).toMatchObject({
      ok: false,
      formError: "Close submissions first.",
    });
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("refuses a participant before reading anything", async () => {
    signInAs("PARTICIPANT");
    await expect(publishResults("event-1")).rejects.toThrow("NEXT_REDIRECT");
    expect(db.submission.count).not.toHaveBeenCalled();
    expect(db.event.update).not.toHaveBeenCalled();
  });
});
