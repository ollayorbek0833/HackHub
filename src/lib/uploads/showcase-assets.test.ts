import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { EVENTS } from "../../../prisma/seed-showcase-data";
import { logoSvg, STYLES } from "../../../prisma/showcase-assets/generate-logos";
import {
  assetSlug,
  isShowcaseImagePath,
  SHOWCASE_ASSETS,
  showcaseImagePath,
} from "../../../prisma/showcase-assets/manifest";
import { EVENT_IMAGE_SIZE, resolveUploadPath } from "./files";

// The committed showcase images (prisma/showcase-assets) must cover every
// showcase event, at the sizes the upload pipeline stores, or the apply script
// (prisma/seed-showcase-images.ts) silently leaves events on the fallback art.

const ASSETS = path.join(process.cwd(), "prisma/showcase-assets");

describe("showcase assets", () => {
  it("has one entry per showcase event, and nothing else", () => {
    expect(SHOWCASE_ASSETS.map((a) => a.name).sort()).toEqual(
      EVENTS.map((e) => e.name).sort(),
    );
  });

  it("uses a different photo and monogram for every event", () => {
    const photos = SHOWCASE_ASSETS.map((a) => a.banner.photo);
    const monograms = SHOWCASE_ASSETS.map((a) => a.logo.monogram);
    expect(new Set(photos).size).toBe(SHOWCASE_ASSETS.length);
    expect(new Set(monograms).size).toBe(SHOWCASE_ASSETS.length);
  });

  it("gives each organizer's ten events ten different logo styles", () => {
    for (let i = 0; i < SHOWCASE_ASSETS.length; i += 10) {
      const styles = SHOWCASE_ASSETS.slice(i, i + 10).map((a) => a.logo.style);
      expect(new Set(styles).size).toBe(10);
    }
  });

  it("draws every logo icon whole, inside the tile, in event-art colours only", () => {
    for (const a of SHOWCASE_ASSETS) {
      const svg = logoSvg(a.logo.monogram, a.logo.icon, STYLES[a.logo.style]);
      // DESIGN.md keeps the live red for live moments.
      expect(svg.toUpperCase()).not.toContain("#FF3D2E");
      const boxes = [...svg.matchAll(/<svg[^>]* x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)];
      expect(boxes).toHaveLength(1);
      for (const [, x, y, w, h] of boxes) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeGreaterThanOrEqual(0);
        expect(Number(x) + Number(w)).toBeLessThanOrEqual(512);
        expect(Number(y) + Number(h)).toBeLessThanOrEqual(512);
      }
      // Drawn at full strength, not as a faint fragment.
      expect(svg).not.toMatch(/<svg[^>]* x="[^>]*opacity=/);
    }
  });

  it.each(SHOWCASE_ASSETS.map((a) => [a.name, assetSlug(a.name)]))(
    "%s has a banner and a logo at the stored sizes",
    async (_name, slug) => {
      for (const [kind, folder] of [
        ["banner", "banners"],
        ["logo", "logos"],
      ] as const) {
        const file = path.join(ASSETS, folder, `${slug}.webp`);
        const meta = await sharp(file).metadata();
        expect(meta.format).toBe("webp");
        expect({ width: meta.width, height: meta.height }).toEqual(
          EVENT_IMAGE_SIZE[kind],
        );
        expect(statSync(file).size).toBeLessThanOrEqual(230 * 1024);
      }
    },
  );

  it("credits every banner's photo", () => {
    const credits = readFileSync(path.join(ASSETS, "CREDITS.md"), "utf8");
    for (const a of SHOWCASE_ASSETS) {
      expect(credits).toContain(`| ${a.name} | \`banners/${assetSlug(a.name)}.webp\``);
      expect(credits).toContain(a.banner.page);
    }
  });
});

describe("assetSlug", () => {
  it("lower-cases and joins words with hyphens", () => {
    expect(assetSlug("Bozor E-commerce Hack")).toBe("bozor-e-commerce-hack");
    expect(assetSlug("  Open Hack · live ")).toBe("open-hack-live");
    expect(assetSlug("Café Ünïcode")).toBe("cafe-unicode");
  });
});

describe("showcaseImagePath", () => {
  it("follows the upload pattern, and the same bytes give the same path", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const relative = showcaseImagePath("evt123", "logo", bytes);
    expect(relative).toMatch(/^events\/evt123\/logo-[0-9a-f]{16}\.webp$/);
    expect(showcaseImagePath("evt123", "logo", bytes)).toBe(relative);
    expect(showcaseImagePath("evt123", "logo", new Uint8Array([4]))).not.toBe(
      relative,
    );
    expect(resolveUploadPath("/srv/uploads", relative)).toBe(
      `/srv/uploads/${relative}`,
    );
  });

  it("tells a showcase file from an organizer's upload by its name", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(isShowcaseImagePath(showcaseImagePath("e1", "banner", bytes), bytes)).toBe(true);
    // An upload's name has a random hex (storage.ts).
    expect(isShowcaseImagePath("events/e1/banner-0123456789abcdef.webp", bytes)).toBe(false);
    expect(isShowcaseImagePath("events/e1/banner.webp", bytes)).toBe(false);
  });
});
