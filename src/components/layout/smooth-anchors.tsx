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

/**
 * A deep link (/#faq) that the browser's own jump missed: if the browser
 * looked for the section before the page was tall enough, it gives up and the
 * page stays at the top. Once the page has loaded, if the hash names an
 * element in <main> that isn't in view, and the visitor hasn't started moving
 * around, jump there once. The jump is instant (smooth scrolling isn't on yet,
 * see SmoothAnchors), so reduced motion is respected.
 */
export function LandOnHash() {
  useEffect(() => {
    let interacted = false;
    const mark = () => {
      interacted = true;
    };
    for (const type of INTERACTIONS)
      window.addEventListener(type, mark, { capture: true, passive: true });

    const land = () => {
      if (interacted || window.location.hash.length < 2) return;
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = document.getElementById(id);
      if (!el || !el.closest("main")) return;
      const { top } = el.getBoundingClientRect();
      if (top >= 0 && top <= window.innerHeight / 2) return;
      el.scrollIntoView({ block: "start" });
    };
    if (document.readyState === "complete") land();
    else window.addEventListener("load", land, { once: true });

    return () => {
      window.removeEventListener("load", land);
      for (const type of INTERACTIONS)
        window.removeEventListener(type, mark, { capture: true });
    };
  }, []);
  return null;
}
