// Demo data for building and testing features in parallel (#52). Local only:
// it refuses to run in production. Run `npx prisma db seed` first (it creates
// the organizer who owns the demo events), then `npm run db:seed:demo`.
//
// It upserts, so it is safe to run again: it puts the demo events back in the
// state described below and leaves anything else you created alone. For a
// clean slate: npx prisma migrate reset --force && npx prisma db seed &&
// npm run db:seed:demo
//
// - "Demo Hack · judging": registration and submissions closed. 3 criteria,
//   all 8 participants registered, 3 teams (4, 2 and 1 members, participant8
//   has none), submissions from the first two, and judge@hackhub.test's scores
//   for the first team only.
// - "Open Hack · live": registration and submissions open, nobody registered,
//   no teams and no criteria.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import type { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import type { Role } from "../src/generated/prisma/enums";
import { hashPassword } from "../src/lib/password";
import { emailSchema, passwordSchema } from "../src/lib/validation/auth";
import { DEMO_USERS } from "./demo-users";

if (process.env.NODE_ENV === "production") {
  console.error(
    "The demo seed is for local use only. Never run it in production.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PARTICIPANT = (n: number) => `participant${n}@hackhub.test`;

/** Profiles for the 8 participants. Judges don't need one. */
const PROFILES: { name: string; faculty: string; skills: string[] }[] = [
  {
    name: "Aziza Karimova",
    faculty: "Computer Science",
    skills: ["React", "TypeScript"],
  },
  {
    name: "Bekzod Tursunov",
    faculty: "Computer Science",
    skills: ["PostgreSQL", "Node.js"],
  },
  {
    name: "Dilnoza Rashidova",
    faculty: "Design",
    skills: ["Figma", "UX research"],
  },
  {
    name: "Jasur Aliyev",
    faculty: "Business",
    skills: ["Pitching", "Market research"],
  },
  {
    name: "Madina Yusupova",
    faculty: "Applied Mathematics",
    skills: ["Python", "Data analysis"],
  },
  {
    name: "Otabek Nazarov",
    faculty: "Computer Engineering",
    skills: ["Flutter", "Firebase"],
  },
  {
    name: "Sardor Ergashev",
    faculty: "Computer Science",
    skills: ["Go", "Docker"],
  },
  {
    name: "Nilufar Saidova",
    faculty: "Economics",
    skills: ["Excel", "Presentations"],
  },
];

type DemoUser = {
  email: string;
  role: Role;
  profile?: (typeof PROFILES)[number];
};

/** seed.ts's demo users, plus a second judge and participants 4 to 8. */
const USERS: DemoUser[] = [
  ...DEMO_USERS,
  { email: "judge2@hackhub.test", role: "JUDGE" as const },
  ...[4, 5, 6, 7, 8].map((n) => ({
    email: PARTICIPANT(n),
    role: "PARTICIPANT" as const,
  })),
].map((user) => {
  const n = PROFILES.findIndex((_, i) => PARTICIPANT(i + 1) === user.email);
  return n === -1 ? user : { ...user, profile: PROFILES[n] };
});

const CRITERIA = [
  { name: "Innovation", weightPercent: 50, maxScore: 10 },
  { name: "Execution", weightPercent: 30, maxScore: 10 },
  { name: "Presentation", weightPercent: 20, maxScore: 10 },
];

/** Invite codes are 6 characters from ABCDEFGHJKLMNPQRSTUVWXYZ23456789. */
const TEAMS = [
  {
    name: "Null Pointers",
    inviteCode: "NULPTR",
    members: [1, 2, 3, 4].map(PARTICIPANT),
    submission: {
      title: "CampusEats",
      description:
        "Pre-order lunch from the campus canteens and skip the queue between lectures.",
      repoUrl: "https://github.com/hackhub-demo/campus-eats",
    },
  },
  {
    name: "Byte Me",
    inviteCode: "BYTEME",
    members: [5, 6].map(PARTICIPANT),
    submission: {
      title: "StudyBuddy",
      description:
        "Matches students who take the same course into study groups by free time.",
      repoUrl: "https://github.com/hackhub-demo/study-buddy",
    },
  },
  {
    name: "Lone Wolf",
    inviteCode: "WLF234",
    members: [7].map(PARTICIPANT),
    submission: null,
  },
];

/** judge@hackhub.test's scores for Null Pointers, by criterion. */
const SCORES: Record<string, number> = {
  Innovation: 8,
  Execution: 7,
  Presentation: 9,
};

function readVariable(name: string, schema: z.ZodType<string>): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`${name}: ${result.error.issues[0].message}`);
  }
  return result.data;
}

/** Find a demo event by name and reset its switches, or create it. */
async function upsertEvent(
  name: string,
  data: {
    description: string;
    startDate: Date;
    endDate: Date;
    registrationOpen: boolean;
    submissionsOpen: boolean;
    createdById: string;
  },
) {
  const existing = await prisma.event.findFirst({
    where: { name },
    select: { id: true },
  });
  const event = existing
    ? await prisma.event.update({
        where: { id: existing.id },
        data: { ...data, maxTeamSize: 4, resultsPublished: false },
        select: { id: true },
      })
    : await prisma.event.create({
        data: { name, ...data, maxTeamSize: 4 },
        select: { id: true },
      });
  console.log(`Seeded event "${name}"`);
  return event.id;
}

