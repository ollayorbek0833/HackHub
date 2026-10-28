// Test data for e2e/scorecard-wide-scale.spec.ts, run with tsx (Playwright's
// loader can't import the generated Prisma client, which is ESM).
//
//   tsx e2e/fixtures/wide-scale-event.ts create   → prints {"eventId","teamId","organizerId"}
//   tsx e2e/fixtures/wide-scale-event.ts delete <eventId> <organizerId>
//
// "create" makes an event in judging with one criterion out of 20 and one
// submitted team, owned by a throwaway organizer so no seeded organizer's
// "Events I run" changes. "delete" removes it; teams, criteria, submissions
// and scores go with the event.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to write e2e fixtures with NODE_ENV=production.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function create() {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const organizer = await prisma.user.create({
    data: {
      email: `scorecard.${tag}@example.com`,
      passwordHash: "unused: this organizer never logs in",
      role: "ORGANIZER",
    },
  });
  const event = await prisma.event.create({
    data: {
      name: `Wide Scale Hack ${tag}`,
      description: "Fixture for the scorecard wrap e2e.",
      startDate: new Date("2026-10-20"),
      endDate: new Date("2026-10-21"),
      createdById: organizer.id,
      criteria: { create: [{ name: "Impact", weightPercent: 100, maxScore: 20 }] },
    },
  });
  const team = await prisma.team.create({
    data: {
      eventId: event.id,
      name: "Twenty Points",
      inviteCode: tag.slice(-6),
      createdById: organizer.id,
      submission: {
        create: {
          title: "Wide scale project",
          description: "A project scored out of 20.",
          repoUrl: "https://example.com/wide-scale",
        },
      },
    },
  });
  console.log(JSON.stringify({ eventId: event.id, teamId: team.id, organizerId: organizer.id }));
}

async function remove(eventId: string, organizerId: string) {
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.user.deleteMany({ where: { id: organizerId } });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "create") await create();
  else if (command === "delete" && args.length === 2) await remove(args[0], args[1]);
  else throw new Error("Usage: wide-scale-event.ts create | delete <eventId> <organizerId>");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
