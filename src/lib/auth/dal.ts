import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

// The only place that turns a session into a user (docs/07 > lib/auth). The
// session supplies the user id; the role always comes from the database, so a
// role change applies on the next request, not the next login (Decision 8).
//
// redirect() throws: never call these inside a try whose catch swallows
// everything.

/** The signed-in user, or null. One indexed query per request. */
export const getCurrentUser = cache(async () => {
  const id = (await auth())?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
});

/** The signed-in user; signed-out visitors go to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** The signed-in user if their current role is one of `roles`; anyone else goes to their role home. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(`${ROLE_HOME[user.role]}?notice=no-access`);
  }
  return user;
}

// Data-dependent guards (docs/07 > lib/auth). They sit next to the role guards
// so every check a page or action makes can be found in one file.

/** The event, or the not-found page for an unknown id. Deduped per render. */
export const requireEvent = cache(async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      maxTeamSize: true,
      registrationOpen: true,
      submissionsOpen: true,
      resultsPublished: true,
      logoPath: true,
      bannerPath: true,
      createdById: true,
    },
  });
  if (!event) notFound();
  return event;
});

/**
 * The signed-in organizer and an event they created. Anyone else's event gets
 * the not-found page, the same as an unknown id, so a URL or a server action
 * bound to another organizer's event id reveals and changes nothing. Every
 * organizer page and action under /organizer/events/[eventId] calls this
 * first. Deduped per render (it reuses requireEvent's read).
 */
export const requireOwnedEvent = cache(async (eventId: string) => {
  const user = await requireRole("ORGANIZER");
  const event = await requireEvent(eventId);
  if (event.createdById !== user.id) notFound();
  return { user, event };
});

/**
 * The signed-in user's team in this event. Anyone without one goes to the
 * event's team page, where they can create or join a team.
 */
export async function requireTeamMember(eventId: string) {
  const user = await requireUser();
  const membership = await prisma.teamMember.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    select: {
      team: {
        select: { id: true, eventId: true, name: true, inviteCode: true },
      },
    },
  });
  if (!membership) redirect(`/events/${eventId}/team`);
  return membership.team;
}
