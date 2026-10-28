"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Plays a section's entrance once, the first time it scrolls into view. The
// server renders data-draw="done" (the final state), so the content is all
// there without JavaScript. After hydration, if motion is allowed and the
// element is still below the fold, it switches to "idle"; children style that
// state with `group-data-[draw=idle]:…` plus a motion-safe transition, and it
// goes back to "done" once it's on screen. Nothing loops or replays.

export function DrawIn({
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen when the page loads: leave it drawn.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.85) return;

    el.dataset.draw = "idle";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        el.dataset.draw = "done";
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.dataset.draw = "done";
    };
  }, []);

  return (
    <div ref={ref} data-draw="done" className={cn("group/draw", className)}>
      {children}
    </div>
  );
}
