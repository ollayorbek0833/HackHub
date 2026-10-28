// Showcase data for the live demo: WIPES the database it points at, then fills
// it with realistic data. Never part of the deploy (the migrate CMD runs only
// prisma/seed.ts). See docs/04-setup-and-deployment.md > Showcase data.
//
//   SHOWCASE_CONFIRM=wipe:<database name> npx tsx prisma/seed-showcase.ts [--today=YYYY-MM-DD]
//
// - Refuses to run unless SHOWCASE_CONFIRM names the database it is connected
//   to, and prints the host and database first.
// - One interactive transaction: truncate every app table (_prisma_migrations
//   stays), insert everything, run the invariant checks, and commit only if
//   they all pass. Any failure rolls back and the old data stays.
// - Deterministic: a seeded PRNG (mulberry32) builds every row, ids included,
//   so a second run gives the same data. Only the dates move with --today
//   (default: today in Asia/Tashkent).
//
// What it makes: 5 organizers, 15 judges and 1,000 participants, all with the
// password 12345678i; 50 events (10 per organizer: 2 finished, 2 judging,
// 2 live building, 2 live registration, 2 upcoming) with criteria,
// registrations, teams, submissions and scores to match each state.
import "dotenv/config";
import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { validateCriteria } from "../src/lib/domain/criteria";
import { eventStatus, type EventStatus } from "../src/lib/domain/event-status";
import { publishBlocker } from "../src/lib/domain/event-switches";
import { generateInviteCode } from "../src/lib/domain/invite-code";
import { hashPassword } from "../src/lib/password";
import { profileSchema } from "../src/lib/validation/profile";
import { submissionSchema } from "../src/lib/validation/submission";
import { createTeamSchema } from "../src/lib/validation/teams";
import * as D from "./seed-showcase-data";

const PASSWORD = "12345678i";
const SEED = 0x48484b32; // "HHK2"
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// ─── Deterministic randomness ────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
/** Whole number in [0, max), like crypto.randomInt (for generateInviteCode). */
const randInt = (max: number) => Math.floor(rand() * max);
/** Whole number in [min, max], both included. */
const between = (min: number, max: number) => min + randInt(max - min + 1);
const chance = (p: number) => rand() < p;
const pick = <T>(items: readonly T[]): T => items[randInt(items.length)];
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function weighted<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let r = rand() * total;
  for (const item of items) {
    r -= weight(item);
    if (r < 0) return item;
  }
  return items[items.length - 1];
}
/** Roughly normal, mean 0 and spread about 1 (sum of uniforms). */
const gauss = () => (rand() + rand() + rand() + rand() - 2) * 1.7;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// Ids look like cuids (c + 24 lowercase letters and digits) and come from
// their own PRNG stream, so they are the same on every run.
const idRand = mulberry32(SEED ^ 0x5eed);
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const usedIds = new Set<string>();
function newId(): string {
  for (;;) {
    let id = "c";
    for (let i = 0; i < 24; i++) id += ID_CHARS[Math.floor(idRand() * 36)];
    if (!usedIds.has(id)) {
      usedIds.add(id);
      return id;
    }
  }
}

// ─── Dates (event days are UTC midnight; the day runs in GMT+5) ──────────────

function parseToday(argv: string[]): Date {
  const arg = argv.find((a) => a.startsWith("--today="));
  const value =
    arg?.slice("--today=".length) ??
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date());
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`--today must be a real day as YYYY-MM-DD, got "${value}".`);
  }
  return date;
}

const TODAY = parseToday(process.argv.slice(2));
/** The event day `offset` days from today (UTC midnight, for @db.Date). */
const dayFromToday = (offset: number) => new Date(TODAY.getTime() + offset * DAY);
/** A moment on an event day, in Tashkent wall-clock hours (may be fractional). */
const at = (day: Date, hour: number) => new Date(day.getTime() + (hour - 5) * HOUR);
/** Start of today in Tashkent: every "already happened" timestamp is before this. */
const TODAY_START = at(TODAY, 0);
const between_ = (a: Date, b: Date) =>
  new Date(a.getTime() + Math.floor(rand() * Math.max(0, b.getTime() - a.getTime())));
const minDate = (a: Date, b: Date) => (a < b ? a : b);
const maxDate = (a: Date, b: Date) => (a > b ? a : b);
const iso = (d: Date) => d.toISOString().slice(0, 10);

// ─── People ──────────────────────────────────────────────────────────────────

type Person = {
  id: string;
  role: "ORGANIZER" | "JUDGE" | "PARTICIPANT";
  first: string;
  last: string;
  female: boolean;
  email: string;
  phone: string;
  github: string;
  faculty: string;
  skills: string[];
  bio: string | null;
  links: string[];
  createdAt: Date;
};

const usedEmails = new Set<string>();
const usedPhones = new Set<string>();
const usedHandles = new Set<string>();

function femaleSurname(male: string) {
  return `${male}a`;
}

function makeName(): { first: string; last: string; female: boolean } {
  const female = chance(0.46);
  if (chance(0.92)) {
    const surname = pick(D.UZBEK_SURNAMES);
    return female
      ? { first: pick(D.FEMALE_FIRST), last: femaleSurname(surname), female }
      : { first: pick(D.MALE_FIRST), last: surname, female };
  }
  const o = D.OTHER_PEOPLE;
  const first = female ? pick(o.femaleFirst) : pick(o.maleFirst);
  if (chance(0.45)) return { first, last: pick(o.neutralSurnames), female };
  const surname = pick(o.surnames);
  return { first, last: female ? femaleSurname(surname) : surname, female };
}

