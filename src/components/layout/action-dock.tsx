"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// The page's one primary action, thumb-first (redesign plan > Phone). Below md
// it's fixed to the bottom of the screen, above the tab bar and the safe area;
// from md up it's an ordinary inline block where the page puts it.
//
//   <ActionDock><Button className="w-full md:w-auto">Register</Button></ActionDock>
//
// Below md the bar is `position: fixed`, not sticky: a sticky bar resolves
// against its nearest `overflow: hidden` ancestor (shadcn's Card is one), so
// inside a card it floated over the card's own content and never reached the
// screen edge. Fixed works wherever it's placed, and it stays in the DOM where
// the page puts it, so a submit button inside it still submits its <form>.
//
// The bar measures itself into --action-dock-h. globals.css pads the end of
// the page by that much and sets scroll-padding-bottom, so every field (and
// "Add link" / "Add skill") can scroll above the bar, and a focused field never
// hides behind it. One dock per page.

export function ActionDock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const write = () => {
      // 0 when the bar isn't shown (desktop, or a md:hidden dock).
      const fixed = getComputedStyle(el).position === "fixed";
      const height =
        fixed && el.getClientRects().length > 0 ? el.offsetHeight : 0;
      root.style.setProperty("--action-dock-h", `${height}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(el);
    window.addEventListener("resize", write);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", write);
      root.style.removeProperty("--action-dock-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-action-dock
      className={cn(
        // Phone: a full-width bar fixed to the screen, flush above the tab bar.
        "fixed inset-x-0 bottom-[calc(var(--tab-bar-h)+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85",
        "flex flex-col gap-2 *:min-h-11",
        // Desktop: inline, no chrome.
        "md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none md:*:min-h-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
