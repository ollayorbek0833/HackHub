import { CheckIcon, CircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Status badges (docs/08 > Shared components > Status badge). Every badge says
// its state in words; colour and the icon only add to the label. The success
// colour is kept for "done" item states (Registered, Submitted, Scored); an
// event switch that is open gets the primary tint and a dot instead.

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

/** An event state: "open" is tinted with a dot, "closed" is a plain outline. */
function EventBadge({ open, children }: { open: boolean; children: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(open && "border-primary/50 bg-primary/15 text-foreground")}
    >
      {open && (
        <CircleIcon
          aria-hidden
          data-icon="inline-start"
          className="fill-current text-ring"
        />
      )}
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
        <EventBadge open={event.registrationOpen}>
          {event.registrationOpen ? "Registration open" : "Registration closed"}
        </EventBadge>
      </li>
      <li>
        <EventBadge open={event.submissionsOpen}>
          {event.submissionsOpen ? "Submissions open" : "Submissions closed"}
        </EventBadge>
      </li>
      {event.resultsPublished && (
        <li>
          <EventBadge open>Results published</EventBadge>
        </li>
      )}
    </ul>
  );
}
