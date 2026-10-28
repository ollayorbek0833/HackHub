import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/generated/prisma/enums";

// requireRole must trust the database, not the role in the JWT (S-3). The
// session and the database are mocked; redirect() throws like the real one.

vi.mock("server-only", () => ({}));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const findUnique = vi.fn();
const findEvent = vi.fn();
const findMembership = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (args: unknown) => findUnique(args) },
    event: { findUnique: (args: unknown) => findEvent(args) },
    teamMember: { findUnique: (args: unknown) => findMembership(args) },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const {
  getCurrentUser,
  requireEvent,
  requireOwnedEvent,
  requireRole,
  requireTeamMember,
  requireUser,
} = await import("@/lib/auth/dal");

function signIn(jwtRole: Role, dbRole: Role | null) {
  auth.mockResolvedValue({ user: { id: "user-1", role: jwtRole } });
  findUnique.mockResolvedValue(
    dbRole && { id: "user-1", email: "user@hackhub.test", role: dbRole },
  );
}

beforeEach(() => {
  auth.mockReset();
  findUnique.mockReset();
  findEvent.mockReset();
  findMembership.mockReset();
});

describe("getCurrentUser", () => {
  it("reads the user by the session's id", async () => {
    signIn("JUDGE", "JUDGE");

    await expect(getCurrentUser()).resolves.toEqual({
      id: "user-1",
      email: "user@hackhub.test",
      role: "JUDGE",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, email: true, role: true },
    });
  });

  it("is null when signed out, without querying", async () => {
    auth.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("requireUser", () => {
  it("sends a signed-out visitor to /login", async () => {
    auth.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT /login");
  });

  it("sends a session whose user no longer exists to /login", async () => {
    signIn("PARTICIPANT", null);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT /login");
  });
});

describe("requireRole", () => {
  it("returns the user when the database role is allowed", async () => {
    signIn("ORGANIZER", "ORGANIZER");

    await expect(requireRole("ORGANIZER")).resolves.toMatchObject({
      role: "ORGANIZER",
    });
  });

  it("accepts any of several roles", async () => {
    signIn("JUDGE", "JUDGE");

    await expect(requireRole("PARTICIPANT", "JUDGE")).resolves.toMatchObject({
      role: "JUDGE",
    });
  });

  it("refuses a stale JWT role the database no longer has", async () => {
    // Was a judge at login, demoted since.
    signIn("JUDGE", "PARTICIPANT");

    await expect(requireRole("JUDGE")).rejects.toThrow(
      "NEXT_REDIRECT /my-events?notice=no-access",
    );
  });

  it("accepts a role granted after login, without logging in again", async () => {
    // Was a participant at login, made a judge since.
    signIn("PARTICIPANT", "JUDGE");

    await expect(requireRole("JUDGE")).resolves.toMatchObject({
      role: "JUDGE",
    });
  });

  it("sends a wrong role to its own role home", async () => {
    signIn("ORGANIZER", "ORGANIZER");

    await expect(requireRole("JUDGE")).rejects.toThrow(
      "NEXT_REDIRECT /organizer?notice=no-access",
    );
  });
});

describe("requireEvent", () => {
  it("returns the event", async () => {
    findEvent.mockResolvedValue({ id: "event-1", name: "Demo Hack" });

    await expect(requireEvent("event-1")).resolves.toMatchObject({
      id: "event-1",
    });
    expect(findEvent).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "event-1" } }),
    );
  });

  it("shows the not-found page for an unknown id", async () => {
    findEvent.mockResolvedValue(null);

    await expect(requireEvent("missing")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("requireOwnedEvent", () => {
  const event = {
    id: "event-1",
    name: "Demo Hack",
    createdById: "user-1",
  };

  it("returns the organizer and the event they created", async () => {
    signIn("ORGANIZER", "ORGANIZER");
    findEvent.mockResolvedValue(event);

    await expect(requireOwnedEvent("event-1")).resolves.toEqual({
      user: { id: "user-1", email: "user@hackhub.test", role: "ORGANIZER" },
      event,
    });
    expect(findEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event-1" },
        select: expect.objectContaining({ createdById: true }),
      }),
    );
  });

  it("shows the not-found page for another organizer's event", async () => {
    signIn("ORGANIZER", "ORGANIZER");
    findEvent.mockResolvedValue({ ...event, createdById: "organizer-2" });

    await expect(requireOwnedEvent("event-1")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("shows the not-found page for an unknown id", async () => {
    signIn("ORGANIZER", "ORGANIZER");
    findEvent.mockResolvedValue(null);

    await expect(requireOwnedEvent("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("sends a participant or judge home before reading the event", async () => {
    signIn("PARTICIPANT", "PARTICIPANT");

    await expect(requireOwnedEvent("event-1")).rejects.toThrow(
      "NEXT_REDIRECT /my-events?notice=no-access",
    );
    expect(findEvent).not.toHaveBeenCalled();
  });

  it("sends a signed-out visitor to /login", async () => {
    auth.mockResolvedValue(null);

    await expect(requireOwnedEvent("event-1")).rejects.toThrow(
      "NEXT_REDIRECT /login",
    );
    expect(findEvent).not.toHaveBeenCalled();
  });
});

describe("requireTeamMember", () => {
  it("returns the user's team in the event", async () => {
    signIn("PARTICIPANT", "PARTICIPANT");
    const team = {
      id: "team-1",
      eventId: "event-1",
      name: "Byte",
      inviteCode: "ABC234",
    };
    findMembership.mockResolvedValue({ team });

    await expect(requireTeamMember("event-1")).resolves.toEqual(team);
    expect(findMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId_userId: { eventId: "event-1", userId: "user-1" } },
      }),
    );
  });

  it("sends a user without a team to the event's team page", async () => {
    signIn("PARTICIPANT", "PARTICIPANT");
    findMembership.mockResolvedValue(null);

    await expect(requireTeamMember("event-1")).rejects.toThrow(
      "NEXT_REDIRECT /events/event-1/team",
    );
  });

  it("sends a signed-out visitor to /login", async () => {
    auth.mockResolvedValue(null);

    await expect(requireTeamMember("event-1")).rejects.toThrow(
      "NEXT_REDIRECT /login",
    );
    expect(findMembership).not.toHaveBeenCalled();
  });
});
