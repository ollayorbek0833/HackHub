"use client";

import { useEffect } from "react";

// Two scroll helpers for the page that renders them (the landing page).

/**
 * Smooth in-page scrolling, through html[data-smooth-anchors] in globals.css,
 * motion-safe only. Scoped to this page, so focus scrolling elsewhere (forms
 * above the phone's ActionDock) stays instant.
 *
 * It turns on at the visitor's first press of a pointer or key, i.e. before
 * the click on a section link, not at load: a deep link like /#faq scrolls
 * while the page is still streaming in (Happening now swaps its skeleton for
 * the real cards), and a smooth scroll aims at where the section was when it
 * started, so it stops short or overshoots. The load-time jump stays instant
 * and lands; clicks glide.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const root = document.documentElement;
    const enable = () => {
      root.dataset.smoothAnchors = "";
      stop();
    };
    const stop = () => {
      window.removeEventListener("pointerdown", enable, true);
      window.removeEventListener("keydown", enable, true);
    };
    window.addEventListener("pointerdown", enable, true);
    window.addEventListener("keydown", enable, true);
    return () => {
      stop();
      delete root.dataset.smoothAnchors;
    };
  }, []);
  return null;
}

const INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** Fired by jumpToSection (the phone menu), which may not change the hash. */
export const SECTION_JUMP_EVENT = "landing:section-jump";

// How long a jump is kept in place. The streamed parts of the page arrive well
// within this; after it, the visitor may be scrolling in ways we can't see
// (dragging the scrollbar).
const HOLD_MS = 10_000;

/**
 * Keeps the section a visitor jumped to under the header while the page is
 * still settling. A jump is a deep link at load (/#faq), a click on an in-page
 * anchor, or a pick in the phone menu.
 *
 * - The browser's own jump at load can miss: if it looked for the section
 *   before the page was tall enough, it gives up and the page stays at the
 *   top. Once the page has loaded, land it.
 * - Streamed content above the section (Happening now's events replacing its
 *   skeleton) changes the page's height. Scroll anchoring hides that in some
 *   browsers, but not during a smooth scroll, and not at all in others. So
 *   whenever <main> changes size, land the section again.
 *
 * Only until the visitor presses a key or pointer, turns a wheel or touches
 * the screen (they're moving on their own), and for at most HOLD_MS. Each
 * landing is instant, so reduced motion is respected and a glide still in
 * flight just finishes on the spot.
 */
export function LandOnHash() {
  useEffect(() => {
    let target: string | null = null;
    let expires = 0;

    const hold = (id: string) => {
      const el = document.getElementById(id);
      if (!el || !el.closest("main")) return;
      target = id;
      expires = Date.now() + HOLD_MS;
    };
    const release = () => {
      target = null;
    };

    const land = () => {
      if (!target || Date.now() > expires) return;
      const el = document.getElementById(target);
      if (!el) return;
      const want = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      if (Math.abs(el.getBoundingClientRect().top - want) <= 2) return;
      el.scrollIntoView({ block: "start", behavior: "instant" });
    };

    const hashId = () => decodeURIComponent(window.location.hash.slice(1));

    // A click on a same-page "#id" link (after its pointerdown released).
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.pathname !== window.location.pathname || url.hash.length < 2)
        return;
      hold(decodeURIComponent(url.hash.slice(1)));
    };
    const onHashChange = () => hold(hashId());
    const onJump = (event: Event) => hold((event as CustomEvent<string>).detail);

    for (const type of INTERACTIONS)
      window.addEventListener(type, release, { capture: true, passive: true });
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener(SECTION_JUMP_EVENT, onJump);

    if (window.location.hash.length > 1) hold(hashId());
    if (document.readyState === "complete") land();
    else window.addEventListener("load", land, { once: true });

    const main = document.querySelector("main");
    const resizes = new ResizeObserver(() => land());
    if (main) resizes.observe(main);

    return () => {
      resizes.disconnect();
      window.removeEventListener("load", land);
      for (const type of INTERACTIONS)
        window.removeEventListener(type, release, { capture: true });
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener(SECTION_JUMP_EVENT, onJump);
    };
  }, []);
  return null;
}