/** Gmail-style local part: letters, digits and dots only, lowercase. */
function makeEmail(first: string, last: string): string {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  const yy = () => pick(["97", "98", "99", "00", "01", "02", "03", "04", "05", "06"]);
  const patterns = [
    { w: 30, make: () => `${f}.${l}` },
    { w: 14, make: () => `${f}${l}` },
    { w: 10, make: () => `${f[0]}.${l}` },
    { w: 15, make: () => `${f}.${l}${yy()}` },
    { w: 8, make: () => `${l}.${f}` },
    { w: 6, make: () => `${f}${l}${between(1998, 2006)}` },
    { w: 10, make: () => `${f}.${l}${between(1, 99)}` },
    { w: 7, make: () => `${f}${l[0]}${yy()}` },
  ];
  for (let attempt = 0; attempt < 30; attempt++) {
    const local = weighted(patterns, (p) => p.w).make();
    const email = `${local}@gmail.com`;
    if (local.length >= 6 && !usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
  for (let n = 100; ; n++) {
    const email = `${f}.${l}${n}@gmail.com`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
}

/** +998, a real operator code, then 7 digits (stored as +998XXXXXXXXX). */
function makePhone(): string {
  const codes = D.OPERATOR_CODES;
  const weights: Record<string, number> = { "90": 16, "91": 10, "93": 12, "94": 10, "97": 12, "99": 12, "33": 8, "88": 8, "77": 5, "95": 4, "98": 3 };
  for (;;) {
    const phone = `+998${weighted(codes, (c) => weights[c] ?? 1)}${String(randInt(10_000_000)).padStart(7, "0")}`;
    if (!usedPhones.has(phone) && !/^\+998\d\d0{7}$/.test(phone)) {
      usedPhones.add(phone);
      return phone;
    }
  }
}

/** 2 to 4 digits, so a made-up handle is unlikely to be someone's real one. */
const digits = () => String(between(10, 9999));

/**
 * A GitHub-style handle (letters, digits, hyphens), unique across people.
 * Always the name plus 2 to 4 digits, so it's clearly derived and unlikely to
 * belong to a real account.
 */
function makeHandle(first: string, last: string): string {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  for (;;) {
    const handle = pick([`${f}${l}${digits()}`, `${f}-${l}${digits()}`, `${f[0]}${l}${digits()}`, `${f}${l[0]}${digits()}`]);
    if (!usedHandles.has(handle)) {
      usedHandles.add(handle);
      return handle;
    }
  }
}

function makeLinks(first: string, last: string, github: string, count: number): string[] {
  const f = first.toLowerCase();
  const l = last.toLowerCase();
  const all = [
    `https://github.com/${github}`,
    `https://linkedin.com/in/${f}-${l}-${digits()}`,
    `https://t.me/${f}_${l}${digits()}`,
  ];
  if (count === 3) return all;
  // GitHub most often, then LinkedIn, then Telegram.
  const order = chance(0.7) ? [0, 1, 2] : chance(0.5) ? [1, 0, 2] : [2, 0, 1];
  return order.slice(0, count).sort().map((i) => all[i]);
}

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Missing {${key}} in "${template}"`);
    return String(values[key]);
  });
}

function makeBio(faculty: string, skills: string[]): string {
  const year = pick(D.YEARS_OF_STUDY);
  const uni = pick(D.UNIVERSITIES);
  const tools = skills.filter((skill) => !D.SOFT_SKILLS.includes(skill));
  const [skillA, skillB] = shuffle(tools.length > 0 ? tools : skills);
  const values = { faculty, uni, skillA, skillB: skillB ?? "", year: year.year, yearLower: year.yearLower };
  // One skill gets a one-skill sentence, so no bio names the same skill twice.
  const middle = skillB === undefined ? pick(D.BIO_MIDDLES_ONE) : pick(D.BIO_MIDDLES);
  const parts = [fill(pick(D.BIO_OPENERS), values), fill(middle, values)];
  for (const extra of shuffle(D.BIO_EXTRAS).slice(0, between(0, 2))) {
    if ([...parts, extra].join(" ").length <= 400) parts.push(extra);
  }
  for (const extra of D.BIO_EXTRAS) {
    if (parts.join(" ").length >= 100) break;
    if (!parts.includes(extra)) parts.push(extra);
  }
  return parts.join(" ");
}

function makeSkills(faculty: (typeof D.FACULTIES)[number]): string[] {
  const count = between(2, 6);
  const general = Math.min(count - 1, between(0, 2));
  const own = shuffle(faculty.skills).slice(0, count - general);
  const extra = shuffle(D.GENERAL_SKILLS).filter((s) => !own.some((o) => o.toLowerCase() === s.toLowerCase()));
  return [...own, ...extra.slice(0, general)];
}

function checkProfile(p: Person) {
  const result = profileSchema.safeParse({
    name: `${p.first} ${p.last}`,
    faculty: p.faculty,
    phone: p.phone,
    skills: p.skills,
    bio: p.bio ?? "",
    links: p.links,
  });
  if (!result.success) {
    throw new Error(`Profile of ${p.email} breaks the profile rules: ${result.error.issues[0].message}`);
  }
  const saved = result.data;
  if (
    saved.phone !== p.phone ||
    saved.skills.length !== p.skills.length ||
    saved.links.length !== p.links.length ||
    saved.bio !== p.bio
  ) {
    throw new Error(`Profile of ${p.email} would not be stored as generated.`);
  }
  if (p.role === "PARTICIPANT" && p.bio !== null && (p.bio.length < 100 || p.bio.length > 400)) {
    throw new Error(`Bio of ${p.email} is ${p.bio.length} characters, not 100 to 400.`);
  }
}

function makeOrganizer(i: number): Person {
  const { first, last, female } = makeName();
  const github = makeHandle(first, last);
  const role = D.ORGANIZER_ROLES[i];
  const person: Person = {
    id: newId(),
    role: "ORGANIZER",
    first,
    last,
    female,
    email: makeEmail(first, last),
    phone: makePhone(),
    github,
    faculty: role.faculty,
    skills: shuffle(["Event management", "Public speaking", "Partnerships", "Project management", "Community building", "Pitching"]).slice(0, between(2, 4)),
    bio: role.bio,
    // About 40% of profiles have links: an organizer's is LinkedIn.
    links: chance(0.4) ? [makeLinks(first, last, github, 3)[1]] : [],
    createdAt: at(dayFromToday(-between(400, 520)), between(9, 18)),
  };
  return person;
}

function makeJudge(i: number): Person {
  const { first, last, female } = makeName();
  const github = makeHandle(first, last);
  const title = D.JUDGE_ROLES[i % D.JUDGE_ROLES.length];
  const employer = title === "Associate professor" ? pick(D.UNIVERSITIES) : pick(D.COMPANIES);
  const faculty = pick(D.JUDGE_FACULTIES);
  const facultyEntry = D.FACULTIES.find((f) => f.name === faculty) ?? D.FACULTIES[0];
  const bio = `${title} at ${employer}. ${pick(D.JUDGE_FOCUS)} I have judged student hackathons in Tashkent since ${between(2019, 2023)}.`;
  const links = makeLinks(first, last, github, 3);
  return {
    id: newId(),
    role: "JUDGE",
    first,
    last,
    female,
    email: makeEmail(first, last),
    phone: makePhone(),
    github,
    faculty,
    skills: shuffle(facultyEntry.skills).slice(0, between(3, 6)),
    bio,
    links: !chance(0.4) ? [] : chance(0.5) ? [links[0], links[1]] : [links[1]],
    createdAt: at(dayFromToday(-between(150, 300)), between(9, 18)),
  };
}

function makeParticipant(): Person {
  const { first, last, female } = makeName();
  const faculty = weighted(D.FACULTIES, (f) => f.weight);
  const skills = makeSkills(faculty);
  const github = makeHandle(first, last);
  // About 40% of profiles have links.
  const linkCount = weighted([0, 1, 2, 3], (n) => [60, 22, 12, 6][n]);
  return {
    id: newId(),
    role: "PARTICIPANT",
    first,
    last,
    female,
    email: makeEmail(first, last),
    phone: makePhone(),
    github,
    faculty: faculty.name,
    skills,
    bio: chance(0.6) ? makeBio(faculty.name, skills) : null,
    links: makeLinks(first, last, github, linkCount),
    createdAt: TODAY_START, // set from the person's first registration later
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

type Phase = "finished" | "judging" | "building" | "registration" | "upcoming";
const PHASES_PER_ORGANIZER: Phase[] = [
  "finished", "finished", "judging", "judging", "building", "building",
  "registration", "registration", "upcoming", "upcoming",
];
/** The "Events I run" tab each phase lands in. */
const EXPECTED_STATUS: Record<Phase, EventStatus> = {
  finished: "finished",
  judging: "judging",
  building: "live",
  registration: "live",
  upcoming: "upcoming",
};

type EventPlan = {
  id: string;
  spec: D.EventSpec;
  phase: Phase;
  organizer: Person;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  maxTeamSize: number;
  description: string;
  criteria: { id: string; name: string; weightPercent: number; maxScore: number }[];
  registrants: Person[];
  regAt: Map<string, Date>;
  /** Submitted projects, and how many took an idea from another theme. */
  projects: { total: number; offTheme: number };
};

/** Calendar days an event spans. A "Night" runs overnight, so it spans two. */
function durationDays(name: string) {
  if (name.includes("Night")) return 2;
  if (name.includes("Week") && !name.includes("Weekend")) return 5;
  if (name.includes("Weekend") || name.includes("Sprint") || name.includes("Jam")) return 2;
  return between(2, 3);
}

/** Weekend events start on a Saturday, Night events on a Friday evening. */
function startWeekday(name: string): number | null {
  if (name.includes("Weekend")) return 6;
  if (name.includes("Night")) return 5;
  return null;
}

/**
 * Start offsets (days from today) allowed for each phase, for an event that
 * spans `days` calendar days:
 * - finished: ended 2 to 8 weeks ago;
 * - judging: ended 1 to 7 days ago;
 * - building: started at least a day ago and ends tomorrow or later, so it's
 *   still running tomorrow (a demo the day after the seed run still sees it live);
 * - registration: starts in 1 to 4 weeks;
 * - upcoming: starts in 1 to 3 months.
 */
function makeDates(phase: Phase, name: string, days: number) {
  if (phase === "building") days = Math.max(days, between(3, 4));
  const range: Record<Phase, [number, number]> = {
    finished: [-56 - (days - 1), -14 - (days - 1)],
    judging: [-7 - (days - 1), -1 - (days - 1)],
    building: [-(days - 2), -1],
    registration: [7, 28],
    upcoming: [30, 90],
  };
  const [lo, hi] = range[phase];
  const offsets = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const weekday = phase === "building" ? null : startWeekday(name);
  const fitting = weekday === null ? offsets : offsets.filter((o) => dayFromToday(o).getUTCDay() === weekday);
  const start = dayFromToday(pick(fitting.length > 0 ? fitting : offsets));
  return { startDate: start, endDate: new Date(start.getTime() + (days - 1) * DAY) };
}

function eventNoun(theme: D.Theme) {
  if (theme === "game") return "game jam";
  if (theme === "ctf") return "capture-the-flag competition";
  return "hackathon";
}

function makeDescription(spec: D.EventSpec, days: number, maxTeamSize: number): string {
  const companies = shuffle(D.COMPANIES.filter((c) => c !== spec.host));
  const values = {
    max: maxTeamSize,
    company: companies[0],
    company2: companies[1],
    host: spec.host,
    city: spec.city,
    prize: pick([10, 15, 20, 25, 30, 40, 50]),
  };
  const length = spec.name.includes("Night") ? "overnight" : `${days}-day`;
  const where = spec.venue.includes(spec.city) ? spec.venue : `${spec.venue}, ${spec.city}`;
  // "IT Park Bukhara at IT Park Bukhara": skip "hosted by" when the venue names the host.
  const hostWords = spec.host.split(" ").slice(0, 2).join(" ");
  const host = spec.venue.includes(hostWords) ? "" : ` hosted by ${spec.host}`;
  const intro = `${spec.name} is ${length === "overnight" ? "an" : "a"} ${length} ${eventNoun(spec.theme)}${host} at ${where}.`;
  const paragraphs = [
    `${intro} ${pick(D.THEME_CHALLENGES[spec.theme])}`,
    fill(pick(D.FORMAT_PARAGRAPHS), values),
  ];
  if (chance(0.7)) paragraphs.push(fill(pick(D.PRIZE_PARAGRAPHS), values));
  if (spec.audience === "women") paragraphs.push(fill(D.WOMEN_AUDIENCE_PARAGRAPH, values));
  else if (chance(0.6)) paragraphs.push(fill(pick(D.AUDIENCE_PARAGRAPHS), values));
  return paragraphs.join("\n\n");
}

function makeCriteria(theme: D.Theme) {
  const n = weighted([3, 4, 5] as const, (k) => ({ 3: 15, 4: 40, 5: 45 })[k]);
  const pool = D.THEME_CRITERIA[theme];
  const chosen = shuffle(pool.map((_, i) => i)).slice(0, n).sort((a, b) => a - b);
  const split = pick(D.WEIGHT_SPLITS[n]);
  // Scales of 5 or 10 only: a 0–20 scale is 21 buttons on the scorecard.
  const scale = chance(0.88) ? 10 : 5;
  const criteria = chosen.map((index, i) => ({
    id: newId(),
    name: pool[index],
    weightPercent: split[i],
    // Mostly one scale for the whole event; now and then one criterion differs.
    maxScore: chance(0.08) ? 15 - scale : scale,
  }));
  const issues = validateCriteria(criteria);
  if (issues.length > 0) throw new Error(`Criteria for ${theme} break the rules: ${issues[0].message}`);
  return criteria;
}

// ─── Build everything in memory ──────────────────────────────────────────────

function build() {
  const organizers = Array.from({ length: 5 }, (_, i) => makeOrganizer(i));
  const judges = Array.from({ length: 15 }, (_, i) => makeJudge(i));
  const participants = Array.from({ length: 1000 }, makeParticipant);

  // Events: 10 per organizer, 2 per phase.
  const shuffled = shuffle(D.EVENTS);
  if (new Set(shuffled.map((s) => s.name)).size !== 50) throw new Error("Expected 50 unique event names.");
  // Per organizer, the building slots (5th and 6th) take events that can run
  // three days or more, so a "Weekend" or "Night" never stretches to fit.
  const fixedLength = (spec: D.EventSpec) => startWeekday(spec.name) !== null;
  const specs = Array.from({ length: 5 }, (_, o) => {
    const chunk = shuffled.slice(o * 10, o * 10 + 10);
    const flexible = chunk.filter((spec) => !fixedLength(spec)).slice(0, 2);
    const rest = chunk.filter((spec) => !flexible.includes(spec));
    return [...rest.slice(0, 4), ...flexible, ...rest.slice(4)];
  }).flat();
  const events: EventPlan[] = specs.map((spec, i) => {
    const organizer = organizers[Math.floor(i / 10)];
    const phase = PHASES_PER_ORGANIZER[i % 10];
    const { startDate, endDate } = makeDates(phase, spec.name, durationDays(spec.name));
    const maxTeamSize = weighted([3, 4, 5], (k) => ({ 3: 30, 4: 45, 5: 25 })[k] ?? 0);
    const createdAt =
      phase === "upcoming"
        ? at(dayFromToday(-between(2, 12)), between(10, 18))
        : phase === "registration"
          ? at(dayFromToday(-between(25, 40)), between(10, 18))
          : at(new Date(startDate.getTime() - between(30, 50) * DAY), between(10, 18));
    const updatedAt =
      phase === "finished"
        ? at(new Date(endDate.getTime() + between(4, 7) * DAY), between(11, 19))
        : phase === "judging"
          ? at(endDate, 18)
          : phase === "building"
            ? at(startDate, 10)
            : phase === "registration"
              ? at(dayFromToday(-between(15, 22)), between(10, 18))
              : createdAt;
    // Half the upcoming events (one per organizer) have no criteria yet.
    const withoutCriteria = phase === "upcoming" && i % 10 === 9;
    const description = makeDescription(spec, Math.round((endDate.getTime() - startDate.getTime()) / DAY) + 1, maxTeamSize);
    if (spec.name.length > 100 || description.length > 2000) throw new Error(`${spec.name}: name or description too long.`);
    return {
      id: newId(),
      spec,
      phase,
      organizer,
      startDate,
      endDate,
      createdAt,
      updatedAt,
      maxTeamSize,
      description,
      criteria: withoutCriteria ? [] : makeCriteria(spec.theme),
      registrants: [],
      regAt: new Map(),
      projects: { total: 0, offTheme: 0 },
    };
  });

  // How many events each participant joins: 0 to 6, about 2.6 on average.
  const target = new Map(participants.map((p) => [p.id, weighted([0, 1, 2, 3, 4, 5, 6], (n) => [8, 16, 24, 22, 16, 9, 5][n])]));
  const joined = new Map<string, EventPlan[]>(participants.map((p) => [p.id, []]));
  const overlaps = (a: EventPlan, b: EventPlan) => a.startDate <= b.endDate && b.startDate <= a.endDate;

  const regCount: Record<Phase, () => number> = {
    finished: () => between(40, 120),
    judging: () => between(40, 120),
    building: () => between(40, 100),
    registration: () => between(5, 60),
    upcoming: () => 0,
  };
  // The busiest constraint first: the building events all overlap each other.
  const order: Phase[] = ["building", "finished", "judging", "registration"];
  for (const phase of order) {
    for (const event of events.filter((e) => e.phase === phase)) {
      const wanted = regCount[phase]();
      const chosen = new Set<string>();
      const free = (p: Person, ignoreOverlap: boolean) =>
        (event.spec.audience !== "women" || p.female) &&
        !chosen.has(p.id) &&
        joined.get(p.id)!.length < 6 &&
        (ignoreOverlap || !joined.get(p.id)!.some((e) => overlaps(e, event)));
      const passes: [(p: Person) => boolean, (p: Person) => number][] = [
        [(p) => free(p, false) && joined.get(p.id)!.length < target.get(p.id)!, (p) => target.get(p.id)! - joined.get(p.id)!.length],
        [(p) => free(p, false), () => 1],
        [(p) => free(p, true), () => 1],
      ];
      for (const [eligible, weight] of passes) {
        while (chosen.size < wanted) {
          const pool = participants.filter(eligible);
          if (pool.length === 0) break;
          chosen.add(weighted(pool, weight).id);
        }
      }
      event.registrants = participants.filter((p) => chosen.has(p.id));
      for (const p of event.registrants) joined.get(p.id)!.push(event);
    }
  }

  // Registration times: after the event was announced, before it started (or
  // before today for events still taking registrations).
  for (const event of events) {
    const until = minDate(at(event.startDate, -24 + 20), at(TODAY, -2));
    for (const p of event.registrants) {
      event.regAt.set(p.id, between_(new Date(event.createdAt.getTime() + DAY), until));
    }
  }
  // Accounts exist before their first registration.
  for (const p of participants) {
    const regs = joined.get(p.id)!.map((e) => e.regAt.get(p.id)!);
    const first = regs.length > 0 ? new Date(Math.min(...regs.map((d) => d.getTime()))) : at(dayFromToday(-between(3, 120)), 12);
    p.createdAt = new Date(first.getTime() - between(1, 90) * DAY - randInt(10 * HOUR));
  }

  const usedCodes = new Set<string>();
  const inviteCode = () => {
    for (;;) {
      const code = generateInviteCode(randInt);
      if (!usedCodes.has(code)) {
        usedCodes.add(code);
        return code;
      }
    }
  };

  const teams: Prisma.TeamCreateManyInput[] = [];
  const members: Prisma.TeamMemberCreateManyInput[] = [];
  const submissions: Prisma.SubmissionCreateManyInput[] = [];
  const scores: Prisma.ScoreCreateManyInput[] = [];
  const registrations: Prisma.EventRegistrationCreateManyInput[] = [];
  const repoSlugs = new Set<string>();

  for (const event of events) {
    for (const p of event.registrants) {
      const createdAt = event.regAt.get(p.id)!;
      registrations.push({ id: newId(), eventId: event.id, userId: p.id, createdAt });
    }
    if (event.phase === "upcoming") continue;

    // Teams: about 85% of registrants (finished, judging), 80% (building), 40% (registration).
    const inTeams = {
      finished: 0.8 + rand() * 0.1,
      judging: 0.8 + rand() * 0.1,
      building: 0.75 + rand() * 0.1,
      registration: 0.3 + rand() * 0.2,
    }[event.phase];
    const pool = shuffle(event.registrants);
    let left = Math.round(pool.length * inTeams);
    const max = event.maxTeamSize;
    const sizeWeights =
      event.phase === "registration"
        ? [0, 30, 40, 20, 10, 5]
        : max === 3
          ? [0, 6, 30, 64]
          : max === 4
            ? [0, 4, 16, 36, 44]
            : [0, 3, 12, 25, 32, 28];
    const sizes = Array.from({ length: max }, (_, i) => i + 1);
    const groups: Person[][] = [];
    let cursor = 0;
    while (left > 0) {
      const size = Math.min(left, weighted(sizes, (s) => sizeWeights[s] ?? 0));
      groups.push(pool.slice(cursor, cursor + size));
      cursor += size;
      left -= size;
    }

    const names = [...shuffle(D.TEAM_NAMES)];
    const combos = shuffle(D.TEAM_ADJECTIVES.flatMap((a) => D.TEAM_NOUNS.map((n) => `${a} ${n}`)));
    const usedNames = new Set<string>();
    const teamName = () => {
      for (;;) {
        const name = (chance(0.6) && names.length > 0 ? names.pop() : combos.pop())!;
        if (!usedNames.has(name.toLowerCase())) {
          usedNames.add(name.toLowerCase());
          return name;
        }
      }
    };
    // Ideas are drawn without replacement from the event's own theme, so no
    // idea (and no title) repeats within an event. Every theme's pool is
    // larger than its busiest event; related themes are only a safety net,
    // and the invariants allow at most 10% off-theme projects per event.
    const themeIdeas = (theme: D.Theme) => {
      const own = D.THEME_IDEAS[theme].map((idea) => ({ ...idea, theme }));
      if (theme !== "ctf") return shuffle(own);
      const combos = D.CTF_CATEGORIES.flatMap((cat) =>
        D.CTF_DELIVERABLES.map((d) => ({ what: fill(d.what, { cat }), detail: fill(d.detail, { cat }), theme })),
      );
      return shuffle([...own, ...combos]);
    };
    const ideas = [
      ...themeIdeas(event.spec.theme),
      ...shuffle(D.RELATED_THEMES[event.spec.theme].flatMap((t) => D.THEME_IDEAS[t].map((idea) => ({ ...idea, theme: t })))),
    ].reverse(); // pop() takes from the end
    const usedProducts = new Set<string>();
    const productFor = (theme: D.Theme) => {
      const free = D.PRODUCTS.filter((p) => !usedProducts.has(p.name));
      const fitting = free.filter((p) => p.themes?.includes(theme));
      const generic = free.filter((p) => p.themes === null);
      const choice = pick(fitting.length > 0 && (generic.length === 0 || chance(0.6)) ? fitting : generic);
      usedProducts.add(choice.name);
      return choice.name;
    };

    const teamDeadline =
      event.phase === "registration" ? at(TODAY, -1) : at(event.startDate, 12);
    const submitShare = event.phase === "building" ? 0.35 + rand() * 0.1 : 0.8 + rand() * 0.1;
    const submitted: { id: string; quality: number }[] = [];

    for (const group of groups) {
      const creator = group[0];
      const teamId = newId();
      const name = teamName();
      const parsed = createTeamSchema.safeParse({ name });
      if (!parsed.success) throw new Error(`Team name "${name}" breaks the rules.`);
      const teamCreated = minDate(
        new Date(event.regAt.get(creator.id)!.getTime() + between(1, 48) * HOUR),
        teamDeadline,
      );
      teams.push({ id: teamId, eventId: event.id, name, inviteCode: inviteCode(), createdById: creator.id, createdAt: teamCreated, updatedAt: teamCreated });
      for (const [i, p] of group.entries()) {
        const joinedAt =
          i === 0
            ? teamCreated
            : maxDate(
                minDate(new Date(maxDate(teamCreated, event.regAt.get(p.id)!).getTime() + randInt(24 * HOUR)), teamDeadline),
                maxDate(teamCreated, event.regAt.get(p.id)!),
              );
        members.push({ id: newId(), teamId, eventId: event.id, userId: p.id, joinedAt });
      }

      if (event.phase === "registration" || !chance(submitShare)) continue;
      const idea = ideas.pop();
      if (!idea) throw new Error(`${event.spec.name} ran out of project ideas.`);
      const product = productFor(idea.theme);
      event.projects.total++;
      if (idea.theme !== event.spec.theme) event.projects.offTheme++;
      const teamSkills = shuffle([...new Set(group.flatMap((p) => p.skills))].filter((skill) => !D.SOFT_SKILLS.includes(skill))).slice(0, 3);
      const built = teamSkills.length > 1 ? `Built with ${teamSkills.slice(0, -1).join(", ")} and ${teamSkills.at(-1)}.` : "";
      const status = fill(pick(D.DEMO_STATUS_LINES), { n: between(6, 40) });
      const description = [idea.detail, [built, status].filter(Boolean).join(" ")].join("\n\n");
      const base = product.toLowerCase().replace(/['+]/g, "").replace(/[^a-z0-9]+/g, "-");
      let slug = `${base}${pick(["", "", "-app", "-web", "-bot", "-mvp"])}`;
      if (repoSlugs.has(`${creator.github}/${slug}`)) slug = `${base}-${event.spec.theme}`;
      if (repoSlugs.has(`${creator.github}/${slug}`)) slug = `${base}-${iso(event.startDate).slice(0, 4)}-${randInt(100)}`;
      repoSlugs.add(`${creator.github}/${slug}`);
      const submission = {
        title: `${product}: ${idea.what}`,
        description,
        repoUrl: `https://github.com/${creator.github}/${slug}`,
      };
      const ok = submissionSchema.safeParse(submission);
      if (!ok.success) throw new Error(`Submission "${submission.title}" breaks the rules: ${ok.error.issues[0].message}`);
      const lastSubmitDay = minDate(at(event.endDate, 14), at(TODAY, -1));
      const createdAt = between_(maxDate(at(event.startDate, 15), teamCreated), lastSubmitDay);
      submissions.push({ id: newId(), teamId, ...submission, createdAt, updatedAt: createdAt });
      submitted.push({ id: teamId, quality: clamp(0.62 + 0.16 * gauss(), 0.25, 0.97) });
    }

    // Scores: a panel of 3 to 5 judges per event. Judges 1-3 sit on more
    // panels, so the first judge in the summary has plenty to show.
    if (event.phase !== "finished" && event.phase !== "judging") continue;
    const panel: Person[] = [];
    const panelSize = weighted([3, 4, 5], (k) => ({ 3: 20, 4: 35, 5: 45 })[k] ?? 0);
    while (panel.length < panelSize) {
      const j = weighted(judges.filter((x) => !panel.includes(x)), (x) => (judges.indexOf(x) < 3 ? 4 : 1));
      panel.push(j);
    }
    const leniency = new Map(panel.map((j) => [j.id, (rand() - 0.5) * 0.14]));
    const firstScoreAt = at(event.endDate, 16);
    const lastScoreAt =
      event.phase === "finished" ? new Date(event.updatedAt.getTime() - 2 * HOUR) : minDate(at(TODAY, -1), new Date(firstScoreAt.getTime() + 5 * DAY));
    const scoredShare = event.phase === "judging" ? 0.3 + rand() * 0.5 : 1;
    for (const team of submitted) {
      if (!chance(scoredShare)) continue;
      const criterionOffset = new Map(event.criteria.map((c) => [c.id, (rand() - 0.5) * 0.16]));
      let anyScore = false;
      for (const [k, judge] of panel.entries()) {
        let criteria = event.criteria;
        if (event.phase === "judging") {
          const roll = rand();
          // Some judges have finished this team, some are part-way, some haven't started.
          if (roll < 0.18 && (anyScore || k < panel.length - 1)) continue;
          if (roll < 0.4) criteria = shuffle(criteria).slice(0, between(1, criteria.length - 1));
        }
        const when = between_(firstScoreAt, lastScoreAt);
        for (const c of criteria) {
          const raw = team.quality + leniency.get(judge.id)! + criterionOffset.get(c.id)! + (rand() - 0.5) * 0.12;
          const value = clamp(Math.round(clamp(raw, 0, 1) * c.maxScore), 0, c.maxScore);
          scores.push({ id: newId(), judgeId: judge.id, teamId: team.id, criterionId: c.id, value, createdAt: when, updatedAt: when });
          anyScore = true;
        }
      }
    }
  }

  const people = [...organizers, ...judges, ...participants];
  for (const p of people) checkProfile(p);
  return { organizers, judges, participants, people, events, registrations, teams, members, submissions, scores };
}

