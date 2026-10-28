// Gives the showcase events (prisma/seed-showcase.ts) their logos and banners
// from prisma/showcase-assets/. See docs/04-setup-and-deployment.md >
// Showcase images.
//
//   UPLOAD_DIR=<dir> npx tsx prisma/seed-showcase-images.ts [--apply]
//
// - Dry run by default: prints what it would do. Writes only with --apply.
// - Matches events by name: an event gets an image when
//   showcase-assets/{logos,banners}/<slug of its name>.webp both exist.
//   Events with other names are left alone.
// - For each match: writes the two files as
//   events/<eventId>/<kind>-<16 hex>.webp (the upload pattern; the hex is from
//   the file's bytes), sets logoPath and bannerPath in one transaction, then
//   deletes the files the event used before.
// - The dry run marks an event "replace" when its current image is an
//   organizer's own upload, which --apply would replace and delete.
// - The files and the directories it creates get the owner of the UPLOAD_DIR
//   root (in production the app's non-root user), with modes 755 and 644, so
//   organizers can still replace the images from the app.
// - Running it again changes nothing: files already in place with the same
//   bytes aren't rewritten, and events already pointing at them aren't updated.
import "dotenv/config";
import { existsSync } from "node:fs";
import { chmod, chown, lstat, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { isSafeSegment, resolveUploadPath } from "../src/lib/uploads/files";
import { assetSlug, isShowcaseImagePath, showcaseImagePath } from "./showcase-assets/manifest";

const apply = process.argv.includes("--apply");
const assets = path.join(__dirname, "showcase-assets");
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "uploads");

const KINDS = ["logo", "banner"] as const;
type Kind = (typeof KINDS)[number];
const FOLDER: Record<Kind, string> = { logo: "logos", banner: "banners" };

type PlannedFile = {
  relative: string;
  bytes: Buffer;
  /** The event's current path for this kind. */
  old: string | null;
  /** The file is already at `relative` with these exact bytes: nothing to write. */
  written: boolean;
  /** `old` is an organizer's own upload (not a showcase asset), which --apply replaces and deletes. */
  replacesUpload: boolean;
};
type Planned = { id: string; name: string; files: Record<Kind, PlannedFile> };

