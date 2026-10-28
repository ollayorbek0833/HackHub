"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A block that fades and rises in once, as it scrolls into view (the
// `[data-reveal]` rules in globals.css: opacity and translate only, so nothing
// around it moves).
//
// Content is never left hidden:
// - The server renders no data-reveal state, so without JavaScript the block
//   is simply there.
// - With reduced motion, or without IntersectionObserver, nothing is hidden
//   (and the hidden style itself only exists under no-preference).
// - A block already on screen, or above it (a deep link like /#faq), is left
//   alone.
// - The rest reveal on any overlap with the viewport (threshold 0), so even a
//   320×256 viewport reveals each block as it arrives. Unmounting reveals.
// Nothing loops or replays.

const REVEAL_MARGIN = "0px 0px -10% 0px";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;

    el.dataset.reveal = "idle";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        el.dataset.reveal = "done";
      },
      { threshold: 0, rootMargin: REVEAL_MARGIN },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.dataset.reveal = "done";
    };
  }, []);

  return (
    <div ref={ref} data-reveal="" className={className}>
      {children}
    </div>
  );
}
