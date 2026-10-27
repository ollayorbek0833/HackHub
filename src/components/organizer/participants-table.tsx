import Link from "next/link";

import { formatTashkentDate } from "@/components/organizer/participants-format";
import { stacked, textLink } from "@/components/organizer/stacked-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// The Participants tab (docs/08 > Participants and teams): name (links to the
// profile), email, faculty, team or "No team", and the registration date.

export type ParticipantTableRow = {
  userId: string;
  name: string | null;
  email: string;
  faculty: string | null;
  teamName: string | null;
  registeredAt: Date;
};

export function ParticipantsTable({ rows }: { rows: ParticipantTableRow[] }) {
  return (
    <Table className={stacked.table}>
      <TableHeader className={stacked.header}>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Faculty</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Registered on</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={stacked.body}>
        {rows.map((row) => (
          <TableRow key={row.userId} className={stacked.row}>
            <TableCell className={stacked.keyCell}>
              {/* Organizer views fall back to the email (docs/08 > Names). */}
              <Link
                href={`/profile/${row.userId}`}
                className={cn(
                  textLink,
                  "inline-flex min-h-11 items-center font-semibold break-all md:min-h-0 md:font-medium",
                )}
              >
                {row.name ?? row.email}
              </Link>
            </TableCell>
            <TableCell className={stacked.cell}>
              <span className={stacked.label}>Email</span>
              <span className="break-all">{row.email}</span>
            </TableCell>
            <TableCell className={stacked.cell}>
              <span className={stacked.label}>Faculty</span>
              {row.faculty ?? (
                <span className="text-muted-foreground">Not given</span>
              )}
            </TableCell>
            <TableCell className={stacked.cell}>
              <span className={stacked.label}>Team</span>
              {row.teamName ?? (
                <span className="text-muted-foreground">No team</span>
              )}
            </TableCell>
            <TableCell className={cn(stacked.cell, "md:whitespace-nowrap")}>
              <span className={stacked.label}>Registered on</span>
              {formatTashkentDate(row.registeredAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
