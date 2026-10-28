import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, InfoIcon, LockIcon } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { EventAvatar } from "@/components/events/event-avatar";
import { EventBanner } from "@/components/events/event-banner";
import { EventContext } from "@/components/events/event-context";
import {
  excerpt,
  formatEventDates,
  plural,
} from "@/components/events/event-format";
import { RegisterForm } from "@/components/events/register-form";
import { PhaseLabel } from "@/components/events/phase-dot";
import { EventStatusBadges } from "@/components/events/status-badge";
import { ActionDock } from "@/components/layout/action-dock";
import { PublishedRanking } from "@/components/ranking/published-ranking";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/dal";
import { eventPhase } from "@/lib/domain/event-phase";
import { REGISTRATION_CLOSED } from "@/lib/domain/registration";
import { prisma } from "@/lib/prisma";
import {
  getParticipantState,
  type ParticipantState,
} from "@/lib/queries/participant-progress";
import { OG_IMAGE, pageMetadata } from "@/lib/site";
import { eventImageUrl } from "@/lib/uploads/url";
import { cn } from "@/lib/utils";

import { registerForEvent } from "./actions";

// docs/08 > /events/[eventId], as the redesign's "long page + side rail": one
// scrolling page (banner, about, details, how judging works, teams, results)
// and, from lg up, a sticky rail on the right with the event's phase, the
// viewer's status and the page's single primary action. On phones the rail
// sits under the title and its primary action docks to the bottom of the
// screen (ActionDock). Everyone can open it by link; the primary action
// depends on who is looking (docs/08's table of situations). Params and the
// session are read inside Suspense (Cache Components).

// The tab title and link preview: the event's name and the start of its
// description, with its banner as the image when it has one. An unknown id
// gets the plain "Event" title; the page itself shows the 404.
export async function generateMetadata({
  params,
}: PageProps<"/events/[eventId]">): Promise<Metadata> {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, description: true, bannerPath: true },
  });
  if (!event) return { title: "Event" };

  const meta = pageMetadata({
    title: event.name,
    description: excerpt(event.description),
    path: `/events/${eventId}`,
  });
  const banner = eventImageUrl(event.bannerPath);
  const image = banner
    ? { url: banner, width: 1600, height: 600, alt: event.name }
    : OG_IMAGE;
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [image] },
    twitter: { ...meta.twitter, images: [image.url] },
  };
}

