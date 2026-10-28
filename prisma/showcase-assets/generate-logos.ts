// Dev only: draws the showcase logos (manifest.ts) as SVG and renders them to
// logos/<slug>.webp (512×512). The outputs are committed, so the production
// migrate image (Alpine, no fonts) never renders anything.
//
//   FONT_DIR=<dir with SpaceGrotesk[wght].ttf> npx tsx prisma/showcase-assets/generate-logos.ts
//
// FONT_DIR is needed when Space Grotesk (the app's font, SIL OFL) isn't
// installed: https://github.com/google/fonts/tree/main/ofl/spacegrotesk
//
// Each logo is a Lucide icon and a 2–3 character monogram on a full-bleed tile
// in the Scoreboard colours (DESIGN.md). The UI rounds the corners. Ten styles
// (colour × layout); each organizer's ten events use all ten.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import * as icons from "lucide-react";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { assetSlug, type LogoIcon, SHOWCASE_ASSETS } from "./manifest";

const SIZE = 512;
const FONT = "Space Grotesk";

// DESIGN.md > Theme: Scoreboard. Only the event-art hues (amber, ember, warm
// gold, deep brown) and the neutral ground, surface and text: the live red is
// reserved for live moments, so no logo uses it.
const C = {
  ground: "#0C0A08",
  surface: "#19150F",
  text: "#FFF4E0",
  amber: "#FFA41B",
  onAmber: "#1A0E00",
  ember: "#FF6A1F",
  gold: "#E8B44A",
  brown: "#5A3A1C",
} as const;

/**
 * Where the icon and monogram sit. The whole icon is always inside the tile
 * and clear of the letters, so it still reads as an icon at 24–40 px.
 */
type Layout = "stack" | "badge" | "split" | "ring";
type Style = {
  /** SVG paint servers for the tile, drawn in order. */
  background: string;
  icon: string;
  text: string;
  layout: Layout;
  /** badge: the disc behind the icon. ring: the circle's stroke. */
  disc?: string;
};

const linear = (id: string, from: string, to: string, x2 = 1, y2 = 1) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#${id})"/>`;
const glow = (id: string, color: string, cx: number, cy: number, opacity: number) =>
  `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.75"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#${id})"/>`;

export const STYLES: Style[] = [
  // 0 amber tile, dark mark (like the app icon)
  { background: linear("g", C.amber, C.gold) + glow("h", "#FFFFFF", 0.2, 0.1, 0.22), icon: C.onAmber, text: C.onAmber, layout: "stack" },
  // 1 dark ground, amber icon
  { background: linear("g", C.surface, C.ground) + glow("h", C.amber, 0.5, 0.25, 0.16), icon: C.amber, text: C.text, layout: "stack" },
  // 2 ember to amber, dark disc
  { background: linear("g", C.ember, C.amber, 1, 0.6), icon: C.amber, text: C.onAmber, layout: "badge", disc: C.onAmber },
  // 3 deep brown, gold icon top right
  { background: linear("g", C.brown, "#24160A"), icon: C.gold, text: C.text, layout: "split" },
  // 4 cream tile, ember icon
  { background: linear("g", C.text, "#F1DCB6"), icon: C.ember, text: C.brown, layout: "stack" },
  // 5 warm gold, icon top right
  { background: linear("g", C.gold, C.amber, 0.4, 1), icon: C.onAmber, text: C.onAmber, layout: "split" },
  // 6 dark ground with an ember glow, ember disc
  { background: linear("g", C.surface, C.ground) + glow("h", C.ember, 0.95, 0.95, 0.45), icon: C.onAmber, text: C.text, layout: "badge", disc: C.ember },
  // 7 ember fading down into deep brown, dark ring
  { background: linear("g", C.ember, "#3B220E", 0, 1), icon: C.onAmber, text: C.text, layout: "ring", disc: C.onAmber },
  // 8 dark ground, amber ring and amber monogram
  { background: linear("g", C.ground, C.surface, 0, 1) + glow("h", C.amber, 0.5, 0.3, 0.12), icon: C.amber, text: C.amber, layout: "ring", disc: C.amber },
  // 9 brown, amber disc, gold monogram
  { background: linear("g", "#4A2F16", "#2B1A0B") + glow("h", C.gold, 0.15, 0.1, 0.18), icon: C.onAmber, text: C.gold, layout: "badge", disc: C.amber },
];

