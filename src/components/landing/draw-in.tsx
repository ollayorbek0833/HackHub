"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Plays an entrance once per item, as each item scrolls into view. Mark the
// items with `data-draw-item`; they style their hidden state with
// `data-[draw=idle]:…` (or `group-data-[draw=idle]/<name>:…` inside) plus a
// motion-safe transition.
//
// Content is never left hidden:
// - The server renders no data-draw at all, so without JavaScript every item
//   is simply there.
// - With reduced motion, or without IntersectionObserver, nothing is hidden.
// - Items already on screen at load are left alone.
// - The others reveal on any overlap with the viewport (threshold 0), so even
//   a very short viewport (320×256, the 400% zoom reflow case) reveals each
//   one as it arrives. Unmounting reveals whatever is left.
// Nothing loops or replays.

const REVEAL_MARGIN = "0px 0px -10% 0px";

export function DrawIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-draw-item]"),
    ).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    if (items.length === 0) return;

    for (const el of items) el.dataset.draw = "idle";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          el.dataset.draw = "done";
        }
      },
      { threshold: 0, rootMargin: REVEAL_MARGIN },
    );
    for (const el of items) observer.observe(el);
    return () => {
      observer.disconnect();
      for (const el of items) el.dataset.draw = "done";
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