// ─── Write ───────────────────────────────────────────────────────────────────

async function insertInBatches<T>(rows: T[], insert: (batch: T[]) => Promise<unknown>, size = 1000) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

type Tx = Prisma.TransactionClient;

/** SQL checks run before commit; each query returns the offending rows. */
const INVARIANTS: { name: string; sql: string }[] = [
  {
    name: "criteria weights total 100 in every event that has criteria",
    sql: `SELECT event_id FROM criteria GROUP BY event_id HAVING SUM(weight_percent) <> 100`,
  },
  {
    name: "no team is over its event's max team size",
    sql: `SELECT t.id FROM teams t JOIN events e ON e.id = t.event_id JOIN team_members m ON m.team_id = t.id
          GROUP BY t.id, e.max_team_size HAVING COUNT(*) > e.max_team_size`,
  },
  {
    name: "every team's creator is one of its members",
    sql: `SELECT t.id FROM teams t WHERE NOT EXISTS (
            SELECT 1 FROM team_members m WHERE m.team_id = t.id AND m.user_id = t.created_by_id)`,
  },
  {
    name: "every team member is registered for the event",
    sql: `SELECT m.id FROM team_members m JOIN teams t ON t.id = m.team_id
          LEFT JOIN event_registrations r ON r.event_id = m.event_id AND r.user_id = m.user_id
          WHERE r.id IS NULL OR t.event_id <> m.event_id`,
  },
  {
    name: "only participants register or join teams",
    sql: `SELECT r.id FROM event_registrations r JOIN users u ON u.id = r.user_id WHERE u.role <> 'PARTICIPANT'`,
  },
  {
    name: "scores only for submitted teams, in events with submissions closed, by judges, on the event's criteria",
    sql: `SELECT s.id FROM scores s JOIN teams t ON t.id = s.team_id JOIN events e ON e.id = t.event_id
          JOIN criteria c ON c.id = s.criterion_id JOIN users u ON u.id = s.judge_id
          LEFT JOIN submissions sub ON sub.team_id = t.id
          WHERE sub.id IS NULL OR e.submissions_open OR c.event_id <> t.event_id OR u.role <> 'JUDGE'`,
  },
  {
    name: "every score is within 0..maxScore",
    sql: `SELECT s.id FROM scores s JOIN criteria c ON c.id = s.criterion_id WHERE s.value < 0 OR s.value > c.max_score`,
  },
  {
    name: "every published event meets the publish rules (submissions closed, a submission, criteria total 100)",
    sql: `SELECT e.id FROM events e WHERE e.results_published AND (
            e.submissions_open
            OR NOT EXISTS (SELECT 1 FROM teams t JOIN submissions s ON s.team_id = t.id WHERE t.event_id = e.id)
            OR COALESCE((SELECT SUM(weight_percent) FROM criteria c WHERE c.event_id = e.id), 0) <> 100)`,
  },
  {
    name: "emails are unique and lowercase",
    sql: `SELECT LOWER(email) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1
          UNION ALL SELECT email FROM users WHERE email <> LOWER(email)`,
  },
  {
    name: "phones are unique and stored as +998XXXXXXXXX",
    sql: `SELECT phone FROM profiles GROUP BY phone HAVING COUNT(*) > 1
          UNION ALL SELECT user_id FROM profiles WHERE phone IS NULL OR phone !~ '^\\+998[0-9]{9}$'`,
  },
  {
    name: "invite codes are unique",
    sql: `SELECT invite_code FROM teams GROUP BY invite_code HAVING COUNT(*) > 1`,
  },
  {
    name: "no project title or idea repeats within an event",
    sql: `SELECT t.event_id, s.title FROM submissions s JOIN teams t ON t.id = s.team_id
          GROUP BY t.event_id, s.title HAVING COUNT(*) > 1
          UNION ALL
          SELECT t.event_id, split_part(s.title, ': ', 2) FROM submissions s JOIN teams t ON t.id = s.team_id
          GROUP BY t.event_id, split_part(s.title, ': ', 2) HAVING COUNT(*) > 1`,
  },
  {
    name: "no bio names the same skill twice in one sentence",
    sql: `SELECT user_id FROM profiles
          WHERE bio ~ '(use|with|are|take the) ([A-Za-z.+# ]+?) (and|, and I am learning more|side of a project, with some) \\2( |\\.|,)'`,
  },
  {
    name: "every user has a profile",
    sql: `SELECT u.id FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE p.user_id IS NULL`,
  },
];

