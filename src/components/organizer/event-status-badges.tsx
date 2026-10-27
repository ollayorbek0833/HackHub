import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Event status badges (docs/08 > Shared components > Status badge). Each badge
// says its state in words; the tint only adds to the label. "Open" uses the
// primary tint, as on the participant pages: docs/08 keeps the success colour
// for Registered, Submitted and Scored (style pass, #26).

type EventFlags = {
  registrationOpen: boolean;
  submissionsOpen: boolean;
  resultsPublished: boolean;
};

function StatusBadge({ on, children }: { on: boolean; children: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(on && "border-primary/50 bg-primary/15 text-foreground")}
    >
      {children}
    </Badge>
  );
}

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
