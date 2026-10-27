import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Status badges (docs/08 > Shared components > Status badge). Every badge says
// its state in words; colour and the check icon only add to the label.

export function StatusBadge({
  on,
  children,
  className,
}: {
  /** A "done" or "open" state: success colour and a check icon. */
  on: boolean;
  children: string;
  className?: string;
}) {
  return (
    <Badge
      variant={on ? "default" : "outline"}
      className={cn(on && "bg-success text-success-foreground", className)}
    >
      {on && <CheckIcon aria-hidden data-icon="inline-start" />}
      {children}
    </Badge>
  );
}

type EventFlags = {
  registrationOpen: boolean;
  submissionsOpen: boolean;
  resultsPublished: boolean;
};

/** "Registration open/closed", "Submissions open/closed", "Results published". */
export function EventStatusBadges({
  event,
  className,
}: {
  event: EventFlags;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Status">
      <li>
        <StatusBadge on={event.registrationOpen}>
          {event.registrationOpen ? "Registration open" : "Registration closed"}
        </StatusBadge>
      </li>
      <li>
        <StatusBadge on={event.submissionsOpen}>
          {event.submissionsOpen ? "Submissions open" : "Submissions closed"}
        </StatusBadge>
      </li>
      {event.resultsPublished && (
        <li>
          <StatusBadge on>Results published</StatusBadge>
        </li>
      )}
    </ul>
  );
}