async function checkInvariants(tx: Tx, data: ReturnType<typeof build>) {
  const failures: string[] = [];
  for (const check of INVARIANTS) {
    const rows = await tx.$queryRawUnsafe<unknown[]>(check.sql);
    if (rows.length > 0) failures.push(`${check.name}: ${rows.length} row(s) break it`);
  }

  // The same rules the app uses, on the rows as stored.
  const now = at(TODAY, 12);
  const events = await tx.event.findMany({
    select: {
      id: true, name: true, createdById: true, endDate: true,
      registrationOpen: true, submissionsOpen: true, resultsPublished: true,
      criteria: { select: { weightPercent: true } },
      teams: { where: { submission: { isNot: null } }, select: { id: true }, take: 1 },
    },
  });
  const statusCount = new Map<string, number>();
  for (const e of events) {
    const hasSubmissions = e.teams.length > 0;
    const plan = data.events.find((p) => p.id === e.id)!;
    const status = eventStatus({ ...e, hasSubmissions }, now);
    if (status !== EXPECTED_STATUS[plan.phase]) failures.push(`${e.name}: shows as ${status}, expected ${EXPECTED_STATUS[plan.phase]}`);
    if (e.resultsPublished && publishBlocker({ ...e, resultsPublished: false }, e.criteria, hasSubmissions) !== null) {
      failures.push(`${e.name}: published without meeting publishBlocker`);
    }
    const key = `${e.createdById}:${plan.phase}`;
    statusCount.set(key, (statusCount.get(key) ?? 0) + 1);
  }
  for (const o of data.organizers) {
    for (const phase of new Set(PHASES_PER_ORGANIZER)) {
      if (statusCount.get(`${o.id}:${phase}`) !== 2) failures.push(`${o.email} does not have 2 ${phase} events`);
    }
  }
  // Live events are still live tomorrow: building events started at least a
  // day ago and every live event ends after today.
  for (const plan of data.events) {
    if (plan.phase === "building" && !(plan.startDate < TODAY && plan.endDate > TODAY)) {
      failures.push(`${plan.spec.name}: building but runs ${iso(plan.startDate)} to ${iso(plan.endDate)}`);
    }
    if (plan.phase === "registration" && !(plan.startDate > TODAY)) {
      failures.push(`${plan.spec.name}: taking registrations but starts ${iso(plan.startDate)}`);
    }
  }

  // Projects fit their event: at most 10% off-theme (the pools make it 0).
  const submittedPerEvent = new Map(
    (await tx.$queryRaw<{ event_id: string; n: bigint }[]>`
      SELECT t.event_id, COUNT(*) AS n FROM submissions s JOIN teams t ON t.id = s.team_id GROUP BY t.event_id`).map((r) => [r.event_id, Number(r.n)]),
  );
  for (const plan of data.events) {
    const { total, offTheme } = plan.projects;
    if ((submittedPerEvent.get(plan.id) ?? 0) !== total) failures.push(`${plan.spec.name}: submission count doesn't match the plan`);
    if (total > 0 && offTheme / total > 0.1) {
      failures.push(`${plan.spec.name}: ${offTheme} of ${total} projects are off-theme, over 10%`);
    }
  }

  // Women-only events: at least 90% of registrants are women (the seed registers only women).
  const female = new Map(data.people.map((p) => [p.id, p.female]));
  for (const plan of data.events.filter((e) => e.spec.audience === "women")) {
    const regs = await tx.eventRegistration.findMany({ where: { eventId: plan.id }, select: { userId: true } });
    const women = regs.filter((r) => female.get(r.userId)).length;
    if (regs.length > 0 && women / regs.length < 0.9) {
      failures.push(`${plan.spec.name}: ${women} of ${regs.length} registrants are women, under 90%`);
    }
  }

  const roles = await tx.user.groupBy({ by: ["role"], _count: true });
  const byRole = Object.fromEntries(roles.map((r) => [r.role, r._count]));
  if (byRole.ORGANIZER !== 5 || byRole.JUDGE !== 15 || byRole.PARTICIPANT !== 1000) {
    failures.push(`users by role are ${JSON.stringify(byRole)}, expected 5 / 15 / 1000`);
  }
  if (failures.length > 0) {
    throw new Error(`Invariant checks failed, rolling back:\n- ${failures.join("\n- ")}`);
  }
}

