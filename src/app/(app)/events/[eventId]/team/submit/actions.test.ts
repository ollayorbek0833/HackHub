import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

// submitProject (#7): the server refuses invalid input, closed submissions and
// users without a team, and keeps one submission per team. Guards and Prisma
// are mocked; redirect() and notFound() throw like the real ones.

const requireRole = vi.fn();
const requireTeamMember = vi.fn();
vi.mock("@/lib/auth/dal", () => ({
  requireRole: (...roles: unknown[]) => requireRole(...roles),
  requireTeamMember: (eventId: string) => requireTeamMember(eventId),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const tx = {
  $queryRaw: vi.fn(),
  event: { findUnique: vi.fn() },
  submission: { findUnique: vi.fn(), upsert: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  },
}));

const { submitProject } = await import("./actions");

const valid = {
  title: "Campus Map",
  description: "Find a free room in seconds.",
  repoUrl: "https://github.com/team/campus-map",
};

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  requireRole
    .mockReset()
    .mockResolvedValue({ id: "user-1", role: "PARTICIPANT" });
  requireTeamMember
    .mockReset()
    .mockResolvedValue({ id: "team-1", eventId: "event-1", name: "Byte Me" });
  tx.$queryRaw.mockReset().mockResolvedValue([]);
  tx.event.findUnique
    .mockReset()
    .mockResolvedValue({ submissionsOpen: true, resultsPublished: false });
  tx.submission.findUnique.mockReset().mockResolvedValue(null);
  tx.submission.upsert.mockReset().mockResolvedValue({});
});

describe("submitProject", () => {
  it("creates the team's submission on the first submit (TC-64, TC-69)", async () => {
    const result = await submitProject("event-1", null, form(valid));

    expect(requireRole).toHaveBeenCalledWith("PARTICIPANT");
    expect(requireTeamMember).toHaveBeenCalledWith("event-1");
    expect(tx.submission.upsert).toHaveBeenCalledWith({
      where: { teamId: "team-1" },
      create: { teamId: "team-1", ...valid },
      update: valid,
    });
    expect(result).toEqual({ ok: true, message: "Project submitted." });
  });

  it("updates the same row on a second submit (TC-66, TC-121)", async () => {
    tx.submission.findUnique.mockResolvedValue({ id: "sub-1" });

    const result = await submitProject("event-1", null, form(valid));

    expect(tx.submission.upsert.mock.calls[0][0].where).toEqual({
      teamId: "team-1",
    });
    expect(result).toEqual({ ok: true, message: "Submission updated." });
  });

  it("refuses a repository link that isn't http(s) (TC-65, TC-70)", async () => {
    const result = await submitProject(
      "event-1",
      null,
      form({ ...valid, repoUrl: "ftp://example.com/x" }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        repoUrl: ["Enter a valid link, like https://github.com/team/project."],
      },
      values: { repoUrl: "ftp://example.com/x" },
    });
    expect(tx.submission.upsert).not.toHaveBeenCalled();
  });

  it("refuses a missing title and description", async () => {
    const result = await submitProject(
      "event-1",
      null,
      form({ ...valid, title: " ", description: "" }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        title: ["Enter a project title."],
        description: ["Add a description."],
      },
    });
  });

  it("refuses while submissions are closed (TC-67, TC-71)", async () => {
    tx.event.findUnique.mockResolvedValue({
      submissionsOpen: false,
      resultsPublished: false,
    });

    const result = await submitProject("event-1", null, form(valid));

    expect(result).toMatchObject({
      ok: false,
      formError: "Submissions are closed for this event.",
    });
    expect(tx.submission.upsert).not.toHaveBeenCalled();
  });

  it("refuses after results are published", async () => {
    tx.event.findUnique.mockResolvedValue({
      submissionsOpen: true,
      resultsPublished: true,
    });

    const result = await submitProject("event-1", null, form(valid));

    expect(result).toMatchObject({
      formError: "Submissions are closed for this event.",
    });
  });

  it("stops at the guard for a user who isn't on a team", async () => {
    requireTeamMember.mockRejectedValue(
      new Error("NEXT_REDIRECT /events/event-1/team"),
    );

    await expect(submitProject("event-1", null, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /events/event-1/team",
    );
    expect(tx.submission.upsert).not.toHaveBeenCalled();
  });

  it("stops at the guard for a judge or organizer", async () => {
    requireRole.mockRejectedValue(
      new Error("NEXT_REDIRECT /judge?notice=no-access"),
    );

    await expect(submitProject("event-1", null, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(requireTeamMember).not.toHaveBeenCalled();
  });

  it("answers a simultaneous first submit by a teammate with a message", async () => {
    tx.submission.upsert.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7",
      }),
    );

    const result = await submitProject("event-1", null, form(valid));

    expect(result).toMatchObject({
      ok: false,
      formError: expect.stringContaining("Reload the page"),
    });
  });

  it("sends an unknown event to the not-found page", async () => {
    tx.event.findUnique.mockResolvedValue(null);

    await expect(submitProject("event-1", null, form(valid))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
