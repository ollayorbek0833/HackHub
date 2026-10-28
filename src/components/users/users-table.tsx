"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ROLE_LABEL } from "@/components/layout/nav-items";
import {
  DetailPanel,
  FilterChips,
  ListItem,
  ListItems,
  ListRow,
  ListTable,
  matches,
  NoMatches,
  PanelSection,
  PlainHeader,
  RowButton,
  SearchBox,
  SortHeader,
  useSort,
  usePanel,
  useSorted,
} from "@/components/organizer/list-kit";
import { textLink } from "@/components/organizer/stacked-table";
import { RoleButton } from "@/components/users/role-button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import type { Role } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { formatPhone, phoneHref, phoneMatches } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

// /organizer/users (docs/08 > Users and roles; redesign: table + detail
// panel): search, role chips, sortable columns, and a side panel with the
// person's teams and the role change. The role change is the same bound
// server action as before; it checks every rule again.

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  /** Null when not given, and always null when phoneShown is false. */
  phone: string | null;
  /** Registered for one of the signed-in organizer's events. */
  phoneShown: boolean;
  role: Role;
  teams: string[];
  /** Organizers and the current user get no action (docs/08). */
  action: {
    to: "PARTICIPANT" | "JUDGE";
    action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
    disabledReason?: string;
  } | null;
};

type Key = "name" | "email" | "role" | "teams";
type RoleFilter = "all" | Role;

const ROLE_ORDER: Record<Role, number> = {
  ORGANIZER: 0,
  JUDGE: 1,
  PARTICIPANT: 2,
};

export function UsersTable({
  rows,
  initialQuery = "",
  initialRole,
}: {
  rows: UserRow[];
  initialQuery?: string;
  initialRole?: Role;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<RoleFilter>(initialRole ?? "all");
  const [sort, toggleSort] = useSort<Key>({ key: "role", dir: "asc" });
  const panel = usePanel();

  const value = useCallback(
    (row: UserRow, key: Key) =>
      key === "name"
        ? (row.name ?? row.email)
        : key === "email"
          ? row.email
          : key === "role"
            ? ROLE_ORDER[row.role]
            : row.teams.length,
    [],
  );
  const searched = rows.filter(
    (r) => matches(query, r.name, r.email) || phoneMatches(query, r.phone),
  );
  const shown = useSorted(
    searched.filter((r) => role === "all" || r.role === role),
    sort,
    value,
  );
  const open = rows.find((r) => r.id === panel.id) ?? null;
  const count = (r: Role) => searched.filter((u) => u.role === r).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SearchBox
          id="users-search"
          label="Search by name, email or phone"
          value={query}
          onChange={setQuery}
        />
        <FilterChips
          label="Filter by role"
          value={role}
          onChange={setRole}
          options={[
            { value: "all", label: "All", count: searched.length },
            {
              value: "PARTICIPANT",
              label: "Participants",
              count: count("PARTICIPANT"),
            },
            { value: "JUDGE", label: "Judges", count: count("JUDGE") },
            {
              value: "ORGANIZER",
              label: "Organizers",
              count: count("ORGANIZER"),
            },
          ]}
        />
      </div>

      <p className="sr-only" role="status">
        {shown.length === 1 ? "1 user" : `${shown.length} users`}
      </p>

      {shown.length === 0 ? (
        <NoMatches query={query} />
      ) : (
        <>
          <ListTable
            caption="Users"
            head={
              <>
                <SortHeader column="name" sort={sort} onSort={toggleSort}>
                  Name
                </SortHeader>
                <SortHeader column="email" sort={sort} onSort={toggleSort}>
                  Email
                </SortHeader>
                <SortHeader
                  column="role"
                  sort={sort}
                  onSort={toggleSort}
                  className="w-36"
                >
                  Role
                </SortHeader>
                <SortHeader column="teams" sort={sort} onSort={toggleSort}>
                  Teams
                </SortHeader>
                <PlainHeader className="w-44">
                  <span className="sr-only">Role change</span>
                </PlainHeader>
              </>
            }
          >
            {shown.map((row) => {
              const name = row.name ?? row.email;
              return (
                <ListRow
                  key={row.id}
                  onOpen={() => panel.show(row.id)}
                  selected={panel.open && panel.id === row.id}
                >
                  <td className="px-3">
                    <RowButton
                      onOpen={() => panel.show(row.id)}
                      label={`${name}: open details`}
                    >
                      {row.name ?? (
                        <span className="text-muted-foreground">
                          No name yet
                        </span>
                      )}
                    </RowButton>
                  </td>
                  <td className="px-3 break-all text-muted-foreground">
                    {row.email}
                  </td>
                  <td className="px-3">
                    <Badge variant="secondary">{ROLE_LABEL[row.role]}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {row.teams.length ? (
                      row.teams.join(", ")
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  {/* The role button acts on its own; it doesn't open the panel. */}
                  <td
                    className="px-3 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.action && <RoleButton {...row.action} compact />}
                  </td>
                </ListRow>
              );
            })}
          </ListTable>

          <ListItems>
            {shown.map((row) => (
              <ListItem
                key={row.id}
                onOpen={() => panel.show(row.id)}
                title={row.name ?? row.email}
                detail={row.name ? row.email : "No name yet"}
                aside={
                  <Badge variant="secondary">{ROLE_LABEL[row.role]}</Badge>
                }
              />
            ))}
          </ListItems>
        </>
      )}

      <Sheet open={panel.open && !!open} onOpenChange={panel.onOpenChange}>
        {open && <UserPanel row={open} onCloseAutoFocus={panel.restoreFocus} />}
      </Sheet>
    </div>
  );
}

function UserPanel({
  row,
  onCloseAutoFocus,
}: {
  row: UserRow;
  onCloseAutoFocus: (event: Event) => void;
}) {
  return (
    <DetailPanel
      onCloseAutoFocus={onCloseAutoFocus}
      title={row.name ?? row.email}
      description={row.email}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Role</dt>
        <dd>{ROLE_LABEL[row.role]}</dd>
        <dt className="text-muted-foreground">Phone</dt>
        <dd>
          {row.phone ? (
            <a
              href={phoneHref(row.phone)}
              className={cn(
                textLink,
                "inline-flex min-h-11 items-center tabular-nums md:min-h-0",
              )}
            >
              {formatPhone(row.phone)}
            </a>
          ) : row.phoneShown ? (
            "Not given"
          ) : (
            <span className="text-muted-foreground">
              Only shown for your events&apos; participants
            </span>
          )}
        </dd>
      </dl>

      <PanelSection title="Teams">
        {row.teams.length ? (
          <ul className="flex flex-col gap-1 text-sm">
            {row.teams.map((team) => (
              <li key={team}>{team}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not on any team.</p>
        )}
      </PanelSection>

      <PanelSection title="Role">
        {row.action ? (
          <RoleButton {...row.action} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {row.role === "ORGANIZER"
              ? "Organizers keep their role."
              : "You can't change your own role."}
          </p>
        )}
      </PanelSection>

      <Link
        href={`/profile/${row.id}`}
        className={cn(textLink, "inline-flex min-h-11 items-center text-sm")}
      >
        Open the full profile
      </Link>
    </DetailPanel>
  );
}
