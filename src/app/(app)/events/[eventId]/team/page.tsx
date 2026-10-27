import Link from "next/link";
import {
  FileCheckIcon,
  InfoIcon,
  LogInIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { StatusBadge } from "@/components/events/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { CopyCodeButton } from "@/components/teams/copy-code-button";
import { LeaveTeamButton } from "@/components/teams/leave-team-button";
import { CreateTeamForm, JoinTeamForm } from "@/components/teams/team-forms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import { canSubmit } from "@/lib/domain/event-state";
import { isTeamFull } from "@/lib/domain/teams";
import { prisma } from "@/lib/prisma";

import { createTeam, joinTeam, leaveTeam } from "./actions";

// docs/08 > /events/[eventId]/team: create a team, join one with its invite
// code, see the members, leave. Params and the session are read inside
// Suspense (Cache Components).

export default function TeamPage({
  params,
}: PageProps<"/events/[eventId]/team">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
      <Suspense fallback={<TeamSkeleton />}>
        <Team params={params} />
      </Suspense>
    </main>
  );
}

async function Team({
  params,
}: Pick<PageProps<"/events/[eventId]/team">, "params">) {
  const user = await requireRole("PARTICIPANT");
  const { eventId } = await params;
  const event = await requireEvent(eventId);

  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    select: {
      membership: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
              inviteCode: true,
              submission: { select: { id: true } },
              members: {
                orderBy: { joinedAt: "asc" },
                select: {
                  userId: true,
                  user: {
                    select: {
                      profile: { select: { name: true, faculty: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const back = { href: `/events/${event.id}`, label: event.name };

  if (!registration) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader back={back} title="My team" />
        <Alert>
          <InfoIcon aria-hidden />
          <AlertTitle>You&apos;re not registered</AlertTitle>
          <AlertDescription>
            <p>
              Register for this event before joining a team.{" "}
              <Link
                href={`/events/${event.id}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Go to {event.name}
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const team = registration.membership?.team;

  if (!team) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          back={back}
          title="My team"
          description={`You're registered for ${event.name}. Agree on your team with your teammates first: one of you creates it and shares the invite code, the others join with it.`}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Panel
            icon={<PlusIcon aria-hidden />}
            title="Create a team"
            text={`Start a new team for up to ${event.maxTeamSize} people.`}
          >
            <CreateTeamForm action={createTeam.bind(null, event.id)} />
          </Panel>
          <Panel
            icon={<LogInIcon aria-hidden />}
            title="Join with a code"
            text="Got a code from a teammate? Enter it here."
          >
            <JoinTeamForm action={joinTeam.bind(null, event.id)} />
          </Panel>
        </div>
      </div>
    );
  }

  const memberCount = team.members.length;
  const full = isTeamFull(memberCount, event.maxTeamSize);
  const submitted = team.submission !== null;
  const submissionsOpen = canSubmit(event);
  const submitHref = `/events/${event.id}/team/submit`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={team.name}
        description={`Your team in ${event.name}.`}
        action={
          submissionsOpen || submitted ? (
            <Button asChild size="lg" className="h-11 w-full px-6 text-base md:w-auto">
              <Link href={submitHref}>
                <FileCheckIcon aria-hidden />
                {!submitted
                  ? "Submit project"
                  : submissionsOpen
                    ? "Edit submission"
                    : "View submission"}
              </Link>
            </Button>
          ) : undefined
        }
      >
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge on={submitted}>
            {submitted ? "Submitted" : "Not submitted"}
          </StatusBadge>
          {!submitted && !submissionsOpen && (
            <span className="text-sm text-muted-foreground">
              Submissions aren&apos;t open right now.
            </span>
          )}
        </div>
      </PageHeader>

      <section
        aria-labelledby="code-heading"
        className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground"
      >
        <h2 id="code-heading" className="text-sm font-medium text-muted-foreground">
          Invite code
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p
            className="font-mono text-3xl font-semibold tracking-[0.25em] select-all"
            aria-label={`Invite code ${team.inviteCode.split("").join(" ")}`}
          >
            {team.inviteCode}
          </p>
          <CopyCodeButton code={team.inviteCode} />
        </div>
        {full ? (
          <p className="flex items-center gap-2 text-sm font-medium">
            <UsersIcon className="size-4" aria-hidden />
            Your team is full.
          </p>
        ) : submitted ? (
          <p className="text-sm text-muted-foreground">
            Your team has submitted, so nobody else can join.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Share this code with your teammates. They open this page for{" "}
            {event.name} and enter it under &quot;Join with a code&quot;.
          </p>
        )}
      </section>

      <section aria-labelledby="members-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="members-heading" className="text-xl font-semibold">
            Members
          </h2>
          <p className="text-sm text-muted-foreground">
            {memberCount} of {event.maxTeamSize}
          </p>
        </div>
        <ul className="flex flex-col divide-y rounded-xl border bg-card text-card-foreground">
          {team.members.map((member) => {
            const isYou = member.userId === user.id;
            const name = member.user.profile?.name?.trim() || "No name yet";
            return (
              <li key={member.userId}>
                <Link
                  href={`/profile/${member.userId}`}
                  className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium break-words">{name}</span>
                    {member.user.profile?.faculty && (
                      <span className="text-sm text-muted-foreground break-words">
                        {member.user.profile.faculty}
                      </span>
                    )}
                  </span>
                  {isYou && (
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium">
                      You
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="border-t pt-6">
        <LeaveTeamButton
          action={leaveTeam.bind(null, event.id)}
          teamName={team.name}
          isLastMember={memberCount === 1}
          submitted={submitted}
        />
      </div>
    </div>
  );
}

function Panel({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 [&_svg]:size-5">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TeamSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    </div>
  );
}
