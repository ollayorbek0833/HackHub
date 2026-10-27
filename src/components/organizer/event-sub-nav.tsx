"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// The sub-navigation shared by the five organizer event pages (docs/08 > App
// shell). Each item is its own URL; the current one is marked with
// aria-current, bold text and an underline, so colour is never the only signal.

const ITEMS = [
  { label: "Overview", segment: "" },
  { label: "Edit", segment: "/edit" },
  { label: "Criteria", segment: "/criteria" },
  { label: "Participants", segment: "/participants" },
  { label: "Ranking", segment: "/ranking" },
] as const;

export function EventSubNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/organizer/events/${eventId}`;

  return (
    <nav aria-label="Event" className="border-b">
      {/* Wraps on phone instead of scrolling sideways. */}
      <ul className="-mb-px flex flex-wrap sm:gap-x-1">
        {ITEMS.map(({ label, segment }) => {
          const href = base + segment;
          // Overview matches only itself; the others also match their sub-pages.
          const isCurrent = segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center border-b-2 px-1.5 text-sm sm:px-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  isCurrent
                    ? "border-highlight font-semibold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