async function main() {
  const started = Date.now();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const target = new URL(url);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    console.log(`Database: ${db} on ${target.hostname}:${target.port || "5432"}`);
    const [users, events] = await Promise.all([prisma.user.count(), prisma.event.count()]);
    console.log(`It holds ${users} users and ${events} events.`);
    if (process.env.SHOWCASE_CONFIRM !== `wipe:${db}`) {
      console.error(`Refusing to run, so nothing was deleted. To wipe "${db}" and fill it with showcase data, set SHOWCASE_CONFIRM=wipe:${db}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Deleting all of it. Today is ${iso(TODAY)} (event dates are relative to it).`);

    const data = build();
    const passwordHash = await hashPassword(PASSWORD);

    await prisma.$transaction(
      async (tx) => {
        const tables = await tx.$queryRaw<{ tablename: string }[]>`
          SELECT tablename FROM pg_tables
          WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
        if (tables.length > 0) {
          const list = tables.map((t) => `"${t.tablename.replace(/"/g, '""')}"`).join(", ");
          await tx.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
        }

        await insertInBatches(data.people, (batch) =>
          tx.user.createMany({
            data: batch.map((p) => ({ id: p.id, email: p.email, passwordHash, role: p.role, createdAt: p.createdAt, updatedAt: p.createdAt })),
          }),
        );
        await insertInBatches(data.people, (batch) =>
          tx.profile.createMany({
            data: batch.map((p) => ({
              userId: p.id,
              name: `${p.first} ${p.last}`,
              faculty: p.faculty,
              skills: p.skills,
              bio: p.bio,
              links: p.links,
              phone: p.phone,
              updatedAt: new Date(p.createdAt.getTime() + 20 * 60 * 1000),
            })),
          }),
        );
        await tx.event.createMany({
          data: data.events.map((e) => ({
            id: e.id,
            name: e.spec.name,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            maxTeamSize: e.maxTeamSize,
            registrationOpen: e.phase === "registration",
            submissionsOpen: e.phase === "building",
            resultsPublished: e.phase === "finished",
            createdById: e.organizer.id,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          })),
        });
        await tx.criterion.createMany({
          data: data.events.flatMap((e) =>
            e.criteria.map((c) => ({ ...c, eventId: e.id, createdAt: new Date(e.createdAt.getTime() + HOUR) })),
          ),
        });
        await insertInBatches(data.registrations, (batch) => tx.eventRegistration.createMany({ data: batch }));
        await insertInBatches(data.teams, (batch) => tx.team.createMany({ data: batch }));
        await insertInBatches(data.members, (batch) => tx.teamMember.createMany({ data: batch }));
        await insertInBatches(data.submissions, (batch) => tx.submission.createMany({ data: batch }));
        await insertInBatches(data.scores, (batch) => tx.score.createMany({ data: batch }));

        await checkInvariants(tx, data);
      },
      { maxWait: 30_000, timeout: 10 * 60_000 },
    );

    await printSummary(prisma, data, started);
  } finally {
    await prisma.$disconnect();
  }
}