/** The bytes at a path inside UPLOAD_DIR, or null when it's unsafe or missing. */
async function readStored(relative: string): Promise<Buffer | null> {
  const full = resolveUploadPath(uploadRoot, relative);
  return full ? readFile(full).catch(() => null) : null;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const db = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    console.log(`${apply ? "Applying" : "Dry run (pass --apply to write)"}: database ${db[0]?.db}, UPLOAD_DIR ${uploadRoot}\n`);

    const slugs = new Set(
      (await readdir(path.join(assets, "banners"))).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)),
    );
    const events = await prisma.event.findMany({
      select: { id: true, name: true, logoPath: true, bannerPath: true },
      orderBy: { name: "asc" },
    });

    let written = 0;
    let updated = 0;
    const planned: Planned[] = [];
    const missing: string[] = [];
    const unmatched: string[] = [];
    const used = new Set<string>();
    for (const event of events) {
      const slug = assetSlug(event.name);
      const paths = { logo: path.join(assets, "logos", `${slug}.webp`), banner: path.join(assets, "banners", `${slug}.webp`) };
      if (!slugs.has(slug) && !existsSync(paths.logo)) {
        unmatched.push(event.name);
        continue;
      }
      used.add(slug);
      if (!existsSync(paths.logo) || !existsSync(paths.banner)) {
        missing.push(`${event.name} (${KINDS.filter((k) => !existsSync(paths[k])).map((k) => `${FOLDER[k]}/${slug}.webp`).join(", ")})`);
        continue;
      }
      if (!isSafeSegment(event.id)) throw new Error(`Unsafe event id: ${event.id}`);
      const files = {} as Planned["files"];
      for (const kind of KINDS) {
        const bytes = await readFile(paths[kind]);
        const relative = showcaseImagePath(event.id, kind, bytes);
        const old = kind === "logo" ? event.logoPath : event.bannerPath;
        const existing = await readStored(relative);
        const oldBytes = old && old !== relative ? await readStored(old) : null;
        files[kind] = {
          relative,
          bytes,
          old,
          written: existing !== null && existing.equals(bytes),
          // A showcase file's name carries its own hash; an upload's is random.
          replacesUpload: oldBytes !== null && !isShowcaseImagePath(old!, oldBytes),
        };
      }
      planned.push({ id: event.id, name: event.name, files });
    }

    for (const p of planned) {
      const uploads = KINDS.filter((k) => p.files[k].replacesUpload);
      const unchanged = KINDS.every((k) => p.files[k].old === p.files[k].relative && p.files[k].written);
      const label = uploads.length ? "replace  " : unchanged ? "unchanged" : "set      ";
      const note = uploads.length ? `  (will replace an organizer upload: ${uploads.join(" and ")})` : "";
      console.log(`  ${label}  ${p.name}${note}`);
    }

    if (apply && planned.length > 0) {
      const owner = await stat(uploadRoot).catch(() => null);
      if (!owner?.isDirectory()) throw new Error(`UPLOAD_DIR ${uploadRoot} isn't a directory.`);

      // 1. Write the new files. A file already there with the same bytes is
      //    left untouched (the app may be serving it).
      for (const p of planned) {
        for (const kind of KINDS) {
          if (p.files[kind].written) continue;
          const full = resolveUploadPath(uploadRoot, p.files[kind].relative);
          if (!full) throw new Error(`Unsafe path ${p.files[kind].relative}`);
          await mkdir(path.dirname(full), { recursive: true });
          await writeFile(full, p.files[kind].bytes);
          await own(full, path.dirname(full), owner.uid, owner.gid);
        }
      }
      // 2. Point the events that need it at them, all in one transaction.
      const changed = planned.filter((p) => KINDS.some((k) => p.files[k].old !== p.files[k].relative));
      await prisma.$transaction(
        changed.map((p) =>
          prisma.event.update({
            where: { id: p.id },
            data: { logoPath: p.files.logo.relative, bannerPath: p.files.banner.relative },
          }),
        ),
      );
      written = planned.reduce((n, p) => n + KINDS.filter((k) => !p.files[k].written).length, 0);
      updated = changed.length;
      // 3. Delete the images they used before.
      for (const p of planned) {
        for (const kind of KINDS) {
          const { old, relative } = p.files[kind];
          if (!old || old === relative) continue;
          const full = resolveUploadPath(uploadRoot, old);
          if (full) await unlink(full).catch((e: NodeJS.ErrnoException) => { if (e.code !== "ENOENT") throw e; });
        }
      }
    }

    const unused = [...slugs].filter((s) => !used.has(s));
    console.log(
      `\nMatched: ${planned.length} event(s)${apply ? `; wrote ${written} file(s), updated ${updated} event(s)` : " (dry run, nothing written)"}.`,
    );
    console.log(`Missing assets: ${missing.length}${missing.length ? `\n  ${missing.join("\n  ")}` : ""}`);
    console.log(`Events without assets (left alone): ${unmatched.length}${unmatched.length ? `\n  ${unmatched.join("\n  ")}` : ""}`);
    if (unused.length) console.log(`Assets with no event: ${unused.length}\n  ${unused.join("\n  ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Gives the file and its directories up to UPLOAD_DIR the root's owner (only
 * root may chown to another user; anyone else already owns what they wrote)
 * and modes 644 / 755.
 */
async function own(file: string, dir: string, uid: number, gid: number) {
  const chownTo = async (p: string) => {
    const s = await lstat(p);
    if (s.uid !== uid || s.gid !== gid) await chown(p, uid, gid);
  };
  await chmod(file, 0o644);
  await chownTo(file);
  for (let d = dir; d.startsWith(uploadRoot + path.sep); d = path.dirname(d)) {
    await chmod(d, 0o755);
    await chownTo(d);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
