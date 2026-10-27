import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/generated/prisma/enums";

// createEvent and updateEvent (#9), docs/06 TC-24, TC-26, TC-27, TC-29, TC-30.
// The real guards from dal.ts run against a mocked session and database, so a
// participant or judge calling an action directly is refused the same way the
// pages refuse them. redirect() and notFound() throw like the real ones.

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
  event: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  team: { findFirst: vi.fn() },
  $queryRaw: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ...db,
    $transaction: (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  },
}));

const { createEvent } = await import("@/app/organizer/events/new/actions");
const { updateEvent } =
  await import("@/app/organizer/events/[eventId]/edit/actions");

function signInAs(role: Role | null) {
  auth.mockResolvedValue(role && { user: { id: "user-1" } });
  db.user.findUnique.mockResolvedValue(
    role && { id: "user-1", email: "user@hackhub.test", role },
  );
}

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const VALID = {
  name: "Autumn Hack",
  description: "Build something useful.",
  startDate: "2026-10-29",
  endDate: "2026-10-30",
  maxTeamSize: "4",
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

beforeEach(() => {
  vi.clearAllMocks();
  db.event.findUnique.mockResolvedValue({ id: "event-1" });
  db.event.create.mockResolvedValue({ id: "event-1" });
  db.team.findFirst.mockResolvedValue(null);
});

describe("createEvent", () => {
  it.each([
    ["PARTICIPANT", "/my-events?notice=no-access"],
    ["JUDGE", "/judge?notice=no-access"],
  ] as const)("refuses a %s (TC-26, TC-30)", async (role, home) => {
    signInAs(role);
    await expect(createEvent(null, form(VALID))).rejects.toThrow(
      `NEXT_REDIRECT ${home}`,
    );
    expect(db.event.create).not.toHaveBeenCalled();
  });

  it("sends a signed-out caller to /login", async () => {
    signInAs(null);
    await expect(createEvent(null, form(VALID))).rejects.toThrow(
      "NEXT_REDIRECT /login",
    );
    expect(db.event.create).not.toHaveBeenCalled();
  });

  it("creates the event with registration closed, then opens the overview (TC-27, TC-28)", async () => {
    signInAs("ORGANIZER");
    await expect(createEvent(null, form(VALID))).rejects.toThrow(
      "NEXT_REDIRECT /organizer/events/event-1?saved=created",
    );
    expect(db.event.create).toHaveBeenCalledWith({
      data: {
        name: "Autumn Hack",
        description: "Build something useful.",
        startDate: day("2026-10-29"),
        endDate: day("2026-10-30"),
        maxTeamSize: 4,
        registrationOpen: false,
        createdById: "user-1",
      },
      select: { id: true },
    });
  });

  it("saves an event that starts and ends on the same day (TC-24)", async () => {
    signInAs("ORGANIZER");
    await expect(
      createEvent(null, form({ ...VALID, endDate: VALID.startDate })),
    ).rejects.toThrow("NEXT_REDIRECT /organizer/events/event-1?saved=created");
    expect(db.event.create).toHaveBeenCalledOnce();
  });

  it("refuses an end date before the start date (TC-24, TC-29)", async () => {
    signInAs("ORGANIZER");
    const values = { ...VALID, endDate: "2026-10-28" };
    await expect(createEvent(null, form(values))).resolves.toEqual({
      ok: false,
      fieldErrors: {
        endDate: ["The end date can't be before the start date."],
      },
      values,
    });
    expect(db.event.create).not.toHaveBeenCalled();
  });

  it("returns field errors and the submitted values for invalid input", async () => {
    signInAs("ORGANIZER");
    const values = { ...VALID, name: " ", maxTeamSize: "11" };
    await expect(createEvent(null, form(values))).resolves.toEqual({
      ok: false,
      fieldErrors: {
        name: ["Enter the event name."],
        maxTeamSize: ["Team size must be a whole number from 1 to 10."],
      },
      values,
    });
    expect(db.event.create).not.toHaveBeenCalled();
  });
});

describe("updateEvent", () => {
  it.each([
    ["PARTICIPANT", "/my-events?notice=no-access"],
    ["JUDGE", "/judge?notice=no-access"],
  ] as const)("refuses a %s (TC-26, TC-30)", async (role, home) => {
    signInAs(role);
    await expect(updateEvent("event-1", null, form(VALID))).rejects.toThrow(
      `NEXT_REDIRECT ${home}`,
    );
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("shows the not-found page for an unknown event", async () => {
    signInAs("ORGANIZER");
    db.event.findUnique.mockResolvedValue(null);
    await expect(updateEvent("nope", null, form(VALID))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("saves the details, then opens the overview (TC-25)", async () => {
    signInAs("ORGANIZER");
    db.team.findFirst.mockResolvedValue({
      name: "Byte Me",
      _count: { members: 3 },
    });
    await expect(
      updateEvent("event-1", null, form({ ...VALID, maxTeamSize: "3" })),
    ).rejects.toThrow("NEXT_REDIRECT /organizer/events/event-1?saved=updated");
    expect(db.$queryRaw).toHaveBeenCalledOnce();
    expect(db.event.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: {
        name: "Autumn Hack",
        description: "Build something useful.",
        startDate: day("2026-10-29"),
        endDate: day("2026-10-30"),
        maxTeamSize: 3,
      },
    });
  });

  it("refuses an end date before the start date (TC-29)", async () => {
    signInAs("ORGANIZER");
    const values = { ...VALID, startDate: "2026-11-01" };
    await expect(updateEvent("event-1", null, form(values))).resolves.toEqual({
      ok: false,
      fieldErrors: {
        endDate: ["The end date can't be before the start date."],
      },
      values,
    });
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("refuses a max team size below the largest team", async () => {
    signInAs("ORGANIZER");
    db.team.findFirst.mockResolvedValue({
      name: "Byte Me",
      _count: { members: 3 },
    });
    const values = { ...VALID, maxTeamSize: "2" };
    await expect(updateEvent("event-1", null, form(values))).resolves.toEqual({
      ok: false,
      fieldErrors: {
        maxTeamSize: [
          "Byte Me already has 3 members, so the max can't be lower than 3.",
        ],
      },
      values,
    });
    expect(db.event.update).not.toHaveBeenCalled();
  });
});