async function main() {
  const organizerEmail = readVariable("SEED_ORGANIZER_EMAIL", emailSchema);
  const demoPassword = readVariable("SEED_DEMO_PASSWORD", passwordSchema);

  const organizer = await prisma.user.findUnique({
    where: { email: organizerEmail },
    select: { id: true },
  });
  if (!organizer) {
    throw new Error(
      `No user ${organizerEmail}. Run \`npx prisma db seed\` first.`,
    );
  }

  // Users. Like seed.ts, an existing user keeps their password; only the role
  // is reset. One hash for all of them: bcrypt is slow on purpose.
  const passwordHash = await hashPassword(demoPassword);
  const userId: Record<string, string> = {};
  for (const { email, role, profile } of USERS) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role },
      create: { email, passwordHash, role },
      select: { id: true },
    });
    userId[email] = user.id;
    if (profile) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: profile,
        create: { userId: user.id, links: [], ...profile },
      });
    }
    console.log(`Seeded ${role.toLowerCase()} ${email}`);
  }
  const participants = USERS.filter((u) => u.role === "PARTICIPANT");

  // Demo Hack · judging: closed for registration and submissions, so judges
  // can score and the organizer can publish.
  const demoId = await upsertEvent("Demo Hack · judging", {
    description:
      "A finished hackathon waiting for its ranking. Judges score the submitted teams here.",
    startDate: new Date("2026-10-24T00:00:00.000Z"),
    endDate: new Date("2026-10-25T00:00:00.000Z"),
    registrationOpen: false,
    submissionsOpen: false,
    createdById: organizer.id,
  });

  const criterionId: Record<string, string> = {};
  for (const criterion of CRITERIA) {
    const row = await prisma.criterion.upsert({
      where: { eventId_name: { eventId: demoId, name: criterion.name } },
      update: criterion,
      create: { eventId: demoId, ...criterion },
      select: { id: true },
    });
    criterionId[criterion.name] = row.id;
  }
  // Criteria added while testing would break the 100% total.
  await prisma.criterion.deleteMany({
    where: { eventId: demoId, name: { notIn: CRITERIA.map((c) => c.name) } },
  });

  // Registrations (and with them, team memberships) of anyone who isn't one
  // of the 8 demo participants, e.g. a test account.
  await prisma.eventRegistration.deleteMany({
    where: {
      eventId: demoId,
      userId: { notIn: participants.map(({ email }) => userId[email]) },
    },
  });
  for (const { email } of participants) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: demoId, userId: userId[email] } },
      update: {},
      create: { eventId: demoId, userId: userId[email] },
    });
  }

  // Teams created while testing, with their members and submissions.
  await prisma.team.deleteMany({
    where: { eventId: demoId, name: { notIn: TEAMS.map((t) => t.name) } },
  });
  const teamId: Record<string, string> = {};
  for (const { name, inviteCode, members, submission } of TEAMS) {
    const team = await prisma.team.upsert({
      where: { eventId_name: { eventId: demoId, name } },
      update: {},
      create: {
        eventId: demoId,
        name,
        inviteCode,
        createdById: userId[members[0]],
      },
      select: { id: true },
    });
    teamId[name] = team.id;

    // Scalar ids, not nested connect: the composite foreign keys share
    // event_id (docs/07 > Prisma schema v1).
    for (const email of members) {
      await prisma.teamMember.upsert({
        where: { eventId_userId: { eventId: demoId, userId: userId[email] } },
        update: { teamId: team.id },
        create: { teamId: team.id, eventId: demoId, userId: userId[email] },
      });
    }

    if (submission) {
      await prisma.submission.upsert({
        where: { teamId: team.id },
        update: submission,
        create: { teamId: team.id, ...submission },
      });
    } else {
      await prisma.submission.deleteMany({ where: { teamId: team.id } });
    }
  }
  // Anyone who joined a demo team while testing (participant8 has no team).
  await prisma.teamMember.deleteMany({
    where: {
      eventId: demoId,
      userId: {
        notIn: TEAMS.flatMap(({ members }) => members.map((e) => userId[e])),
      },
    },
  });

  // Back to "one judge has scored one team": drop scores added while testing,
  // e.g. judge2's, so a re-run resets the judging state too.
  const judgeId = userId["judge@hackhub.test"];
  await prisma.score.deleteMany({
    where: {
      team: { eventId: demoId },
      NOT: { judgeId, teamId: teamId["Null Pointers"] },
    },
  });
  for (const [criterion, value] of Object.entries(SCORES)) {
    await prisma.score.upsert({
      where: {
        judgeId_teamId_criterionId: {
          judgeId,
          teamId: teamId["Null Pointers"],
          criterionId: criterionId[criterion],
        },
      },
      update: { value },
      create: {
        judgeId,
        teamId: teamId["Null Pointers"],
        criterionId: criterionId[criterion],
        value,
      },
    });
  }

  // Open Hack · live: open for registration and submissions, with no teams,
  // for testing the participant flows from the start.
  const openId = await upsertEvent("Open Hack · live", {
    description:
      "A hackathon that is happening now. Register, form a team and submit a project.",
    startDate: new Date("2026-11-07T00:00:00.000Z"),
    endDate: new Date("2026-11-08T00:00:00.000Z"),
    registrationOpen: true,
    submissionsOpen: true,
    createdById: organizer.id,
  });
  // Back to "nobody registered, no teams, no criteria". Deleting the teams
  // also deletes their members and submissions.
  await prisma.team.deleteMany({ where: { eventId: openId } });
  await prisma.eventRegistration.deleteMany({ where: { eventId: openId } });
  await prisma.criterion.deleteMany({ where: { eventId: openId } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