/** A Lucide icon as an <svg> placed at x, y and drawn size × size. */
function icon(name: LogoIcon, x: number, y: number, size: number, color: string) {
  const Icon = (icons as unknown as Record<string, ComponentType<Record<string, unknown>>>)[name];
  if (!Icon) throw new Error(`lucide-react has no icon "${name}"`);
  // A touch heavier than Lucide's 2, so the marks hold up at small sizes.
  const markup = renderToStaticMarkup(createElement(Icon, { size: 24, color, strokeWidth: 2.1 }));
  return markup.replace(
    /^<svg([^>]*?) width="24" height="24"/,
    `<svg$1 x="${x}" y="${y}" width="${size}" height="${size}"`,
  );
}

function text(value: string, x: number, baseline: number, size: number, color: string, anchor: "start" | "middle") {
  return `<text x="${x}" y="${baseline}" font-family="${FONT}" font-weight="700" font-size="${size}" letter-spacing="${-0.03 * size}" fill="${color}" text-anchor="${anchor}">${value}</text>`;
}

export function logoSvg(monogram: string, iconName: LogoIcon, style: Style): string {
  const long = monogram.length > 2;
  let body: string;
  switch (style.layout) {
    case "stack": {
      const s = 190;
      body = icon(iconName, (SIZE - s) / 2, 68, s, style.icon) + text(monogram, SIZE / 2, 440, long ? 124 : 150, style.text, "middle");
      break;
    }
    case "badge": {
      body =
        `<circle cx="140" cy="140" r="84" fill="${style.disc}"/>` +
        icon(iconName, 90, 90, 100, style.icon) +
        text(monogram, 50, 450, long ? 158 : 206, style.text, "start");
      break;
    }
    case "ring": {
      body =
        `<circle cx="256" cy="168" r="104" fill="none" stroke="${style.disc}" stroke-width="13"/>` +
        icon(iconName, 196, 108, 120, style.icon) +
        text(monogram, SIZE / 2, 448, long ? 120 : 140, style.text, "middle");
      break;
    }
    case "split": {
      body = icon(iconName, 290, 50, 172, style.icon) + text(monogram, 48, 456, long ? 150 : 196, style.text, "start");
      break;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${style.background}${body}</svg>`;
}

/** Points fontconfig at FONT_DIR (before sharp renders any text) and checks the font is found. */
async function selectFont() {
  const dir = process.env.FONT_DIR;
  if (dir) {
    const conf = path.join(await mkdtemp(path.join(tmpdir(), "hackhub-fonts-")), "fonts.conf");
    await writeFile(
      conf,
      `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${path.resolve(dir)}</dir></fontconfig>`,
    );
    process.env.FONTCONFIG_FILE = conf;
  }
  const match = execFileSync("fc-match", [`${FONT}:bold`, "family"], { encoding: "utf8" });
  if (!match.includes(FONT)) {
    throw new Error(`${FONT} isn't installed (fc-match gave "${match.trim()}"). Set FONT_DIR to a folder with its TTF.`);
  }
}

async function main() {
  await selectFont();
  // Loaded after FONTCONFIG_FILE is set.
  const { default: sharp } = await import("sharp");
  const out = path.join(__dirname, "logos");
  await mkdir(out, { recursive: true });
  for (const asset of SHOWCASE_ASSETS) {
    const { monogram, icon: iconName, style } = asset.logo;
    const svg = logoSvg(monogram, iconName, STYLES[style]);
    const webp = await sharp(Buffer.from(svg)).webp({ quality: 92, effort: 6 }).toBuffer();
    const slug = assetSlug(asset.name);
    await writeFile(path.join(out, `${slug}.webp`), webp);
    console.log(`${slug.padEnd(32)} style ${style} ${Math.round(webp.length / 1024)} KB`);
  }
}

// Only when run as a script: the unit tests import STYLES and logoSvg.
if (typeof require !== "undefined" && require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
