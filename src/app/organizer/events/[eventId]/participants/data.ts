import "server-only";

import type { ParticipantTableRow } from "@/components/organizer/participants-table";
import type { TeamTableRow } from "@/components/organizer/teams-table";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

// The reads behind the two tabs of docs/08 > Participants and teams. Each tab
// is one Prisma query that selects only what the tab shows, plus both tab
// counts. Both loaders authorize first, so the pages can't forget to: a
// participant or judge goes to their home with ?notice=no-access, and an
// unknown event id, or another organizer's event, gets the not-found page.

export type TabCounts = { participants: number; teams: number };

/** Names first, falling back to the email (docs/08: organizer views only). */
const byName = (
  a: { name: string | null; email: string },
  b: { name: string | null; email: string },
) =>
  (a.name ?? a.email).localeCompare(b.name ?? b.email, "en", {
    sensitivity: "base",
  });

const counts = {
  _count: { select: { registrations: true, teams: true } },
} as const;

/**
 * Everyone registered for the event, sorted by name. `search` matches the
 * name or email, ignoring case; the tab counts stay the event's totals.
 */
export async function loadParticipants(eventId: string, search: string) {
  const { event } = await requireOwnedEvent(eventId);

  const contains = { contains: search, mode: "insensitive" } as const;
  const { _count, registrations } = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      ...counts,
      registrations: {
        where: search
          ? {
              user: {
                OR: [{ email: contains }, { profile: { name: contains } }],
              },
            }
          : undefined,
        select: {
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              // The side panel shows the profile too (redesign).
              profile: {
                select: {
                  name: true,
                  faculty: true,
                  phone: true,
                  skills: true,
                  bio: true,
                  links: true,
                },
              },
            },
          },
          membership: { select: { team: { select: { name: true } } } },
        },
      },
    },
  });

  const rows: ParticipantTableRow[] = registrations
    .map(({ createdAt, user, membership }) => ({
      userId: user.id,
      name: user.profile?.name ?? null,
      email: user.email,
      faculty: user.profile?.faculty ?? null,
      phone: user.profile?.phone ?? null,
      teamName: membership?.team.name ?? null,
      registeredAt: createdAt,
      skills: user.profile?.skills ?? [],
      bio: user.profile?.bio ?? null,
      links: user.profile?.links ?? [],
    }))
    .sort(byName);

  const tabCounts: TabCounts = {
    participants: _count.registrations,
    teams: _count.teams,
  };
  return { event, counts: tabCounts, rows };
}

/** Every team in the event with its members and submission, sorted by name. */
export async function loadTeams(eventId: string) {
  const { event } = await requireOwnedEvent(eventId);

  const { _count, teams } = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      ...counts,
      teams: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: { select: { name: true } },
                },
              },
            },
          },
          submission: {
            select: {
              title: true,
              description: true,
              repoUrl: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  const rows: TeamTableRow[] = teams
    .map(({ id, name, members, submission }) => ({
      id,
      name,
      members: members
        .map(({ user }) => ({
          userId: user.id,
          name: user.profile?.name ?? null,
          email: user.email,
        }))
        .sort(byName),
      submission: submission && {
        title: submission.title,
        description: submission.description,
        repoUrl: submission.repoUrl,
        submittedAt: submission.updatedAt,
      },
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );

  const tabCounts: TabCounts = {
    participants: _count.registrations,
    teams: _count.teams,
  };
  return { event, counts: tabCounts, rows };
}