export default function EventPage({ params }: PageProps<"/events/[eventId]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
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
        logoPath: true,
        bannerPath: true,
        createdById: true,
        criteria: {
          select: { id: true, name: true, weightPercent: true, maxScore: true },
          orderBy: [{ weightPercent: "desc" }, { createdAt: "asc" }],
        },
        _count: { select: { registrations: true, teams: true } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!event) notFound();

  const [participant, anySubmission] = await Promise.all([
    user?.role === "PARTICIPANT"
      ? getParticipantState(event.id, user.id)
      : Promise.resolve(null),
    prisma.submission.findFirst({
      where: { team: { eventId: event.id } },
      select: { id: true },
    }),
  ]);

  const phase = eventPhase({ ...event, hasSubmissions: anySubmission !== null });
  const dates = formatEventDates(event.startDate, event.endDate);
  const criteriaTotal = event.criteria.reduce((n, c) => n + c.weightPercent, 0);
  const action = (
    <PrimaryAction
      event={event}
      role={user?.role ?? null}
      ownsEvent={user?.id === event.createdById}
      participant={participant}
    />
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col">
        <EventContext
          event={event}
          phase={phase}
          crumbs={[]}
          participant={participant}
        />
        <EventBanner
          name={event.name}
          bannerUrl={eventImageUrl(event.bannerPath)}
          priority
          className="mt-4 rounded-2xl border lg:aspect-auto lg:h-72"
        />
        <div className="relative z-10 -mt-10 px-4 md:-mt-14 md:px-8">
          <EventAvatar
            name={event.name}
            logoUrl={eventImageUrl(event.logoPath)}
            size="lg"
          />
        </div>
        <header className="mt-4 flex flex-col gap-2">
          <h1 className="text-page-title text-balance break-words">
            {event.name}
          </h1>
          <p className="text-muted-foreground">{dates}</p>
        </header>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <aside
          aria-label="Event status"
          className="flex flex-col gap-5 rounded-2xl border bg-card p-5 text-card-foreground lg:sticky lg:top-24 lg:order-last lg:p-6"
        >
          <div className="flex flex-col gap-3">
            <p className="text-section-title">
              <PhaseLabel phase={phase} />
            </p>
            <EventStatusBadges event={event} />
          </div>
          {participant && (
            <YourStatus participant={participant} eventId={event.id} />
          )}
          {/* From md up the action sits in the rail; on phones it docks. */}
          <div className="hidden md:block">{action}</div>
        </aside>

        <div className="flex min-w-0 flex-col gap-12">
          <Section id="about" title="About this event">
            <p className="max-w-[68ch] text-pretty whitespace-pre-line break-words">
              {event.description}
            </p>
          </Section>

          <Section id="details" title="Dates and teams">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
              <Fact label="Dates">{dates}</Fact>
              <Fact label="Team size">
                Up to {plural(event.maxTeamSize, "member")}
              </Fact>
              <Fact label="Registered">
                <span className="tabular-nums">
                  {plural(event._count.registrations, "participant")}
                </span>
              </Fact>
            </dl>
          </Section>

          <Section id="judging" title="How judging works">
            {event.criteria.length === 0 ? (
              <p className="text-muted-foreground">
                The organizer hasn&apos;t set the judging criteria yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="max-w-[68ch] text-muted-foreground">
                  Every judge scores every submitted team on each criterion.
                  Scores are averaged, weighted and added up to a total out of
                  100. Ties are broken by the highest-weight criterion.
                </p>
                <ul className="flex flex-col divide-y rounded-xl border">
                  {event.criteria.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                      <span className="font-medium break-words">{c.name}</span>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        <span className="font-mono text-base font-semibold text-foreground">
                          {c.weightPercent}%
                        </span>{" "}
                        · scored 0–{c.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
                {criteriaTotal !== 100 && (
                  <p className="text-sm text-muted-foreground">
                    The weights aren&apos;t final yet.
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section id="teams" title="Teams">
            <TeamsSection
              eventId={event.id}
              maxTeamSize={event.maxTeamSize}
              teamCount={event._count.teams}
              participant={participant}
            />
          </Section>

          {/* Only once results are published (Decision 10). */}
          {event.resultsPublished && (
            <div id="results" className="scroll-mt-24">
              <PublishedRanking
                eventId={event.id}
                signedIn={user !== null}
                viewerTeamId={participant?.team?.id}
              />
            </div>
          )}
        </div>
      </div>

      <ActionDock className="md:hidden">{action}</ActionDock>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="flex scroll-mt-24 flex-col gap-4"
    >
      <h2 id={`${id}-heading`} className="text-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

/** The viewer's own standing: registered, team, submitted. Words first. */
function YourStatus({
  participant,
  eventId,
}: {
  participant: ParticipantState;
  eventId: string;
}) {
  const rows: { label: string; value: ReactNode; done: boolean }[] = [
    {
      label: "Registration",
      value: participant.registered ? "Registered" : "Not registered",
      done: participant.registered,
    },
    {
      label: "Team",
      value: participant.team ? (
        <Link
          href={`/events/${eventId}/team`}
          className="rounded-sm underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {participant.team.name}
        </Link>
      ) : (
        "No team yet"
      ),
      done: participant.onTeam,
    },
    {
      label: "Project",
      value: participant.submitted ? "Submitted" : "Not submitted",
      done: participant.submitted,
    },
  ];
  return (
    <div className="flex flex-col gap-2 border-t pt-5">
      <h2 className="text-sm font-medium text-muted-foreground">Your status</h2>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd
              className={cn(
                "flex min-w-0 items-center gap-1.5 text-right font-medium break-words",
                r.done && "text-success",
              )}
            >
              {r.done && <CheckIcon className="size-4 shrink-0" aria-hidden />}
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TeamsSection({
  eventId,
  maxTeamSize,
  teamCount,
  participant,
}: {
  eventId: string;
  maxTeamSize: number;
  teamCount: number;
  participant: ParticipantState | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-[68ch]">
        Teams have up to {plural(maxTeamSize, "member")}. Agree on your team
        first: one of you creates it and shares its 6-character invite code,
        the others join with it. {plural(teamCount, "team")} so far.
      </p>
      {participant?.team && (
        <p>
          You&apos;re on{" "}
          <Link
            href={`/events/${eventId}/team`}
            className="rounded-sm font-medium underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {participant.team.name}
          </Link>{" "}
          with {plural(participant.team.memberCount - 1, "other member")}.
        </p>
      )}
    </div>
  );
}

const BIG = "h-11 w-full px-6 text-base";

/** The page's single primary action, for each situation in docs/08's table. */
function PrimaryAction({
  event,
  role,
  ownsEvent,
  participant,
}: {
  event: {
    id: string;
    registrationOpen: boolean;
    submissionsOpen: boolean;
    resultsPublished: boolean;
  };
  role: Role | null;
  /** The signed-in user created this event. */
  ownsEvent: boolean;
  participant: ParticipantState | null;
}): ReactNode {
  const teamHref = `/events/${event.id}/team`;

  if (role === "ORGANIZER") {
    // Only the organizer who created the event can manage it.
    if (!ownsEvent) {
      return (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Another organizer runs this event.
        </p>
      );
    }
    return (
      <Button asChild size="lg" className={BIG}>
        <Link href={`/organizer/events/${event.id}`}>Manage event</Link>
      </Button>
    );
  }

  // Judges can't be on teams (Decision 11), so they get no register button.
  if (role === "JUDGE") {
    return (
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        Judges score teams, so they don&apos;t register for events.
      </p>
    );
  }

  if (participant?.registered) {
    if (event.resultsPublished) {
      return (
        <Button asChild size="lg" variant="outline" className={BIG}>
          <a href="#results">See the results</a>
        </Button>
      );
    }
    // The next thing to do: submit while submissions are open, else the team.
    if (participant.onTeam && event.submissionsOpen && !participant.submitted) {
      return (
        <Button asChild size="lg" className={BIG}>
          <Link href={`${teamHref}/submit`}>Submit project</Link>
        </Button>
      );
    }
    return (
      <Button asChild size="lg" className={BIG}>
        <Link href={teamHref}>
          {participant.onTeam ? "Go to my team" : "Create or join a team"}
        </Link>
      </Button>
    );
  }

  if (!event.registrationOpen) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="lg" disabled className={BIG}>
          <LockIcon aria-hidden />
          Registration closed
        </Button>
        <p className="text-sm text-muted-foreground">{REGISTRATION_CLOSED}</p>
      </div>
    );
  }

  if (participant && !participant.profileComplete) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Complete your profile before registering.</p>
        <Button asChild size="lg" className={BIG}>
          <Link href="/profile">Go to my profile</Link>
        </Button>
      </div>
    );
  }

  if (participant) {
    return <RegisterForm action={registerForEvent.bind(null, event.id)} />;
  }

  // Visitor: log in, then come back here.
  return (
    <Button asChild size="lg" className={BIG}>
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
        <Skeleton className="aspect-[2/1] w-full rounded-2xl md:aspect-[8/3]" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-64 rounded-2xl lg:order-last" />
      </div>
    </div>
  );
}
