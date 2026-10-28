# 7. System design

## Purpose and status

[Architecture](03-architecture.md) names the stack and the logical data model. This document says how the code is built for the Oct 28 release: where
each kind of code goes, how a request travels from a page to the database, the Prisma schema with its constraints, how pages and forms are put
together, and how the app is tested and deployed. Screen contents and copy are in the [UI specification](08-ui-spec.md). Everything marked
**Decision** was confirmed by the PM on **26 Oct** (see [Scope decisions](02-scope-decisions.md#product-rules)). The release deadline moved to **Wed 28 Oct**.

---

## Backend

### Request flow

```
Read:   page.tsx (server component) ─▶ requireRole() ─▶ Prisma query (select only what's shown) ─▶ render
Write:  <form action> in a client component (useActionState)
          ─▶ server action in actions.ts
               1. requireRole(...)              lib/auth/dal.ts, re-reads the role from the DB
               2. schema.safeParse(formData)    lib/validation/<feature>.ts (zod)
               3. load the rows the rule needs  Prisma, in a transaction when several rows change
               4. check the rule                lib/domain/*.ts, pure functions
               5. write                         Prisma
               6. revalidatePath(...), then redirect(...) or return { ok: true }
```

Server actions are public HTTP endpoints. Anyone can call one with any arguments, including ids bound with `.bind(null, eventId)`. So every action
authorizes itself and checks that the ids exist and that the user may touch them. A check in the page or layout doesn't protect the action.

### Server action or route handler

| Use | When | Examples |
|---|---|---|
| **Server action** (`actions.ts` next to the page, `"use server"`) | Every mutation from our own UI: forms, switches, buttons | register, save profile, create team, save scores, publish results |
| **Route handler** (`app/api/**/route.ts`) | Only when something other than our UI calls the server | `api/auth/[...nextauth]` (exists), `api/health` for the deploy smoke test (#28) |
| **Route handler, uploads** (`app/uploads/[...path]/route.ts`) | A deliberate exception: serving a stored file needs a GET handler | Event logos and header images; see Uploads below |

**Uploads (event images).** The event form's actions take a logo and a header image (`src/lib/uploads`). The file
type is checked by its first bytes (PNG, JPEG or WebP), up to 5 MB, then `sharp` crops it to cover and stores a WebP:
512 × 512 for the logo, 1600 × 600 for the banner, as `events/<eventId>/<kind>-<random>.webp` under `UPLOAD_DIR`.
`Event.logoPath` / `bannerPath` hold that relative path, and `eventImageUrl(path)` (`src/lib/uploads/url.ts`) turns it
into `/uploads/<path>`. The GET handler resolves the path safely: every segment must be plain (no `..`, `.`, hidden or
absolute parts) and inside `UPLOAD_DIR`, only `.webp` is served, and anything else is a 404. Names are random and never
reused, so responses are `Cache-Control: public, max-age=31536000, immutable`. A replaced or removed image's old file
is deleted after the database update succeeds. Server actions accept bodies up to 12 MB (`next.config.ts`), and nginx
allows the same.

Reads never go through an action or API route: a page reads with Prisma directly. A read used by more than one page (for example the ranking inputs,
used by the organizer preview and the public event page) goes in `src/lib/queries/<feature>.ts`, which starts with `import "server-only"`.

### `lib/auth`: the authorization layer

`src/lib/auth/dal.ts` is the only place that turns a session into a user:

```ts
import "server-only"; // plus cache (react), redirect (next/navigation), auth (@/auth), prisma, Role, ROLE_HOME

export const getCurrentUser = cache(async () => {   // one indexed query per request
  const id = (await auth())?.user?.id;
  return id ? prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } }) : null;
});
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();                  // the role comes from the database, never the JWT
  if (!roles.includes(user.role)) redirect(`${ROLE_HOME[user.role]}?notice=no-access`);
  return user;
}
```

- **Decision 8.** The role is re-read on every request, so a role change works without logging in again. The JWT role is only used for the
  landing redirect after login. `src/auth.ts` needs one change for this: the `session` callback also copies `token.sub` to `session.user.id`.
- A wrong role lands on the role home, which shows the UI spec's "You don't have access to that page." toast for `?notice=no-access`. React `cache()`
  dedupes within one render only; in actions it does nothing, which is fine.
- `redirect()` and `notFound()` work by throwing. Never call them inside a `try` whose `catch` swallows everything.
- Data-dependent guards sit next to these: `requireEvent(eventId)` (unknown id → `notFound()`) and `requireTeamMember(eventId)` (returns the user's
  team in that event, or redirects to the team page).
- `src/lib/auth/permissions.ts` encodes the [permission matrix](03-architecture.md#permission-matrix) as data: `PERMISSIONS: Record<Action, Role[]>`,
  `can(role, action)` and `ROLE_HOME`. The UI uses `can()` to choose which actions and nav items to show; proxy imports `ROLE_HOME`.
  `permissions.test.ts` checks it row by row against docs/03 (TC-73). Server code calls `requireRole` with explicit roles, so every guard can be found
  with a search.
- Add the guard package: `npm i server-only`. A client component importing `dal.ts` then fails the build.

### Validation

- **zod isn't a dependency yet** (it's only in `node_modules` through ESLint and shadcn). Add it: `npm i zod` (v4).
- One schema per form in `src/lib/validation/<feature>.ts`. The action parses with it; the client component may run the same schema before submitting
  for instant feedback, but the server result is the one that counts.
- Field rules (lengths, ranges, messages) come from the UI spec. Normalise in the schema: `.trim()` text, `.toLowerCase()` emails,
  `z.coerce.number().int()` numbers, `"YYYY-MM-DD"` to a `Date` at UTC midnight.
- Rules that need several rows or the database (weights total 100, team not full) live in `lib/domain` and the action.

### One result shape for every action

```ts
// src/lib/action-state.ts
export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string; values?: Record<string, string> }
  | null;                                                  // initial state for useActionState
export class RuleError extends Error {}                   // a product rule said no; the message is shown
export function fromZodError(e: z.ZodError): ActionState  // { ok: false, fieldErrors: z.flattenError(e).fieldErrors }
export function isUniqueViolation(e: unknown): boolean    // Prisma.PrismaClientKnownRequestError with code P2002
```

Every action is `(prev: ActionState, formData: FormData) => Promise<ActionState>`, with any bound ids in front. On success it redirects or returns
`{ ok: true }` and the client shows the toast from the UI spec. React resets an uncontrolled form when the action finishes, even after a failure, so a
failed result also returns `values` (the submitted strings) for the inputs' `defaultValue`.

### Error handling

| Kind | Example | The action |
|---|---|---|
| Invalid input | weight 120, bad URL | returns `fromZodError(...)`: errors next to the fields |
| Rule violation | registration closed, team full, criteria locked | throws `RuleError` inside the transaction, catches it at the end, returns `{ ok: false, formError }` |
| Race on a unique constraint | double-click on Register | catches `isUniqueViolation(e)`, returns the same message as the rule check |
| Unknown id | `/judge/teams/abc` | `notFound()` → `not-found.tsx` |
| Anything else | database down | lets it throw: `error.tsx` shows a generic message, the server log has the stack |

Never send raw error messages or Prisma codes to the client.

### Transactions

Use an interactive `prisma.$transaction(async (tx) => …)` whenever a rule reads rows and then writes based on them.

| Operation | Inside the transaction |
|---|---|
| **Save criteria** (#10) | `SELECT … FROM events WHERE id = $1 FOR UPDATE` first, so a judge's score save can't commit between the check and the delete (as built, `lib/transactions/save-criteria.ts`). Any score for the event → `RuleError` (locked, Decision 6). `validateCriteria(list)` (weights total 100). `deleteMany` the event's criteria, `createMany` the new list, so a half-saved total is never visible |
| **Create team** (#6) | Registered, not on a team. Create the team with a new invite code, then the creator's `TeamMember` with scalar ids. On a P2002 on `invite_code`, retry up to 3 times |
| **Join team** (#6) | `SELECT id FROM teams WHERE id = $1 FOR UPDATE` (`tx.$queryRaw`) so two people can't take the last place. Then: registered, not on a team, team hasn't submitted, members < `maxTeamSize` (Decision 4) |
| **Leave team** (#6) | Lock the team row. No submission yet (Decision 9). Delete the membership; if no members are left, delete the team |
| **Submit project** (#7) | `FOR SHARE` on the event row, so "close submissions" can't slip in. `canSubmit(event)`, then upsert on `teamId` (one submission per team) |
| **Save scores** (#8) | `FOR SHARE` on the event row, which serializes with Save criteria and Publish results (both `FOR UPDATE`). Event in judging (Decision 2), team has a submission, criteria belong to the event. Upsert each filled score; delete this judge's score only for a criterion submitted blank. Input that isn't a whole number in range is refused, never treated as blank |
| **Change role** (#13) | `FOR UPDATE` on the target user row. Target isn't on any team (Decision 11) and isn't an organizer. Update the role |
| **Switches and publish** (#12) | `FOR UPDATE` on the event row, then the rule from `lib/domain/event-switches.ts` |
| **Edit event** (#9) | `SELECT … FROM teams WHERE event_id = $1 FOR UPDATE`, so nobody joins while the size is checked. New `maxTeamSize` isn't below the largest current team |

Publishing results (#12) is a single update of `resultsPublished` under the event row lock; the scoring rules read that flag.

**Known gap (after the release):** Create and Join team check the participant's role before their transaction, so a join
that starts just before an organizer makes that user a judge can still commit. The fix is to take `FOR SHARE` on the
user row and re-check the role inside the team transaction. Logged in the [test report](06-test-report.md#bug-log).

### `lib/domain`: the rules as pure functions

No Prisma and no Next.js imports, so they run in Vitest in milliseconds. Each file has a `.test.ts` next to it, and actions call these instead of
re-implementing a rule inline.

| File | Exports | Rules |
|---|---|---|
| `ranking.ts` | `rankTeams({ criteria, teams, scores })` | Teams without a submission aren't ranked. Per criterion: average of the judges who scored it ÷ `maxScore`; nobody scored → 0. Total = Σ weight × normalized (0–100). Tie-break by criteria in weight order; still tied → shared rank (1, 2, 2, 4). Compare totals rounded to 6 decimals ([docs/03](03-architecture.md#ranking-calculation), Decision 10) |
| `criteria.ts` | `validateCriteria`, `isCriteriaLocked` | At least one criterion, unique names, weights whole 1–100 totalling exactly 100, `maxScore` ≥ 1 (Decision 6) |
| `event-state.ts` | `canRegister`, `canSubmit`, `canScore`, `isListed`, `validateEventDates` | Register: `registrationOpen`. Submit: `submissionsOpen`, not published. Score: submissions closed, not published (Decision 2). Listed on `/events`: `registrationOpen` (Decision 5). End date not before start date |
| `teams.ts` | `canJoin`, `canLeave` | Not on another team in the event, team not full, team hasn't submitted (Decisions 4, 9) |
| `invite-code.ts` | `generateInviteCode(random)`, `normalizeInviteCode` | 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I); input trimmed and upper-cased. Tests pass a fixed random source; production passes `crypto.randomInt` |

### What `src/proxy.ts` may and may not do

Next.js 16 renamed middleware to proxy (`src/proxy.ts`, Node.js runtime). The bundled guide
(`node_modules/next/dist/docs/01-app/02-guides/authentication.md`) says proxy is for optimistic checks only.

| May | May not |
|---|---|
| Read the session cookie: `export default auth((req) => …)` from `@/auth` | Query the database |
| Signed out on `/my-events`, `/profile*`, `/events/*/team*`, `/judge*`, `/organizer*` → `/login?callbackUrl=<path>` | Redirect by role. A stale JWT role would bounce a judge promoted a minute ago from `/judge` (S-3). Role checks belong to `requireRole` |
| Signed in on `/login` or `/register` → `ROLE_HOME[role]` | Be the only check. Every page and action still calls `requireRole` |
| | Write the session cookie. Auth.js re-issues it on every read, so a prefetch that lands after log out would sign the user back in. `withoutSessionCookie` (`lib/auth/session-cookie.ts`) drops it; only log in and log out set it, and a session lasts 30 days from log in |

The matcher skips `api`, `_next/static`, `_next/image` and files with an extension.

---

## Database

### Prisma schema v1

The whole schema for the "Data model v1" card: every entity in [docs/03](03-architecture.md#data-model), plus `Event.maxTeamSize` and
`Team.inviteCode` (Decision 4). Checked with `npx prisma validate` on Prisma 7.10.1.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  PARTICIPANT
  JUDGE
  ORGANIZER
}

model User {
  id               String              @id @default(cuid())
  email            String              @unique /// stored lowercased
  passwordHash     String              @map("password_hash")
  role             Role                @default(PARTICIPANT)
  createdAt        DateTime            @default(now()) @map("created_at")
  updatedAt        DateTime            @updatedAt @map("updated_at")
  profile          Profile?
  eventsCreated    Event[]             @relation("EventCreatedBy")
  registrations    EventRegistration[]
  teamsCreated     Team[]              @relation("TeamCreatedBy")
  memberships      TeamMember[]
  judgeAssignments JudgeAssignment[]
  scores           Score[]
  comments         Comment[]

  @@map("users")
}

model Profile {
  userId    String   @id @map("user_id")
  name      String
  faculty   String
  skills    String[]
  bio       String?
  links     String[]
  updatedAt DateTime @updatedAt @map("updated_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Event {
  id               String              @id @default(cuid())
  name             String
  description      String
  startDate        DateTime            @map("start_date") @db.Date
  endDate          DateTime            @map("end_date") @db.Date
  maxTeamSize      Int                 @default(4) @map("max_team_size")
  registrationOpen Boolean             @default(false) @map("registration_open")
  submissionsOpen  Boolean             @default(false) @map("submissions_open")
  resultsPublished Boolean             @default(false) @map("results_published")
  createdById      String              @map("created_by_id")
  createdAt        DateTime            @default(now()) @map("created_at")
  updatedAt        DateTime            @updatedAt @map("updated_at")
  createdBy        User                @relation("EventCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  scheduleItems    ScheduleItem[]
  brief            Brief?
  registrations    EventRegistration[]
  teams            Team[]
  members          TeamMember[]
  criteria         Criterion[]

  @@index([registrationOpen, startDate])
  @@map("events")
}

model ScheduleItem {
  id       String   @id @default(cuid())
  eventId  String   @map("event_id")
  startsAt DateTime @map("starts_at") @db.Timestamptz(3)
  title    String
  event    Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, startsAt])
  @@map("schedule_items")
}

model Brief {
  eventId   String   @id @map("event_id")
  text      String
  updatedAt DateTime @updatedAt @map("updated_at")
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@map("briefs")
}

model EventRegistration {
  id         String      @id @default(cuid())
  userId     String      @map("user_id")
  eventId    String      @map("event_id")
  createdAt  DateTime    @default(now()) @map("created_at")
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  membership TeamMember?

  @@unique([eventId, userId])
  @@index([userId])
  @@map("event_registrations")
}

model Team {
  id               String            @id @default(cuid())
  eventId          String            @map("event_id")
  name             String
  inviteCode       String            @unique @map("invite_code") @db.Char(6)
  createdById      String            @map("created_by_id")
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")
  event            Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdBy        User              @relation("TeamCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  members          TeamMember[]
  submission       Submission?
  judgeAssignments JudgeAssignment[]
  scores           Score[]
  comments         Comment[]

  @@unique([eventId, name])
  @@unique([id, eventId]) // target of TeamMember's (team_id, event_id) foreign key
  @@map("teams")
}

/// event_id is copied from the team so "one team per event" is a unique index.
model TeamMember {
  id           String            @id @default(cuid())
  teamId       String            @map("team_id")
  eventId      String            @map("event_id")
  userId       String            @map("user_id")
  teamRole     String?           @map("team_role") /// P7, Could have; unused in the Oct 28 release
  joinedAt     DateTime          @default(now()) @map("joined_at")
  team         Team              @relation(fields: [teamId, eventId], references: [id, eventId], onDelete: Cascade)
  event        Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  registration EventRegistration @relation(fields: [eventId, userId], references: [eventId, userId], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([teamId])
  @@map("team_members")
}

model Submission {
  id          String   @id @default(cuid())
  teamId      String   @unique @map("team_id")
  title       String
  description String
  repoUrl     String   @map("repo_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@map("submissions")
}

model Criterion {
  id            String   @id @default(cuid())
  eventId       String   @map("event_id")
  name          String
  weightPercent Int      @map("weight_percent")
  maxScore      Int      @default(10) @map("max_score")
  createdAt     DateTime @default(now()) @map("created_at")
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  scores        Score[]

  @@unique([eventId, name])
  @@map("criteria")
}

/// Kept for auto-assign (#19). Not read or written in the Oct 28 release (decision 1).
model JudgeAssignment {
  id        String   @id @default(cuid())
  judgeId   String   @map("judge_id")
  teamId    String   @map("team_id")
  createdAt DateTime @default(now()) @map("created_at")
  judge     User     @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([judgeId, teamId])
  @@index([teamId])
  @@map("judge_assignments")
}

model Score {
  id          String    @id @default(cuid())
  judgeId     String    @map("judge_id")
  teamId      String    @map("team_id")
  criterionId String    @map("criterion_id")
  value       Int
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  judge       User      @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  team        Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  criterion   Criterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)

  @@unique([judgeId, teamId, criterionId])
  @@index([teamId])
  @@index([criterionId])
  @@map("scores")
}

/// #17, out of scope for the Oct 28 release.
model Comment {
  id        String   @id @default(cuid())
  judgeId   String   @map("judge_id")
  teamId    String   @map("team_id")
  text      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  judge     User     @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@map("comments")
}
```

- **Naming.** camelCase in TypeScript, snake_case tables and columns through `@@map`/`@map`, as in `User` today. The `init` migration stays; v1 is one
  new migration on top. `startDate`/`endDate` are date-only; timestamps are UTC, shown in GMT+5 (UI spec).
- **Two composite foreign keys.** `team_members(team_id, event_id) → teams(id, event_id)` keeps a member's `eventId` equal to the team's, so
  `@@unique([eventId, userId])` really is "one team per event". `team_members(event_id, user_id) → event_registrations(event_id, user_id)` lets only
  registered users be members (TC-16). Because these fields are shared by several relations, create `TeamMember` rows with scalar ids, not nested
  `connect`.
- **Delete behaviour.** Everything under an event cascades from it, and everything under a team from the team, so "last member leaves → delete the
  team" is one `delete`. Rows owned by a user cascade from the user (no delete-user or delete-event feature exists; these paths are for cleanup and
  tests). `Event.createdBy` and `Team.createdBy` are `Restrict`.
- **Out of scope tables.** `ScheduleItem`, `Brief` (#14), `JudgeAssignment` (#19), `Comment` (#17) and `TeamMember.teamRole` (#31) exist so later
  cards only add code. Nothing reads or writes them in the Oct 28 release.

### Where each rule is enforced

| Rule | Where | How |
|---|---|---|
| Email unique, stored lowercased | DB + code | unique `users.email`; register and `authorize` both lowercase |
| Register once per event (TC-39) | DB | unique `(event_id, user_id)`; the action catches P2002 |
| Only registered users join a team (TC-16) | DB + code | composite FK to `event_registrations`; the action checks first for a clear message |
| One team per event (TC-17) | DB | unique `team_members(event_id, user_id)` + composite FK to `teams(id, event_id)` |
| Team name per event, invite code, criterion name per event unique | DB | unique indexes |
| One submission per team (TC-66), one score per judge × team × criterion | DB | unique indexes; the actions upsert |
| End ≥ start, `maxTeamSize` ≥ 1, `maxScore` ≥ 1, weight 1–100, score ≥ 0 | code + CHECK | zod, plus CHECK constraints in the v1 migration |
| Team not full; leave only before submitting; last member deletes the team | code | transaction with a row lock |
| Weights total 100; criteria locked once scored | code | `lib/domain/criteria.ts` in the save transaction |
| Score ≤ the criterion's `maxScore`; criterion from the team's event | code | the action validates against the event's criteria |
| Register / submit / score only in the right event state | code | `lib/domain/event-state.ts` |
| Role change only when not on a team | code | transaction in the role action |

### Migration workflow

1. **One owner for v1.** Abdurauf owns "Data model v1" (Tue 27). He copies the schema above into `prisma/schema.prisma`, runs
   `npx prisma migrate dev --create-only --name data_model_v1`, appends the CHECK constraints to the generated `migration.sql`, and applies it with
   `npx prisma migrate dev`:
   ```sql
   ALTER TABLE "events" ADD CONSTRAINT "events_dates_check" CHECK ("end_date" >= "start_date");
   ALTER TABLE "events" ADD CONSTRAINT "events_max_team_size_check" CHECK ("max_team_size" >= 1);
   ALTER TABLE "criteria" ADD CONSTRAINT "criteria_weight_check" CHECK ("weight_percent" BETWEEN 1 AND 100);
   ALTER TABLE "criteria" ADD CONSTRAINT "criteria_max_score_check" CHECK ("max_score" >= 1);
   ALTER TABLE "scores" ADD CONSTRAINT "scores_value_check" CHECK ("value" >= 0);
   ```
   The PR holds the schema, this migration, the seed, the config change and the shadcn components (below). It merges before any feature branch touches
   `schema.prisma`.
2. **After v1, feature PRs only add**: nullable columns or new tables, one migration per PR, named after the card. No renames or drops this week; if
   one is unavoidable, the schema owner does it.
3. **Conflicts.** If `master` gained a migration while your branch was open: merge `master`, delete your branch's migration folder, run
   `npx prisma migrate dev --name <same name>` to regenerate it on top, and commit. Never edit a migration that is on `master`. Locally,
   `npx prisma migrate reset --force && npx prisma db seed` gives a clean database.

### Seed

`prisma/seed.ts` upserts by email, so it is safe to run on every deploy.

- `SEED_ORGANIZER_EMAIL`, `SEED_ORGANIZER_PASSWORD` (every environment, added to `.env.example`): the first organizer (Decision 7). The seed fails if
  either is missing or the password is under 8 characters.
- `SEED_DEMO_USERS=true` and `SEED_DEMO_PASSWORD` (local and CI only, never production): also create one judge and three participants with
  `@hackhub.test` addresses, for e2e and manual testing.
- The seed builds its own client with the `PrismaPg` adapter (as `src/lib/prisma.ts` does) and hashes with `hashPassword` from `src/lib/password.ts`,
  using relative imports.
- Wire it into `prisma7.config.ts`: `migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" }`, and `npm i -D tsx`. Prisma 7 doesn't seed
  after `migrate dev` or `migrate reset`: run `npx prisma db seed` yourself.

---

## Frontend

### `src/` layout

The review's layout (S-2), adapted to the route map. Each page's card is on the right.

```
src/
  proxy.ts                                         optimistic redirects only
  app/
    layout.tsx  not-found.tsx  error.tsx           <html>, fonts, <SiteHeader/> in <Suspense>, <Toaster/>
    (public)/  loading.tsx  page.tsx (/ #26)  events/page.tsx (#5)  events/[eventId]/{page,actions} (#5 #16)
    (auth)/    layout.tsx (centred card)  login/{page,actions}  register/{page,actions}       #3
    (app)/     loading.tsx  my-events/ (#5)  profile/ and profile/[userId]/ (#4)
               events/[eventId]/team/{page,actions} (#6)  events/[eventId]/team/submit/{page,actions} (#7)
    judge/     layout.tsx  loading.tsx  page.tsx  teams/[teamId]/{page,actions}               #8
    organizer/ layout.tsx  loading.tsx  page.tsx (#9)  users/ (#13)  events/new/ (#9)
               events/[eventId]/layout.tsx         event name, status badges, sub-nav
               events/[eventId]/{page,actions}     overview + switches (#12)
               events/[eventId]/{edit,criteria,participants,ranking}/   #9 #10 #11 #16 (+ publish, #12)
    api/auth/[...nextauth]/route.ts  api/health/route.ts
  components/  ui/ (shadcn, generated)  layout/ (SiteHeader, UserMenu, MobileNav, nav-items.ts)  events/ teams/ judging/ organizer/
  lib/         prisma.ts password.ts utils.ts action-state.ts  auth/{dal,permissions}.ts  domain/  validation/  queries/
prisma/seed.ts
e2e/           {auth,participant,judge,organizer,permissions}.spec.ts  fixtures/
```

### Route groups, real prefixes and layouts

- `(public)`, `(auth)` and `(app)` are route groups: they choose a layout and a `loading.tsx` and don't appear in the URL. `(app)` means "signed in",
  not "participant", because `/profile` is for every role.
- Judge and organizer pages use real `/judge` and `/organizer` prefixes, so no two groups own the same URL. `/events/[eventId]` (in `(public)`) and
  `/events/[eventId]/team` (in `(app)`) were checked with a test build of this tree on Next 16.4.2: they don't collide.
- `app/layout.tsx` renders `<SiteHeader>` inside `<Suspense>`. It reads the current user and shows the nav for signed out, participant, judge or
  organizer (the UI spec's App shell table, kept in `components/layout/nav-items.ts`); on phone the items move into a `Sheet`.
  `organizer/events/[eventId]/layout.tsx` adds the event sub-nav: Overview, Edit, Criteria, Participants, Ranking.
- A layout is never the authorization check: layouts don't re-render on client navigation. Every `page.tsx` calls `requireRole` or `requireUser`
  itself, even under `judge/` and `organizer/`.

### Server components by default

- Pages, layouts and lists are server components. They read with Prisma and pass plain data down.
- `"use client"` only where state or browser events are needed: forms (`useActionState`), switches, the copy-code button, the mobile menu, confirm
  dialogs. Keep those leaves small. They never import `dal.ts`, `prisma.ts` or `lib/queries`.
- **Cache Components is on** (`cacheComponents: true` in `next.config.ts`). Reading the session, `params` or the database outside `<Suspense>` fails
  the build. So every area has a `loading.tsx`, which wraps its pages in Suspense (the test build failed without it and passed with it). Layouts never
  `await` the session at top level. Public pages that query without reading `params` call `await connection()` (from `next/server`) first, so the
  query never runs at build time. No `"use cache"` this week.

### The form pattern

```tsx
"use client"; // criteria-form.tsx; the page renders <CriteriaForm action={saveCriteria.bind(null, eventId)} initial={criteria} />
export function CriteriaForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => { if (state?.ok) toast.success("Criteria saved."); }, [state]);
  return (
    <form action={formAction}>
      {state?.ok === false && state.formError && <Alert variant="destructive">{state.formError}</Alert>}
      {/* each row: <Field>, <FieldLabel>, <Input aria-invalid defaultValue=…>, <FieldError> from state.fieldErrors */}
      <Button type="submit" disabled={pending}>Save criteria</Button>
    </form>
  );
}
```

### shadcn/ui components

`button` and `card` are installed. The rest are added once, in the "Data model v1" PR, so feature branches don't each add them. Never hand-edit
`components/ui/*`; wrap a component in `components/<feature>/` instead.

```bash
npx shadcn@latest add input label textarea field select switch badge table tabs alert alert-dialog \
  dropdown-menu sheet skeleton sonner separator empty
```

### Loading, empty and error states

| State | How |
|---|---|
| Loading | `loading.tsx` per area, built from `Skeleton` in the shape of the page |
| Empty | `Empty` with the sentence and next action from the UI spec |
| Not found | `notFound()` for unknown event, team or user ids → `app/not-found.tsx` |
| Unexpected error | `app/error.tsx` (client component, "Try again" calls `reset()`) |
| Rule refusal | not an error: the action returns `formError`, shown in an `Alert` |

### Responsive rule of thumb and the style guide

- Mobile first: write the phone layout with plain classes, then add `md:` and `lg:`. Phone (390 px) and desktop are both supported. Tables use the UI
  spec's phone fallback below `md`. Nothing scrolls sideways. Touch targets are at least 44 px on phone.
- Build with shadcn defaults and theme tokens only (`bg-primary`, `text-muted-foreground`, `rounded-lg`), never raw colours. The designer's style
  guide (#46) arrives as values for the CSS variables in `src/app/globals.css` (`--primary`, `--radius`, …). On Wednesday afternoon it's applied by editing `:root`
  there and the font in `app/layout.tsx`.

---

## Cross-cutting

### Auth and session flow

1. **Register**: zod checks the email and a password of at least 8 characters plus its confirmation (Decision 8); the email is lowercased;
   `hashPassword`, `user.create` (P2002 → "already registered", TC-46); then `signIn("credentials", { email, password, redirect: false })` and
   `redirect("/profile?notice=account-created")`, which shows the "Account created…" toast.
2. **Log in**: the action calls `signIn("credentials", { email, password, redirect: false })`. A wrong email or password raises
   `CredentialsSignin`, which becomes one `formError` that doesn't say which part was wrong. Any other `AuthError` (for example `authorize()`
   failing because the database is down) is rethrown to `error.tsx`. On success it redirects to the `callbackUrl` (only if it is a same-site
   path) or to `ROLE_HOME` for the user's role.
3. **Session**: a JWT cookie with `sub` (the user id) and `role`. The id identifies the user; the role is only used for redirects.
4. **Each request**: proxy redirects signed-out users from protected paths; the page or action calls `requireRole`, which reads the current role from
   the database.
5. **Log out**: an action calling `signOut({ redirectTo: "/" })`.

### Permission matrix as `requireRole` calls

| Route | Page guard | Action guards and extra checks |
|---|---|---|
| `/`, `/events`, `/events/[eventId]` | none | register: `requireRole("PARTICIPANT")`, `canRegister`. Ranking shown only if `resultsPublished` |
| `/login`, `/register` | none | none |
| `/my-events` | `requireRole("PARTICIPANT")` | — |
| `/profile` | `requireUser()` | save: `requireUser()`; the user id comes from the session, never the form |
| `/profile/[userId]` | `requireUser()` | read-only (Decision 12) |
| `/events/[eventId]/team` | `requireRole("PARTICIPANT")` | create/join/leave: same, registered for the event, `canJoin`/`canLeave` |
| `/events/[eventId]/team/submit` | `requireRole("PARTICIPANT")`, `requireTeamMember` | submit: same, plus `canSubmit` |
| `/judge` | `requireRole("JUDGE")` | — (every judge sees every event in judging, Decision 1) |
| `/judge/teams/[teamId]` | `requireRole("JUDGE")` | save scores: same, `canScore`, team has a submission |
| `/organizer/**` | `requireRole("ORGANIZER")` on every page | every action: `requireRole("ORGANIZER")` |
| `/organizer/events/[eventId]/**` | `requireOwnedEvent(eventId)`: the organizer who created the event, else not-found | every action: `requireOwnedEvent(eventId)` before any write |
| `/organizer/users` | `requireRole("ORGANIZER")`; a phone only for people registered for one of the organizer's events | change role: target not on a team, not an organizer (Decision 11) |

Participants see their own team's submission on the team page (Decision 12). `/organizer` lists only the events the signed-in organizer created (`createdById`), and so does an
organizer's event chip menu. Access follows the same rule: every page and action under `/organizer/events/[eventId]` calls
`requireOwnedEvent(eventId)`, so another organizer's event gets the not-found page, by URL or by posting to its actions.
This is the interim rule until organizations let several organizers share an event.

### Testing

| Level | File | docs/06 cases |
|---|---|---|
| Unit | `lib/domain/ranking.test.ts` | TC-05, TC-101, TC-102, TC-105, Decision 10's edge cases |
| Unit | `lib/domain/{criteria,event-state,teams,invite-code}.test.ts` | TC-60, TC-61, TC-63 · TC-24, TC-29, TC-35, TC-67, TC-71 · TC-17, TC-22, max size · code format |
| Unit | `lib/validation/*.test.ts`, `lib/auth/permissions.test.ts` | TC-45, TC-65, TC-70 · TC-73 |
| E2E | `e2e/auth.spec.ts` | TC-44 – TC-51 |
| E2E | `e2e/participant.spec.ts` | TC-09 – TC-22, TC-34, TC-36 – TC-43, TC-64 – TC-69, TC-104 |
| E2E | `e2e/organizer.spec.ts` | TC-23 – TC-32, TC-52 – TC-54, TC-56, TC-58 – TC-62, TC-76, TC-103, TC-106 |
| E2E | `e2e/judge.spec.ts` | TC-01 – TC-04, TC-06, TC-07, TC-93 – TC-95 (TC-03 as reworded for Decision 1) |
| E2E | `e2e/permissions.spec.ts` | TC-08, TC-26, TC-30, TC-33, TC-55, TC-57, TC-74, TC-75, TC-77, and the new S-3 case: after the organizer makes a user a judge, `/judge` works without logging in again |

- **Seeded users per role.** The seed with `SEED_DEMO_USERS=true` gives one organizer, one judge and three participants. `e2e/fixtures/` logs in once
  per role and saves the storage state to `e2e/.auth/<role>.json` (gitignored). Each spec creates its own event with a unique name, so specs don't
  depend on each other.
- Before the QA pass (#27): reset and seed the database, `npx playwright install chromium`, `npm run test:e2e`.
- Not automated for the Oct 28 release: the out-of-scope sections (#14, #15, #17, #19, #31) and the phone checks TC-107 – TC-110, which are done by
  hand during the style pass (#26).

### CI

- **Now** (`.github/workflows/ci.yml`, on PRs and pushes to `master`): lint, typecheck, unit tests, build with dummy env vars. The build has no
  database, which is one more reason for the `loading.tsx` and `connection()` rules.
- **After the release** (S-4, out of scope for the Oct 28 release): a second job with a `postgres:18-alpine` service that runs `npx prisma migrate deploy`, a
  drift check (`npx prisma migrate diff --exit-code`, migrations against the schema), the seed with demo users,
  `npx playwright install --with-deps chromium` and `npm run test:e2e`, and uploads the Playwright report.

### Deployment architecture

Everything in this table is **to build in #28**.

```
Internet ─443─▶ nginx on the host (TLS) ─▶ 127.0.0.1:3000 app (Next.js standalone) ─▶ db (postgres:18-alpine, volume)
                                           app starts after migrate (one-shot: prisma migrate deploy && prisma db seed) exits OK
```

| File | Contents |
|---|---|
| `next.config.ts` | add `output: "standalone"` |
| `Dockerfile` | Multi-stage on `node:22-alpine`. `deps`: copy `package*.json`, `prisma/`, `prisma7.config.ts`; `npm ci` (postinstall generates the client). `build`: copy the source, `npm run build`. Target `migrate`: the build stage with `CMD npx prisma migrate deploy && npx prisma db seed`. Target `runner`: `.next/standalone`, `.next/static` and `public`, non-root user, `HOSTNAME=0.0.0.0`, `PORT=3000`, `CMD ["node", "server.js"]` |
| `docker-compose.prod.yml` | `db`: volume at `/var/lib/postgresql`, healthcheck, no published port. `migrate`: target `migrate`, `env_file: .env`, after `db` is healthy. `app`: target `runner`, `env_file: .env`, after `migrate` completed successfully, `ports: ["127.0.0.1:3000:3000"]` (reachable only through nginx). No proxy container: the VPS's own nginx terminates HTTPS |
| nginx site (on the host, not in the repo) | `proxy_pass http://127.0.0.1:3000` with `Host`, `X-Forwarded-For` and `X-Forwarded-Proto` headers; the certificate is managed on the host. The full config is in docs/04 |
| `src/app/api/health/route.ts` | `SELECT 1` through Prisma; 200 or 503 |

- **Server `.env`:** `DATABASE_URL` (host `db`), `AUTH_SECRET`, `AUTH_URL=https://<domain>`, `AUTH_TRUST_HOST=true` (Auth.js behind nginx),
  `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`, `SEED_ORGANIZER_EMAIL`, `SEED_ORGANIZER_PASSWORD`. No demo-user variables.
- **Migrate on deploy.** The standalone image has no Prisma CLI, so docs/04's `exec app npx prisma migrate deploy` can't work. The `migrate` service
  runs migrations and the seed before `app` starts, so the whole deploy is `git pull && docker compose -f docker-compose.prod.yml up -d --build`. Take
  docs/04's `pg_dump` backup first when the deploy includes a migration, then run docs/04's smoke test plus `curl https://<domain>/api/health`.

---

## Decisions for the Oct 28 release

Proposed in the planning session on 26 Oct and confirmed by the PM the same day, unchanged. docs/02 and docs/06 are updated to match.

| # | Decision | Resolves | Docs it changes | Status |
|---|---|---|---|---|
| 1 | Every user with role JUDGE judges every team of every event. No per-event judge pool, no assignment step. `JudgeAssignment` stays in the schema for #19 | D-1, D-2 | 01 (J1, J2), 02 (Scoring), 03 (matrix rows "assigned", Score), 05 (Judge), 06 (TC-03, TC-08, TC-94, TC-96) | confirmed |
| 2 | Judges score once an event's submissions are closed and can edit until results are published | D-3 (what the scoring lock hangs on) | 02 (Scoring), 03 (lifecycle), 05 (Judge), 06 (TC-04) | confirmed |
| 3 | Ranking (#16) is Must. "Publish results" (sets `resultsPublished`, locks scores, shows the ranking) is part of #12 | D-3 | 01 (O5), 02 (Publishing), 06 (ranking section, TC-103) | confirmed |
| 4 | Join a team with its 6-character invite code. `maxTeamSize` per event, default 4 | D-4 | 02 (Teams), 03 (Team, Event), 05 (Form a team), 06 (TC-15) | confirmed |
| 5 | `endDate` not before `startDate`. No Draft state: a new event has registration closed and is listed once registration opens | D-5 | 03 (Event, lifecycle), 05 (Join an event), 06 (TC-24, TC-27) | confirmed |
| 6 | Organizer sets `maxScore` per criterion (integer ≥ 1, default 10). Weights are whole percents totalling 100, checked in the action. Criteria lock once any score exists | D-6 | 02 (Open questions), 05 (Set up an event), 06 (new TC for max score) | confirmed |
| 7 | `prisma/seed.ts` creates the first organizer from `SEED_ORGANIZER_EMAIL` / `SEED_ORGANIZER_PASSWORD` | D-7 | 04 (setup, configuration), `.env.example` | confirmed |
| 8 | Password ≥ 8 characters. Emails stored lowercased. Authorization re-reads the role from the DB on every request; the JWT role is only for redirects | D-8, S-3 | 02 (Permissions), 06 (TC-45, new TC for a role change without re-login) | confirmed |
| 9 | Leaving a team is allowed until the team submits. When the last member leaves, the team is deleted | D-8 | 02 (Teams), 05 (Form a team), 06 (TC-18) | confirmed |
| 10 | Teams without a submission aren't ranked. A criterion nobody scored counts as 0. The published ranking shows rank, team, members and total (0–100), not individual judges' scores | D-8 | 03 (Ranking calculation), 06 (TC-101 – TC-106) | confirmed |
| 11 | Organizers can make a user a judge (or back) only if the user isn't on a team in any event | D-8 | 02 (Judge role), 05 (Run the event), 06 (TC-76) | confirmed |
| 12 | Any signed-in user can view any profile (read-only). Participants see their own team's submission | D-8 | 03 (permission matrix), 06 (TC-12) | confirmed |

### Conflicts found while writing this document

| Conflict | Resolution here | Confirms |
|---|---|---|
| The route map calls `/events/[eventId]/team/submit` "submit **or edit**", and the UI spec allows edits while submissions are open. docs/01 and docs/02 cut "edit the submission until the deadline" | One `Submission` row per team, upserted while submissions are open. If the cut stands, the action refuses an update when a row exists: a one-line change | PM |
| The review (S-2) has proxy send wrong roles to `/`. With a stale JWT role that locks out a newly promoted judge (Decision 8) | Proxy only checks signed in or not. `requireRole` sends wrong roles to their role home, as the UI spec asks | — |
| docs/04 runs `prisma migrate deploy` through `exec app`, which can't work in a standalone image | A one-shot `migrate` service in `docker-compose.prod.yml` | Abdurauf, in #28 |
| `/events` lists only events with registration open (route map, Decision 5), so once registration closes nobody can find the event or its published ranking from the list | No change: the page works by direct link and from `/my-events` and `/judge`. A results list is a candidate for after the release | PM |

