import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/generated/prisma/enums";

// Event images through createEvent and updateEvent, with real files: sharp
// converts them and they're written to a temporary UPLOAD_DIR. The session
// and the database are mocked, as in event-actions.test.ts.

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
  event: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  team: { findFirst: vi.fn() },
  $queryRaw: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    ...db,
    $transaction: (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  },
}));

const uploads = await mkdtemp(path.join(tmpdir(), "hackhub-uploads-"));
process.env.UPLOAD_DIR = uploads;

const { createEvent } = await import("@/app/organizer/events/new/actions");
const { updateEvent } =
  await import("@/app/organizer/events/[eventId]/edit/actions");
const { storeEventImage } = await import("@/lib/uploads/storage");
const { readUpload } = await import("@/lib/uploads/storage");

afterAll(() => rm(uploads, { recursive: true, force: true }));

function signInAs(role: Role | null) {
  auth.mockResolvedValue(role && { user: { id: "user-1" } });
  db.user.findUnique.mockResolvedValue(
    role && { id: "user-1", email: "user@hackhub.test", role },
  );
}

const VALID = {
  name: "Autumn Hack",
  description: "Build something useful.",
  startDate: "2026-10-29",
  endDate: "2026-10-30",
  maxTeamSize: "4",
};

async function png(width: number, height: number) {
  const bytes = await sharp({
    create: { width, height, channels: 3, background: "#3366ff" },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(bytes)], "image.png", { type: "image/png" });
}

function form(fields: Record<string, string | File>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...VALID, ...fields })) {
    formData.set(key, value);
  }
  return formData;
}

async function filesOf(eventId: string) {
  try {
    return (await readdir(path.join(uploads, "events", eventId))).sort();
  } catch {
    return [];
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  db.event.findUnique.mockResolvedValue({
    id: "event-1",
    createdById: "user-1",
  });
  db.event.create.mockResolvedValue({ id: "event-1" });
  db.team.findFirst.mockResolvedValue(null);
  db.event.findUniqueOrThrow.mockResolvedValue({
    logoPath: null,
    bannerPath: null,
  });
});

describe("event image uploads", () => {
  it.each([
    ["PARTICIPANT", "/my-events?notice=no-access"],
    ["JUDGE", "/judge?notice=no-access"],
    [null, "/login"],
  ] as const)("refuses a %s before anything is stored", async (role, home) => {
    signInAs(role);
    const logo = await png(600, 600);
    await expect(createEvent(null, form({ logo }))).rejects.toThrow(
      `NEXT_REDIRECT ${home}`,
    );
    await expect(updateEvent("event-x", null, form({ logo }))).rejects.toThrow(
      `NEXT_REDIRECT ${home}`,
    );
    expect(await filesOf("event-1")).toEqual([]);
    expect(await filesOf("event-x")).toEqual([]);
    expect(db.event.create).not.toHaveBeenCalled();
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("stores the logo as 512x512 and the banner as 1600x600 WebP on create", async () => {
    signInAs("ORGANIZER");
    db.event.create.mockResolvedValue({ id: "event-new" });
    await expect(
      createEvent(
        null,
        form({ logo: await png(800, 400), banner: await png(1000, 1000) }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT /organizer/events/event-new?saved=created",
    );

    const update = db.event.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: "event-new" });
    const { logoPath, bannerPath } = update.data;
    expect(logoPath).toMatch(/^events\/event-new\/logo-[0-9a-f]{16}\.webp$/);
    expect(bannerPath).toMatch(
      /^events\/event-new\/banner-[0-9a-f]{16}\.webp$/,
    );

    const logo = await sharp(path.join(uploads, logoPath)).metadata();
    const banner = await sharp(path.join(uploads, bannerPath)).metadata();
    expect([logo.format, logo.width, logo.height]).toEqual(["webp", 512, 512]);
    expect([banner.format, banner.width, banner.height]).toEqual([
      "webp",
      1600,
      600,
    ]);
    expect(await readUpload(logoPath.split("/"))).not.toBeNull();
  });

  it("refuses a file that isn't an image, per field, and stores nothing", async () => {
    signInAs("ORGANIZER");
    const fake = new File(["<?php echo 1;"], "logo.png", { type: "image/png" });
    const result = await createEvent(null, form({ logo: fake }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { logo: ["Choose a PNG, JPEG or WebP image."] },
    });
    expect(db.event.create).not.toHaveBeenCalled();
  });

  it("refuses an image over 5 MB with the field error", async () => {
    signInAs("ORGANIZER");
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });
    const result = await updateEvent("event-1", null, form({ banner: big }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { banner: ["The image must be 5 MB or smaller."] },
    });
    expect(db.event.update).not.toHaveBeenCalled();
  });

  it("shows image errors together with the other field errors", async () => {
    signInAs("ORGANIZER");
    const fake = new File(["nope"], "logo.png", { type: "image/png" });
    const result = await createEvent(null, form({ name: "", logo: fake }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        name: ["Enter the event name."],
        logo: ["Choose a PNG, JPEG or WebP image."],
      },
    });
  });

  it("replaces the logo and deletes the old file after the update", async () => {
    signInAs("ORGANIZER");
    const prepared = {
      kind: "logo" as const,
      webp: await sharp({
        create: { width: 512, height: 512, channels: 3, background: "#000" },
      })
        .webp()
        .toBuffer(),
    };
    const old = await storeEventImage("event-2", prepared);
    db.event.findUnique.mockResolvedValue({
      id: "event-2",
      createdById: "user-1",
    });
    db.event.findUniqueOrThrow.mockResolvedValue({
      logoPath: old,
      bannerPath: null,
    });

    await expect(
      updateEvent("event-2", null, form({ logo: await png(512, 512) })),
    ).rejects.toThrow("NEXT_REDIRECT /organizer/events/event-2?saved=updated");

    const { logoPath } = db.event.update.mock.calls[0][0].data;
    expect(logoPath).not.toBe(old);
    expect(await filesOf("event-2")).toEqual([path.basename(logoPath)]);
  });

  it("removes the banner when asked and deletes its file", async () => {
    signInAs("ORGANIZER");
    const prepared = {
      kind: "banner" as const,
      webp: await sharp({
        create: { width: 1600, height: 600, channels: 3, background: "#000" },
      })
        .webp()
        .toBuffer(),
    };
    const old = await storeEventImage("event-3", prepared);
    db.event.findUnique.mockResolvedValue({
      id: "event-3",
      createdById: "user-1",
    });
    db.event.findUniqueOrThrow.mockResolvedValue({
      logoPath: null,
      bannerPath: old,
    });

    await expect(
      updateEvent("event-3", null, form({ removeBanner: "on" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(db.event.update.mock.calls[0][0].data.bannerPath).toBeNull();
    expect(db.event.update.mock.calls[0][0].data).not.toHaveProperty(
      "logoPath",
    );
    await expect(stat(path.join(uploads, old))).rejects.toThrow();
  });

  it("keeps the old file and drops the new one when the update is refused", async () => {
    signInAs("ORGANIZER");
    db.event.findUnique.mockResolvedValue({
      id: "event-4",
      createdById: "user-1",
    });
    db.team.findFirst.mockResolvedValue({
      name: "Null Pointers",
      _count: { members: 4 },
    });
    const result = await updateEvent(
      "event-4",
      null,
      form({ maxTeamSize: "2", logo: await png(512, 512) }),
    );
    expect(result).toMatchObject({ ok: false });
    expect(db.event.update).not.toHaveBeenCalled();
    expect(await filesOf("event-4")).toEqual([]);
  });
});
