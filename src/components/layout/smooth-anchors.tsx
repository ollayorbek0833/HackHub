"use client";

import { useEffect } from "react";

// Smooth in-page scrolling for the page that renders this (the landing page),
// through html[data-smooth-anchors] in globals.css, motion-safe only. Scoped
// to that page, so focus scrolling elsewhere (forms above the phone's
// ActionDock) stays instant.
//
// It turns on at the visitor's first press of a pointer or key, i.e. before
// the click on a section link, not at load: a deep link like /#faq scrolls
// while the page is still streaming in (Happening now swaps its skeleton for
// the real cards), and a smooth scroll aims at where the section was when it
// started, so it stops short or overshoots. The load-time jump stays instant
// and lands; clicks glide.
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
