import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import {
  formatTashkentDate,
  isWebUrl,
} from "@/components/organizer/participants-format";
import { stacked, textLink } from "@/components/organizer/stacked-table";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// The Teams tab (docs/08 > Participants and teams): team name, members,
// "{n} of {max}", and "Submitted {date}" / "Not submitted". docs/08 says
// opening a team shows its submission read-only but names no page for it, so
// the submission's title, repository link and description sit in the row.

export type TeamTableRow = {
  id: string;
  name: string;
  members: { userId: string; name: string | null; email: string }[];
  submission: {
    title: string;
    description: string;
    repoUrl: string;
    /** When the version shown was submitted: the last edit, or the first submit. */
    submittedAt: Date;
  } | null;
};

export function TeamsTable({
  rows,
  maxTeamSize,
}: {
  rows: TeamTableRow[];
  maxTeamSize: number;
}) {
  return (
    <Table className={stacked.table}>
      <TableHeader className={stacked.header}>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Submission</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={stacked.body}>
        {rows.map((team) => (
          <TableRow key={team.id} className={stacked.row}>
            <TableCell
              className={cn(
                stacked.keyCell,
                "text-base font-semibold md:text-sm",
              )}
            >
              <span className="break-words">{team.name}</span>
            </TableCell>
            <TableCell className={stacked.cell}>
              <span className={stacked.label}>Members</span>
              <ul className="flex flex-col">
                {team.members.map((member) => (
                  <li key={member.userId}>
                    <Link
                      href={`/profile/${member.userId}`}
                      className={cn(
                        textLink,
                        "inline-flex min-h-11 items-center break-all md:min-h-0",
                      )}
                    >
                      {member.name ?? member.email}
                    </Link>
                  </li>
                ))}
              </ul>
            </TableCell>
            <TableCell className={cn(stacked.cell, "md:whitespace-nowrap")}>
              <span className={stacked.label}>Size</span>
              {team.members.length} of {maxTeamSize}
            </TableCell>
            <TableCell className={stacked.cell}>
              <span className={stacked.label}>Submission</span>
              <Submission submission={team.submission} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Submission({
  submission,
}: {
  submission: TeamTableRow["submission"];
}) {
  if (!submission) {
    return <Badge variant="outline">Not submitted</Badge>;
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 md:max-w-xs">
      <Badge className="bg-success text-success-foreground">
        Submitted {formatTashkentDate(submission.submittedAt)}
      </Badge>
      <p className="font-medium break-words">{submission.title}</p>
      {isWebUrl(submission.repoUrl) ? (
        <a
          href={submission.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            textLink,
            "inline-flex min-h-11 items-center gap-1 break-all md:min-h-0",
          )}
        >
          Repository
          <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <span className="break-all text-muted-foreground">
          {submission.repoUrl}
        </span>
      )}
      <details className="group w-full">
        <summary
          className={cn(
            textLink,
            "inline-flex min-h-11 cursor-pointer items-center md:min-h-0",
          )}
        >
          <span className="group-open:hidden">Show description</span>
          <span className="hidden group-open:inline">Hide description</span>
        </summary>
        <p className="mt-1.5 whitespace-pre-line break-words text-muted-foreground">
          {submission.description}
        </p>
      </details>
    </div>
  );
}
