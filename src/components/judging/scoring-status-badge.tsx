import { CheckIcon, CircleDashedIcon, CircleDotIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SCORING_STATUS_LABEL, type ScoringStatus } from "@/lib/domain/scoring";

const ICON = { NOT_STARTED: CircleDashedIcon, IN_PROGRESS: CircleDotIcon, SCORED: CheckIcon };

/** "Not started" / "In progress" / "Scored": text and an icon, never colour alone. */
export function ScoringStatusBadge({ status }: { status: ScoringStatus }) {
  const Icon = ICON[status];
  return (
    <Badge
      variant={status === "IN_PROGRESS" ? "secondary" : "outline"}
      // "Scored" uses the style guide's success role (globals.css).
      className={status === "SCORED" ? "gap-1 border-transparent bg-success text-success-foreground" : "gap-1"}
    >
      <Icon aria-hidden />
      {SCORING_STATUS_LABEL[status]}
    </Badge>
  );
}
