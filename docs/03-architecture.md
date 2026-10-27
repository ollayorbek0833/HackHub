# 3. Architecture

> **Status:** logical design. The technology stack was chosen on 2026-10-19 (see [Technology stack](#technology-stack)).
> The data model and rules don't depend on the stack. Checked against the Oct 28 release on 28 Oct: where the release
> decisions changed something, this document says so. How it's built is in [System design](07-system-design.md).

## Overview

```
 ┌──────────────────────┐     HTTPS/JSON     ┌──────────────────────┐        ┌──────────────┐
 │  Web client          │ ─────────────────▶ │  Backend API         │ ─────▶ │  Relational  │
 │  (responsive, phone  │ ◀───────────────── │  auth, permissions,  │ ◀───── │  database    │
 │   + desktop)         │                    │  business rules      │        │              │
 └──────────────────────┘                    └──────────────────────┘        └──────────────┘
```

- **Web client.** Next.js pages styled with Tailwind and shadcn/ui. A responsive interface with three role-specific areas: participant, judge and organizer. It only
  shows the actions the current role is allowed to use.
- **Backend API.** Next.js route handlers and server actions in the same app. Handles authentication, checks permissions on **every** endpoint, and enforces all product rules
  (event state, one team per event, weight totals, scoring ranges). It also calculates the ranking. Judge auto-assignment is after the release (Decision 1).
- **Database.** PostgreSQL, accessed through Prisma. A relational store for users, events, teams, submissions, criteria and scores. Use a relational
  database, because the data is highly relational and the rules need constraints (unique memberships, one submission per team).

## Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript** | One language across the whole app |
| Framework | **Next.js** (App Router) | Frontend and backend in one app. The backend is route handlers and server actions |
| UI | **Tailwind CSS + shadcn/ui** | Matches custom mockups easily. Responsive (phone + desktop) |
| ORM | **Prisma** | Schema and migrations in `prisma/schema.prisma` |
| Database | **PostgreSQL** | Unique constraints enforce the membership and submission rules |
| Auth | **Auth.js** (credentials provider) + **bcrypt** | Email and password login. The role is stored on the user and checked on every request |
| Tests | **Vitest** (unit), **Playwright** (end-to-end) | The cases in the [test report](06-test-report.md) map onto these |
| Hosting | **VPS + Docker** | `docker compose` with the app and Postgres, behind the VPS's own nginx, which terminates HTTPS |

The whole app is a single Next.js project, and one container image is deployed.

Implementation-level design (code layout, schema, request flow): see [07-system-design.md](07-system-design.md).

## Data model

```
User ──< EventRegistration >── Event ──< Criterion
 │                               │
 │                               ├──< Team ──< TeamMember >── User
 │                               │     │
 │                               │     └── Submission (one per team)
 │                               │
 └──< JudgeAssignment >── Team   └── ScheduleItem / Brief
         │
         └──< Score (judge × team × criterion)
Judge ──< Comment >── Team
```

| Entity | Key fields | Rules |
|---|---|---|
| **User** | id, email (unique), password_hash, role (`participant` \| `judge` \| `organizer`) | Exactly one role. Passwords are stored hashed |
| **Profile** | user_id, name, faculty, skills[], bio, links | Name and faculty are required |
| **Event** | id, name, description, start_date, end_date, registration_open, submissions_open, results_published | end_date ≥ start_date |
| **ScheduleItem** | event_id, time, title | Shown in the user's timezone |
| **Brief** | event_id, text | Challenge brief published by the organizer |
| **EventRegistration** | user_id, event_id | Unique per (user, event). Only allowed while registration is open |
| **Team** | id, event_id, name, created_by | The creator becomes a member |
| **TeamMember** | team_id, user_id, team_role (optional) | A user is on at most one team per event. team_role is the Could have P7 |
| **Submission** | team_id, title, description, repo_url | One per team. Only allowed while submissions are open. repo_url must be a valid URL |
| **Criterion** | event_id, name, weight_percent, max_score | The weights for an event total 100. Locked once scoring starts |
| **JudgeAssignment** | judge_id, team_id | Unique per (judge, team). In the schema for auto-assignment, unused in the Oct 28 release |
| **Score** | judge_id, team_id, criterion_id, value | 0 ≤ value ≤ max_score. Any judge, for any submitted team of an event in judging (Decision 1). Editable until results are published |
| **Comment** | judge_id, team_id, text | Judges only. Visible to the team and organizers |

## Permission matrix

| Action | Participant | Judge | Organizer |
|---|:-:|:-:|:-:|
| Register / log in / edit own profile | ✅ | ✅ | ✅ |
| Browse events, see schedule and brief | ✅ | ✅ | ✅ |
| Register for an event | ✅ | | |
| Create, join or leave a team | ✅ | | |
| Submit a project for own team | ✅ | | |
| See assigned teams and their submissions | | ✅ | |
| Score assigned teams | | ✅ | |
| Comment on assigned teams | | ✅ | |
| Read comments on own team | ✅ | | ✅ |
| Create or edit events, schedule and brief | | | ✅ |
| Set criteria and weights | | | ✅ |
| Open or close registration and submissions | | | ✅ |
| See all participants, teams and submissions | | | ✅ |
| Assign the Judge role | | | ✅ |
| Run judge auto-assignment | | | ✅ |
| See the ranking before publishing / publish it | | | ✅ |
| See the published ranking | ✅ | ✅ | ✅ |

Every cell is enforced by the backend. The client hiding a button is only a convenience.

For the Oct 28 release, "assigned teams" means every submitted team of an event in judging, because every judge
judges every team (Decision 1). Comments, auto-assignment, and the schedule and brief are after the release. The row
names stay as they are, because `src/lib/auth/permissions.test.ts` reads this table row by row (TC-73).

## Event lifecycle

```
New event ──▶ Registration open ──▶ Registration closed ──▶ Submissions open ──▶ Submissions closed
                                                                                   │
                     Results published ◀── Manual score review ◀── Judging ◀──────┘
```

Registration and submissions are independent switches (requirement O4). The diagram shows the usual order,
but the organizer can open or close either one at any time, with two limits: submissions can't reopen once any score
exists, and nothing changes after results are published (Decisions 2, 3). There is no Draft state: a new event has
registration closed and isn't listed until registration opens (Decision 5).

## Ranking calculation

For each team *t*:

1. For each criterion *c*, take the average of all judges' scores for *t* on *c*, and divide by `max_score(c)`. This gives
   a normalized value from 0 to 1.
2. Weighted total(*t*) = Σ over criteria of `weight_percent(c) × normalized(t, c)`. The result is from 0 to 100.
3. Sort the teams by weighted total, highest first.
4. **Tie-break.** For teams with equal totals, compare normalized scores on the criterion with the highest weight, then the next highest, and so on.
   If teams are still tied after all criteria, they share the rank.

Teams without a submission aren't ranked, and a criterion nobody scored counts as 0 for that team (Decision 10).
Totals are compared rounded to 6 decimals and shown with one.

Averaging and normalizing (step 1) keep the ranking fair when teams have different numbers of judges, or when
criteria have different score ranges.

## Judge auto-assignment

> **After the release** (card #19). For the Oct 28 release every judge scores every team (Decision 1). The design
> below is kept for that card.

Goal: each judge gets a **fair** set of teams. That means a balanced count, the same team never assigned twice to one
judge, and every team scored by the same number of judges.

1. Inputs: the event's judges *J* and teams *T*, and *k* judges per team (configurable, at most |J|).
2. Shuffle *T*. Then, for each team, assign the *k* judges who currently have the fewest teams, skipping judges already assigned to that team.
3. This keeps every judge's load within one team of every other judge.
4. Running it again (after teams or judges change) replaces the existing assignments. Scores already given by a judge
   who is still assigned to the same team are kept.
