// Dev only: downloads the showcase banner photos (manifest.ts) from Unsplash
// and writes banners/<slug>.webp (1600×600, cropped to cover) and CREDITS.md.
// The outputs are committed, so production never needs network access.
//
//   npx tsx prisma/showcase-assets/build-banners.ts [--only=<slug>]
//
// Downloads are cached in $TMPDIR/hackhub-showcase-photos. The UI writes no
// text on banners (the logo overlaps the bottom-left corner on its own ring),
// so the photos get no scrim.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";

import { assetSlug, SHOWCASE_ASSETS } from "./manifest";

const WIDTH = 1600;
const HEIGHT = 600;
/** Aim for 120–220 KB: start at q80 and step down for very busy photos. */
const MAX_BYTES = 220 * 1024;

const here = __dirname;
const cache = path.join(tmpdir(), "hackhub-showcase-photos");

async function photo(id: string): Promise<Buffer> {
  const file = path.join(cache, `${id}.jpg`);
  if (existsSync(file)) return readFile(file);
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=2400&q=90&fm=jpg`);
  if (!res.ok) throw new Error(`photo-${id}: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await mkdir(cache, { recursive: true });
  await writeFile(file, bytes);
  return bytes;
}

async function banner(source: Buffer, focus: { x?: number; y?: number } = {}) {
  const meta = await sharp(source).rotate().metadata();
  const w = meta.autoOrient?.width ?? meta.width!;
  const h = meta.autoOrient?.height ?? meta.height!;
  // Scale to cover 1600×600, then cut the window at the focus point.
  const scale = Math.max(WIDTH / w, HEIGHT / h);
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);
  const left = Math.round((sw - WIDTH) * (focus.x ?? 0.5));
  const top = Math.round((sh - HEIGHT) * (focus.y ?? 0.5));
  const cropped = await sharp(source)
    .rotate()
    .resize(sw, sh)
    .extract({ left, top, width: WIDTH, height: HEIGHT })
    .toBuffer();
  for (let quality = 80; ; quality -= 4) {
    const webp = await sharp(cropped).webp({ quality, effort: 6 }).toBuffer();
    if (webp.length <= MAX_BYTES || quality <= 64) return { webp, quality };
  }
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  await mkdir(path.join(here, "banners"), { recursive: true });
  for (const asset of SHOWCASE_ASSETS) {
    const slug = assetSlug(asset.name);
    if (only && slug !== only) continue;
    const { webp, quality } = await banner(await photo(asset.banner.photo), asset.banner.focus);
    await writeFile(path.join(here, "banners", `${slug}.webp`), webp);
    console.log(`${slug.padEnd(32)} q${quality} ${Math.round(webp.length / 1024)} KB`);
  }

  const rows = [...SHOWCASE_ASSETS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => `| ${a.name} | \`banners/${assetSlug(a.name)}.webp\` | [${a.banner.page.replace("https://", "")}](${a.banner.page}) | ${a.banner.photographer} | Unsplash License |`);
  const credits = `# Showcase image credits

The banners in \`banners/\` are photos from [Unsplash](https://unsplash.com), cropped to 1600×600 and saved as WebP.
Each one is free to use under the [Unsplash License](https://unsplash.com/license) (checked on its page; none is
Unsplash+). The license doesn't require attribution; we record it anyway.

The logos in \`logos/\` are drawn by \`generate-logos.ts\`: a [Lucide](https://lucide.dev) icon (ISC License) and a
monogram set in Space Grotesk (SIL Open Font License) on a tile in the Scoreboard colours (DESIGN.md).

Rebuild: \`npx tsx prisma/showcase-assets/build-banners.ts\` and \`npx tsx prisma/showcase-assets/generate-logos.ts\`
(dev only; see the comments at the top of each). Apply: \`npm run db:seed:showcase-images\`.

| Event | Banner | Photo | Photographer | License |
|---|---|---|---|---|
${rows.join("\n")}
`;
  if (!only) await writeFile(path.join(here, "CREDITS.md"), credits);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
