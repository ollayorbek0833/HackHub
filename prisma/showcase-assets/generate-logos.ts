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

// DESIGN.md > Theme: Scoreboard.
const C = {
  ground: "#0C0A08",
  surface: "#19150F",
  text: "#FFF4E0",
  amber: "#FFA41B",
  onAmber: "#1A0E00",
  live: "#FF3D2E",
  accent: "#3A1A12",
  ember: "#FF6A1F",
  gold: "#E8B44A",
  brown: "#5A3A1C",
} as const;

type Layout = "stack" | "badge" | "watermark" | "split";
type Style = {
  /** SVG paint servers for the tile, drawn in order. */
  background: string;
  icon: string;
  text: string;
  layout: Layout;
  /** badge: the disc behind the icon. */
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
  // 3 deep brown, gold watermark
  { background: linear("g", C.brown, "#24160A"), icon: C.gold, text: C.text, layout: "watermark" },
  // 4 cream tile, ember icon
  { background: linear("g", C.text, "#F1DCB6"), icon: C.ember, text: C.brown, layout: "stack" },
  // 5 warm gold, icon top right
  { background: linear("g", C.gold, C.amber, 0.4, 1), icon: C.onAmber, text: C.onAmber, layout: "split" },
  // 6 dark ground with an ember glow, ember disc
  { background: linear("g", C.surface, C.ground) + glow("h", C.ember, 0.95, 0.95, 0.45), icon: C.onAmber, text: C.text, layout: "badge", disc: C.ember },
  // 7 low-strength accent, live red icon
  { background: linear("g", C.accent, "#170A06") + glow("h", C.live, 0.85, 0.1, 0.28), icon: C.live, text: C.text, layout: "split" },
  // 8 dark ground, amber monogram over an amber watermark
  { background: linear("g", C.ground, C.surface, 0, 1), icon: C.amber, text: C.amber, layout: "watermark" },
  // 9 brown, amber disc, gold monogram
  { background: linear("g", "#4A2F16", "#2B1A0B") + glow("h", C.gold, 0.15, 0.1, 0.18), icon: C.onAmber, text: C.gold, layout: "badge", disc: C.amber },
];

/** A Lucide icon as an <svg> placed at x, y and drawn size × size. */
function icon(name: LogoIcon, x: number, y: number, size: number, color: string, opacity = 1) {
  const Icon = (icons as unknown as Record<string, ComponentType<Record<string, unknown>>>)[name];
  if (!Icon) throw new Error(`lucide-react has no icon "${name}"`);
  // Thinner strokes on big watermarks, a touch heavier on small marks.
  const strokeWidth = size > 300 ? 1.5 : 2.1;
  const markup = renderToStaticMarkup(createElement(Icon, { size: 24, color, strokeWidth }));
  return markup.replace(
    /^<svg([^>]*?) width="24" height="24"/,
    `<svg$1 x="${x}" y="${y}" width="${size}" height="${size}" opacity="${opacity}"`,
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
    case "watermark": {
      const size = long ? 168 : 216;
      // Mostly off the bottom-right edge, so it frames the monogram rather than crossing it.
      body = icon(iconName, 230, 230, 440, style.icon, 0.16) + text(monogram, SIZE / 2, SIZE / 2 + size * 0.36, size, style.text, "middle");
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
