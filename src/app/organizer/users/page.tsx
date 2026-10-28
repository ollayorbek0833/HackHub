import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { UsersTable, type UserRow } from "@/components/users/users-table";
import { requireRole } from "@/lib/auth/dal";
import { nextRole, roleChangeError } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { usersFilterSchema } from "@/lib/validation/roles";

import { setUserRole } from "./actions";

export const metadata: Metadata = { title: "Users" };

// docs/08 > /organizer/users. The organizer layout supplies <main>. The
// session, searchParams and the database are read inside Suspense.
export default function UsersPage({
  searchParams,
}: PageProps<"/organizer/users">) {
  return (
    <>
      <h1 className="text-page-title">Users</h1>
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

async function Users({
  searchParams,
}: Pick<PageProps<"/organizer/users">, "searchParams">) {
  const organizer = await requireRole("ORGANIZER");
  const filter = usersFilterSchema.parse(await searchParams);

  // Every user is loaded; search and the role filter run in the browser.
  // ?q= and ?role= still prefill them.
  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      profile: { select: { name: true, phone: true } },
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: {
          team: { select: { name: true } },
          event: { select: { name: true } },
        },
      },
    },
  });

  const rows: UserRow[] = users.map((user) => {
    const name = user.profile?.name.trim() || null;
    const teamEvents = user.memberships.map((m) => m.event.name);
    const to = nextRole(user.role);
    const self = user.id === organizer.id;
    const blocked =
      to && !self
        ? roleChangeError(
            organizer.id,
            {
              id: user.id,
              role: user.role,
              displayName: name ?? user.email,
              teamEvents,
            },
            to,
          )
        : null;
    return {
      id: user.id,
      name,
      email: user.email,
      phone: user.profile?.phone ?? null,
      role: user.role,
      teams: user.memberships.map((m) => `${m.team.name} (${m.event.name})`),
      // Organizers and the current user get no action at all (docs/08).
      action:
        to && to !== "ORGANIZER" && !self
          ? {
              to,
              action: setUserRole.bind(null, user.id),
              disabledReason: blocked ?? undefined,
            }
          : null,
    };
  });

  return (
    <div className="mt-6">
      <UsersTable
        rows={rows}
        initialQuery={filter.q}
        initialRole={filter.role}
      />
    </div>
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