async function printSummary(prisma: PrismaClient, data: ReturnType<typeof build>, started: number) {
  const [registrations, teams, members, submissions, scores, criteria] = await Promise.all([
    prisma.eventRegistration.count(),
    prisma.team.count(),
    prisma.teamMember.count(),
    prisma.submission.count(),
    prisma.score.count(),
    prisma.criterion.count(),
  ]);
  const phases = new Map<Phase, number>();
  for (const e of data.events) phases.set(e.phase, (phases.get(e.phase) ?? 0) + 1);

  // A fingerprint of what a re-run must reproduce: emails, phones and team names.
  const rows = await prisma.$queryRaw<{ line: string }[]>`
    SELECT u.email || ' ' || COALESCE(p.phone, '') AS line FROM users u JOIN profiles p ON p.user_id = u.id
    UNION ALL SELECT e.name || ' / ' || t.name FROM teams t JOIN events e ON e.id = t.event_id
    ORDER BY 1`;
  const checksum = createHash("sha256").update(rows.map((r) => r.line).join("\n")).digest("hex").slice(0, 16);

  const line = (label: string, value: string | number) => console.log(`  ${label.padEnd(22)} ${value}`);
  console.log("\nShowcase data is in. Every account's password is 12345678i.\n");
  console.log("Users");
  line("organizers", data.organizers.length);
  line("judges", data.judges.length);
  line("participants", data.participants.length);
  console.log("Events");
  for (const phase of ["finished", "judging", "building", "registration", "upcoming"] as Phase[]) {
    line(phase, phases.get(phase) ?? 0);
  }
  console.log("Rows");
  line("criteria", criteria);
  line("registrations", registrations);
  line("teams", teams);
  line("team members", members);
  line("submissions", submissions);
  line("scores", scores);
  console.log("\nOrganizers (10 events each)");
  for (const o of data.organizers) console.log(`  ${o.email.padEnd(36)} ${o.first} ${o.last}`);
  console.log("\nJudges");
  for (const j of data.judges) console.log(`  ${j.email.padEnd(36)} ${j.first} ${j.last}`);
  // Participants worth logging in as: on a team in a live (building) event,
  // and in at least one other event, so My events has more than one card.
  console.log("\nSample participants (team in a live event)");
  const building = new Set(data.events.filter((e) => e.phase === "building").map((e) => e.id));
  const submittedTeams = new Set(data.submissions.map((s) => s.teamId));
  const teamOf = new Map(data.teams.map((t) => [t.id!, t]));
  const seenEvents = new Set<string>();
  const sample = data.members
    .filter((m) => building.has(m.eventId))
    .filter((m) => data.events.filter((e) => e.registrants.some((p) => p.id === m.userId)).length >= 2)
    .sort((a, b) => Number(submittedTeams.has(b.teamId)) - Number(submittedTeams.has(a.teamId)))
    .filter((m) => !seenEvents.has(m.eventId) && seenEvents.add(m.eventId))
    .slice(0, 5);
  for (const m of sample) {
    const p = data.participants.find((x) => x.id === m.userId)!;
    const team = teamOf.get(m.teamId)!;
    const event = data.events.find((e) => e.id === m.eventId)!;
    const count = data.events.filter((e) => e.registrants.includes(p)).length;
    const state = submittedTeams.has(m.teamId) ? "submitted" : "not submitted yet";
    console.log(`  ${p.email.padEnd(36)} ${p.first} ${p.last}: ${team.name} in ${event.spec.name} (${state}), ${count} events`);
  }
  console.log("\nProjects on theme (off-theme / submitted, per event)");
  const withProjects = data.events.filter((e) => e.projects.total > 0).sort((a, b) => b.projects.total - a.projects.total);
  for (const e of withProjects) {
    const { total, offTheme } = e.projects;
    console.log(`  ${e.spec.name.padEnd(32)} ${e.spec.theme.padEnd(9)} ${String(offTheme).padStart(2)} / ${String(total).padStart(2)}  ${Math.round((100 * offTheme) / total)}%`);
  }
  const offTotal = withProjects.reduce((sum, e) => sum + e.projects.offTheme, 0);
  const allTotal = withProjects.reduce((sum, e) => sum + e.projects.total, 0);
  console.log(`  ${"All events".padEnd(42)} ${String(offTotal).padStart(2)} / ${allTotal}  ${Math.round((100 * offTotal) / allTotal)}%`);
  console.log(`\nChecksum (emails, phones, team names): ${checksum}`);
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
