import { beforeEach, describe, expect, it, vi } from "vitest";

// saveProfile (#4): the server refuses a profile without a name or faculty,
// and it always writes the signed-in user's own profile, whatever the form
// says. The session guard and Prisma are mocked.

const requireUser = vi.fn();
vi.mock("@/lib/auth/dal", () => ({ requireUser: () => requireUser() }));

const upsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { profile: { upsert: (args: unknown) => upsert(args) } },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { saveProfile } = await import("./actions");

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) data.append(key, v);
  }
  return data;
}

const valid = {
  name: "Aziza Karimova",
  faculty: "Computer Science",
  skills: ["React", "TypeScript"],
  bio: "I like hackathons.",
  links: ["https://github.com/aziza"],
};

beforeEach(() => {
  requireUser.mockReset().mockResolvedValue({
    id: "user-1",
    email: "a@hackhub.test",
    role: "PARTICIPANT",
  });
  upsert.mockReset().mockResolvedValue({});
});

describe("saveProfile", () => {
  it("upserts the signed-in user's profile (TC-10, TC-13)", async () => {
    const result = await saveProfile(null, form(valid));

    expect(result).toEqual({ ok: true, message: "Profile saved." });
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", ...valid },
      update: valid,
    });
  });

  it("takes the user id from the session, never the form", async () => {
    await saveProfile(null, form({ ...valid, userId: "someone-else" }));

    const args = upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1" });
    expect(args.create.userId).toBe("user-1");
    expect(args.update).not.toHaveProperty("userId");
  });

  it("refuses a missing name and faculty with field errors (TC-11)", async () => {
    const result = await saveProfile(
      null,
      form({ ...valid, name: " ", faculty: "" }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        name: ["Enter your name."],
        faculty: ["Enter your faculty."],
      },
      values: { name: " ", faculty: "" },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses a link that isn't a full https:// URL", async () => {
    const result = await saveProfile(
      null,
      form({ ...valid, links: ["github.com/aziza"] }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { links: ["Enter a full link starting with https://."] },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("stores an empty bio as null", async () => {
    await saveProfile(null, form({ ...valid, bio: "   " }));

    expect(upsert.mock.calls[0][0].update.bio).toBeNull();
  });

  it("stops at the guard for a signed-out visitor", async () => {
    requireUser.mockRejectedValue(new Error("NEXT_REDIRECT /login"));

    await expect(saveProfile(null, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /login",
    );
    expect(upsert).not.toHaveBeenCalled();
  });
});
