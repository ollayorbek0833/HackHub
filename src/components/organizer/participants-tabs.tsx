import Link from "next/link";

import { cn } from "@/lib/utils";

// The Participants / Teams switch (docs/08 > Participants and teams). Links
// styled as tabs, so each view has its own URL. The current one is marked with
// aria-current, bold text and a raised background, never colour alone.

export type ParticipantsTab = "participants" | "teams";

export function ParticipantsTabs({
  eventId,
  current,
  counts,
}: {
  eventId: string;
  current: ParticipantsTab;
  counts: { participants: number; teams: number };
}) {
  const base = `/organizer/events/${eventId}/participants`;
  const tabs = [
    {
      id: "participants",
      label: "Participants",
      href: base,
      count: counts.participants,
    },
    { id: "teams", label: "Teams", href: `${base}/teams`, count: counts.teams },
  ] as const;

  return (
    <nav aria-label="Participants and teams">
      <ul className="inline-flex rounded-lg bg-muted p-1">
        {tabs.map(({ id, label, href, count }) => {
          const isCurrent = id === current;
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9",
                  isCurrent
                    ? "bg-background font-semibold text-foreground shadow-sm"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span className="font-mono tabular-nums">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
