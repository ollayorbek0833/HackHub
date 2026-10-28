"use client";

import { useEffect, useState } from "react";

import { PAGE_SECTIONS, pickActiveSection } from "./nav-items";

// The band a section has to cross to be the current one: from just under the
// sticky header (h-16, 64 px) to halfway down the viewport. It starts 8 px
// below the header so that after a jump (the section's top lands on the header
// line, scroll-margin) the section above, which now ends on that line, no
// longer counts.
const HEADER_PX = 64;
const BAND_MARGIN = `-${HEADER_PX + 8}px 0px -50% 0px`;

/**
 * Scrollspy for the landing page's section links: the id of the PAGE_SECTIONS
 * entry being read, or null (in the hero, in a section with no link, when
 * `enabled` is false, or without IntersectionObserver, where the links simply
 * work as links).
 */
export function useActiveSection(enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;

    const crossing = new Set<string>();
    const observed = new Map<string, Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const { id } = entry.target;
          if (observed.get(id) !== entry.target) continue;
          if (entry.isIntersecting) crossing.add(id);
          else crossing.delete(id);
        }
        setActive(pickActiveSection(crossing));
      },
      { rootMargin: BAND_MARGIN, threshold: 0 },
    );

    // (Re)observe each section. Streaming replaces a Suspense fallback with
    // the real section (Happening now), so the element behind an id can change.
    const sync = () => {
      for (const { id } of PAGE_SECTIONS) {
        const el = document.getElementById(id);
        const prev = observed.get(id);
        if (el === prev) continue;
        if (prev) {
          observer.unobserve(prev);
          crossing.delete(id);
          observed.delete(id);
        }
        if (el) {
          observed.set(id, el);
          observer.observe(el);
        }
      }
    };
    sync();
    const mutations = new MutationObserver(sync);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [enabled]);

  return enabled ? active : null;
}

/**
 * Scrolls to a landing section after a menu has closed, as a click on its
 * `#id` link would: the URL hash updates (a history entry), the scroll is
 * smooth only when motion is allowed (CSS scroll-behavior), and the next Tab
 * starts from the section.
 */
export function jumpToSection(id: string) {
  const el = document.getElementById(id);
  if (el && window.location.hash === `#${id}`) {
    // Already the hash: setting it again wouldn't scroll.
    el.scrollIntoView({ block: "start" });
    return;
  }
  window.location.hash = id;
}
