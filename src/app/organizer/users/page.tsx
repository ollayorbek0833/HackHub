import type { Metadata } from "next";
import { SearchIcon } from "lucide-react";
import { Suspense } from "react";

import { ROLE_LABEL } from "@/components/layout/nav-items";
import { RoleButton } from "@/components/users/role-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/dal";
import { nextRole, roleChangeError } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { usersFilterSchema } from "@/lib/validation/roles";

import { setUserRole } from "./actions";

export const metadata: Metadata = { title: "Users · HackHub" };

// docs/08 > /organizer/users. The organizer layout supplies <main>. The
// session, searchParams and the database are read inside Suspense.
export default function UsersPage({ searchParams }: PageProps<"/organizer/users">) {
  return (
    <>
      <h1 className="text-3xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Make a participant a judge, or a judge a participant again. The change
        applies right away, without logging in again.
      </p>
      <Suspense fallback={<UsersSkeleton />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/organizer/users">, "searchParams">) {
  const organizer = await requireRole("ORGANIZER");
  const filter = usersFilterSchema.parse(await searchParams);

  const where: Prisma.UserWhereInput = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.q
      ? {
          OR: [
            { email: { contains: filter.q, mode: "insensitive" } },
            { profile: { is: { name: { contains: filter.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "desc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      profile: { select: { name: true } },
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: { team: { select: { name: true } }, event: { select: { name: true } } },
      },
    },
  });

  const rows = users.map((user) => {
    const name = user.profile?.name.trim() || null;
    const teamEvents = user.memberships.map((m) => m.event.name);
    const to = nextRole(user.role);
    const self = user.id === organizer.id;
    const blocked =
      to && !self
        ? roleChangeError(
            organizer.id,
            { id: user.id, role: user.role, displayName: name ?? user.email, teamEvents },
            to,
          )
        : null;
    return {
      id: user.id,
      name,
      email: user.email,
      role: user.role,
      teams: user.memberships.map((m) => `${m.team.name} (${m.event.name})`),
      // Organizers and the current user get no action at all (docs/08).
      action:
        to && to !== "ORGANIZER" && !self
          ? { to, action: setUserRole.bind(null, user.id), disabledReason: blocked ?? undefined }
          : null,
    };
  });

  return (
    <>
      <form
        role="search"
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        action="/organizer/users"
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="q">Search by name or email</Label>
          <Input id="q" name="q" type="search" defaultValue={filter.q} className="h-11 md:h-9" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role</Label>
          {/* A native select works without JavaScript and submits with the form. */}
          <select
            id="role"
            name="role"
            defaultValue={filter.role ?? ""}
            className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
          >
            <option value="">All roles</option>
            <option value="PARTICIPANT">Participants</option>
            <option value="JUDGE">Judges</option>
            <option value="ORGANIZER">Organizers</option>
          </select>
        </div>
        <Button type="submit" className="h-11 md:h-9">
          <SearchIcon aria-hidden />
          Search
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {rows.length === 1 ? "1 user" : `${rows.length} users`}
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {filter.q ? `No users match '${filter.q}'.` : "No users have this role."}
        </p>
      ) : (
        <>
          {/* Phone: one stacked item per user, name first. */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border bg-card p-4 text-card-foreground">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium break-words">
                    {row.name ?? <span className="text-muted-foreground">No name yet</span>}
                  </p>
                  <Badge variant="secondary">{ROLE_LABEL[row.role]}</Badge>
                </div>
                <p className="mt-1 text-sm break-all text-muted-foreground">{row.email}</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Teams: </span>
                  {row.teams.length ? row.teams.join(", ") : "None"}
                </p>
                {row.action && (
                  <div className="mt-3">
                    <RoleButton {...row.action} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium whitespace-normal">
                      {row.name ?? <span className="text-muted-foreground">No name yet</span>}
                    </TableCell>
                    <TableCell className="whitespace-normal break-all">{row.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABEL[row.role]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {row.teams.length ? row.teams.join(", ") : "None"}
                    </TableCell>
                    <TableCell className="align-top">
                      {row.action && <RoleButton {...row.action} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}

function UsersSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}
