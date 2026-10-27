import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDaysIcon,
  CircleCheckIcon,
  InfoIcon,
  LockIcon,
  UsersIcon,
} from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { formatEventDates, plural } from "@/components/events/event-format";
import { RegisterForm } from "@/components/events/register-form";
import { EventStatusBadges } from "@/components/events/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { PublishedRanking } from "@/components/ranking/published-ranking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/dal";
import { isProfileComplete, REGISTRATION_CLOSED } from "@/lib/domain/registration";
import { prisma } from "@/lib/prisma";

import { registerForEvent } from "./actions";

// docs/08 > /events/[eventId]. Everyone can open it by link; the primary
// action depends on who is looking (the table of situations in docs/08).
// Params and the session are read inside Suspense (Cache Components).

export default function EventPage({ params }: PageProps<"/events/[eventId]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
      <Suspense fallback={<EventSkeleton />}>
        <EventDetails params={params} />
      </Suspense>
    </main>
  );
}

async function EventDetails({
  params,
}: Pick<PageProps<"/events/[eventId]">, "params">) {
  const { eventId } = await params;
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        maxTeamSize: true,
        registrationOpen: true,
        submissionsOpen: true,
        resultsPublished: true,
        _count: { select: { registrations: true } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!event) notFound();

  // What the participant needs for the primary action and the ranking row.
  let participant: {
    registered: boolean;
    profileComplete: boolean;
    teamId: string | null;
  } | null = null;
  if (user?.role === "PARTICIPANT") {
    const [registration, profile] = await Promise.all([
      prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: user.id } },
        select: { membership: { select: { teamId: true } } },
      }),
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { name: true, faculty: true },
      }),
    ]);
    participant = {
      registered: registration !== null,
      profileComplete: isProfileComplete(profile),
      teamId: registration?.membership?.teamId ?? null,
    };
  }

  const action = primaryAction({ event, role: user?.role ?? null, participant });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{ href: "/events", label: "All events" }}
        title={event.name}
        action={action}
      >
        <EventStatusBadges event={event} className="mt-1" />
      </PageHeader>

      <dl className="grid gap-3 rounded-xl border bg-card p-5 text-card-foreground sm:grid-cols-3">
        <Fact icon={<CalendarDaysIcon aria-hidden />} label="Dates">
          {formatEventDates(event.startDate, event.endDate)}
        </Fact>
        <Fact icon={<UsersIcon aria-hidden />} label="Team size">
          Up to {plural(event.maxTeamSize, "member")}
        </Fact>
        <Fact icon={<CircleCheckIcon aria-hidden />} label="Registered">
          {plural(event._count.registrations, "participant")}
        </Fact>
      </dl>

      <section aria-labelledby="about-heading" className="flex flex-col gap-3">
        <h2 id="about-heading" className="text-xl font-semibold">
          About this event
        </h2>
        <p className="whitespace-pre-line text-pretty break-words">
          {event.description}
        </p>
      </section>

      {/* Ranking section: only once results are published (Decision 10). */}
      {event.resultsPublished && (
        <div id="ranking" className="scroll-mt-20">
          <PublishedRanking
            eventId={event.id}
            signedIn={user !== null}
            viewerTeamId={participant?.teamId ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-5">{icon}</span>
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

const BIG_BUTTON = "h-11 w-full px-6 text-base md:w-auto";

/** The primary action for each situation in docs/08's table. */
function primaryAction({
  event,
  role,
  participant,
}: {
  event: { id: string; registrationOpen: boolean };
  role: "PARTICIPANT" | "JUDGE" | "ORGANIZER" | null;
  participant: {
    registered: boolean;
    profileComplete: boolean;
    teamId: string | null;
  } | null;
}): ReactNode {
  const teamHref = `/events/${event.id}/team`;

  if (role === "ORGANIZER") {
    return (
      <Button asChild size="lg" className={BIG_BUTTON}>
        <Link href={`/organizer/events/${event.id}`}>Manage event</Link>
      </Button>
    );
  }

  // Judges can't be on teams (Decision 11), so they get no register button.
  if (role === "JUDGE") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground md:max-w-xs md:text-right">
        <InfoIcon className="size-4 shrink-0" aria-hidden />
        Judges score teams, so they don&apos;t register for events.
      </p>
    );
  }

  if (participant?.registered) {
    return (
      <>
        <p
          role="status"
          className="flex items-center gap-2 font-medium text-success"
        >
          <CircleCheckIcon className="size-5" aria-hidden />
          You&apos;re registered
        </p>
        <Button asChild size="lg" className={BIG_BUTTON}>
          <Link href={teamHref}>
            {participant.teamId ? "Go to my team" : "Create or join a team"}
          </Link>
        </Button>
      </>
    );
  }

  if (!event.registrationOpen) {
    return (
      <>
        <Button size="lg" disabled className={BIG_BUTTON}>
          <LockIcon aria-hidden />
          Registration closed
        </Button>
        <p className="text-sm text-muted-foreground">{REGISTRATION_CLOSED}</p>
      </>
    );
  }

  if (participant && !participant.profileComplete) {
    return (
      <Alert className="md:max-w-xs">
        <InfoIcon aria-hidden />
        <AlertDescription>
          <p>
            Complete your profile before registering.{" "}
            <Link
              href="/profile"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Go to my profile
            </Link>
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (participant) {
    return <RegisterForm action={registerForEvent.bind(null, event.id)} />;
  }

  // Visitor: log in, then come back here.
  return (
    <Button asChild size="lg" className={BIG_BUTTON}>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.id}`)}`}
      >
        Log in to register
      </Link>
    </Button>
  );
}

function EventSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
