# 6. Test report

> **Status:** release results recorded on 27 Oct 2026 from each card's tester review on GitHub and a regression run
> on `main`; on 29 Oct, the last open case (TC-102) was run on a real tie, bugs 3, 7 and 8 were closed, and every
> automated test was run again on `master` (`1f6dcff`, #86). Nine e2e tests from the late redesign PRs fail there; see
> [Automated checks](#automated-checks). The team ran the release checklist by hand on production, and the release
> is signed off (see [Release test run](#release-test-run) and [Release sign-off](#release-sign-off)).
> The test cases come straight from the **Tasks** checklist of each Trello card, so the report and the board
> stay in step. If a card's tasks change, update its cases here.
>
> **26 Oct:** cases updated for the confirmed release decisions ([Scope decisions](02-scope-decisions.md#product-rules)).
> New cases are numbered from TC-117 so existing IDs don't move.

## Approach

- **Who tests.** The team has no dedicated QA. Each card is tested by someone **other than the person who built it**.
  Mehroj coordinates testing.
- **When.** A card is tested before it moves to Completed. The whole set of tests is run again before every production deploy.
- **What.** Every task on a card is a check. Lines that started with "Tests:" are split into one case each.
- **Where.** Local environment during development, and production for the post-deploy smoke test
  (see [Setup and deployment](04-setup-and-deployment.md#smoke-test-after-a-deploy)).
- **Results.** `Pass`, `Fail (bug #n)`, `Blocked`, or `Not run`. Each failure gets an entry in the bug log below.
  Each result names its tester and date. The 27 Oct results were run by each tester's coding agent: a real browser
  driven by Playwright (headless Chromium) on a local build with the demo seed, plus the unit tests. Every tester
  clicks through their own cases by hand before the sign-off.

## Summary

| Area | Cases | Pass | Fail | Not run |
|---|---|---|---|---|
| Release (Must have) | 95 | 95 | 0 | 0 |
| After the release | 33 | — | — | 33 |

Last full run: 27 Oct 2026, 20:00, on `main` at `a971e96`, the same code as `000dcb1` (local, demo seed): every card's tester
results above, then a regression run of the cases no tester had run. Rerun on 29 Oct on `master` at `1f6dcff` (#86)
plus the bug 3 and bug 8 fixes (local, demo seed): 478 unit tests and both database race tests pass, typecheck and lint
are clean, TC-102 passes, and 121 of 130 e2e tests pass (the 9 failures are listed under
[Automated checks](#automated-checks)). The production run is in [Release test run](#release-test-run): done by hand by the team, every line passed.

## Test cases

### Assign points against criteria (Must have)

| ID | Check | Result |
|---|---|---|
| TC-01 | Scoring form listing each criterion of the event | Pass (Mehroj, 27 Oct) |
| TC-02 | Enforce score range per criterion | Pass (Mehroj, 27 Oct) |
| TC-03 | Every judge can score every submitted team of an event in judging (Decision 1) | Pass (Mehroj, 27 Oct) |
| TC-04 | Allow editing scores until results are published | Pass (Mehroj, 27 Oct) |
| TC-05 | Compute weighted total per team | Pass (Mehroj, 27 Oct) |
| TC-06 | Test: scoring | Pass (Mehroj, 27 Oct) |
| TC-07 | Test: range | Pass (Mehroj, 27 Oct) |
| TC-08 | Test: scoring a team without a submission, or an event not in judging, is rejected | Pass (Mehroj, 27 Oct) |
| TC-122 | Scoring is refused while submissions are open; scores are read-only after results are published (Decision 2) | Pass (Mehroj, 27 Oct) |

### Create a profile (Must have)

| ID | Check | Result |
|---|---|---|
| TC-09 | Profile fields: name, faculty, skills, bio, contact/links | Pass (Abdurauf, 27 Oct) |
| TC-10 | Create and edit profile page | Pass (Abdurauf, 27 Oct) |
| TC-11 | Validate required fields | Pass (Abdurauf, 27 Oct) |
| TC-12 | Show profile to other users (read-only view) | Pass (Abdurauf, 27 Oct) |
| TC-13 | Test: create and update profile | Pass (Abdurauf, 27 Oct) |
| TC-127 | Another user's profile is read-only and doesn't show the email (Decision 12) | Pass (Abdurauf, 27 Oct) |

### Create a team or join an existing one (Must have)

| ID | Check | Result |
|---|---|---|
| TC-14 | Create team (name) within an event; creator becomes a member | Pass (Ollayorbek, 27 Oct) |
| TC-15 | Join an existing team with its 6-character invite code (Decision 4) | Pass (Ollayorbek, 27 Oct) |
| TC-16 | Only registered participants of the event can join | Pass (Ollayorbek, 27 Oct) |
| TC-17 | A participant can be in only one team per event | Pass (Ollayorbek, 27 Oct) |
| TC-18 | Leave team | Pass (Ollayorbek, 27 Oct) |
| TC-19 | Show team members on the team page | Pass (Ollayorbek, 27 Oct) |
| TC-20 | Test: create | Pass (Ollayorbek, 27 Oct) |
| TC-21 | Test: join | Pass (Ollayorbek, 27 Oct) |
| TC-22 | Test: one-team-per-event rule | Pass (Ollayorbek, 27 Oct) |
| TC-119 | Joining a full team (`maxTeamSize`) is refused (Decision 4) | Pass (Mehroj, regression on `main`, 27 Oct) |
| TC-120 | Leaving is refused after the team submits; when the last member leaves, the team is deleted (Decision 9) | Pass (Mehroj, regression on `main`, 27 Oct) |

### Create an event with name, dates, description (Must have)

| ID | Check | Result |
|---|---|---|
| TC-23 | Event form: name, start/end dates, description | Pass (Xurliman, 27 Oct) |
| TC-24 | Validate the end date is not before the start date (same day allowed) | Pass (Xurliman, 27 Oct) |
| TC-25 | Edit event details | Pass (Xurliman, 27 Oct) |
| TC-26 | Only organizers can create or edit events | Pass (Xurliman, 27 Oct) |
| TC-27 | A new event has registration closed and appears in the open events list once registration opens (Decision 5) | Pass (Xurliman: created closed, 27 Oct; Ollayorbek: listed once open, 27 Oct) |
| TC-28 | Test: create | Pass (Xurliman, 27 Oct) |
| TC-29 | Test: date validation | Pass (Xurliman, 27 Oct) |
| TC-30 | Test: permission check | Pass (Xurliman, 27 Oct) |

### Open and close registration and submissions (Must have)

| ID | Check | Result |
|---|---|---|
| TC-31 | Toggle registration open/closed per event | Pass (Xurliman, 27 Oct) |
| TC-32 | Toggle submissions open/closed per event | Pass (Xurliman, 27 Oct) |
| TC-33 | Enforce state on the backend (not just hidden buttons) | Pass (Xurliman, 27 Oct) |
| TC-34 | Show current status to participants | Pass (Mehroj, regression on `main`, 27 Oct) |
| TC-35 | Test: actions blocked when closed | Pass (Xurliman, 27 Oct) |
| TC-123 | Publishing needs submissions closed and criteria set, asks for confirmation, can't be undone, and disables every switch (Decision 3) | Pass (Xurliman, 27 Oct) |

### Open events and register for one (Must have)

| ID | Check | Result |
|---|---|---|
| TC-36 | List open events (name, dates, short description) | Pass (Ollayorbek, 27 Oct) |
| TC-37 | Event details page | Pass (Ollayorbek, 27 Oct) |
| TC-38 | Register button; blocked when registration is closed | Pass (Ollayorbek, 27 Oct) |
| TC-39 | Prevent registering twice for the same event | Pass (Ollayorbek, 27 Oct) |
| TC-40 | Show the user's registered events | Pass (Ollayorbek, 27 Oct) |
| TC-41 | Test: register | Pass (Ollayorbek, 27 Oct) |
| TC-42 | Test: duplicate | Pass (Ollayorbek, 27 Oct) |
| TC-43 | Test: closed registration | Pass (Ollayorbek, 27 Oct) |
| TC-126 | A participant without a name and faculty in their profile can't register for an event | Pass (Ollayorbek, 27 Oct) |

### Register with email and password (Must have)

| ID | Check | Result |
|---|---|---|
| TC-44 | Registration form: email, password, confirm password | Pass (Mehroj, 27 Oct) |
| TC-45 | Validate email format and a password of at least 8 characters (Decision 8) | Pass (Mehroj, 27 Oct) |
| TC-46 | Reject duplicate emails with a clear error | Pass (Mehroj, 27 Oct) |
| TC-47 | Hash passwords before storing (never plain text) | Pass (Mehroj, 27 Oct) |
| TC-48 | Login and logout with session/token handling | Pass (Mehroj, 27 Oct) |
| TC-49 | Test: register | Pass (Mehroj, 27 Oct) |
| TC-50 | Test: duplicate email | Pass (Mehroj, 27 Oct) |
| TC-51 | Test: wrong password | Pass (Mehroj, 27 Oct) |

### See all registered participants and teams (Must have)

| ID | Check | Result |
|---|---|---|
| TC-52 | Organizer view: participants list per event | Pass (Xurliman, 27 Oct) |
| TC-53 | Teams list with their members | Pass (Xurliman, 27 Oct) |
| TC-54 | Show which teams have submitted a project | Pass (Xurliman, 27 Oct) |
| TC-55 | Only organizers can access this view | Pass (Xurliman, 27 Oct) |
| TC-56 | Test: data shown | Pass (Xurliman, 27 Oct) |
| TC-57 | Test: permission check | Pass (Xurliman, 27 Oct) |

### Set the judging criteria and their weights (Must have)

| ID | Check | Result |
|---|---|---|
| TC-58 | Add, edit, remove criteria for an event | Pass (Mehroj, 27 Oct) |
| TC-59 | Set a weight per criterion | Pass (Mehroj, 27 Oct) |
| TC-60 | Validate weights: they must total exactly 100% before saving | Pass (Mehroj, 27 Oct) |
| TC-61 | Lock criteria once scoring has started | Pass (Mehroj, 27 Oct) |
| TC-62 | Test: CRUD criteria | Pass (Mehroj, 27 Oct) |
| TC-63 | Test: weight validation | Pass (Mehroj, 27 Oct) |
| TC-117 | Max score per criterion: whole number of at least 1, default 10 (Decision 6) | Pass (Mehroj, 27 Oct) |

### Submit a project: repo, description, title (Must have)

| ID | Check | Result |
|---|---|---|
| TC-64 | Submission form: title, description, repository URL | Pass (Abdurauf, 27 Oct) |
| TC-65 | Validate repository URL | Pass (Abdurauf, 27 Oct) |
| TC-66 | One submission per team per event; submitting again updates it | Pass (Abdurauf, 27 Oct) |
| TC-67 | Blocked when submissions are closed | Pass (Abdurauf, 27 Oct) |
| TC-68 | Submission visible to judges and organizers | Pass (Mehroj, regression on `main`, 27 Oct) |
| TC-69 | Test: submit | Pass (Abdurauf, 27 Oct) |
| TC-70 | Test: validation | Pass (Abdurauf, 27 Oct) |
| TC-71 | Test: closed submissions | Pass (Abdurauf, 27 Oct) |
| TC-121 | A team member can update the submission while submissions are open; updates are refused once they close | Pass (Abdurauf, 27 Oct) |

### Three roles with separate permissions (Must have)

| ID | Check | Result |
|---|---|---|
| TC-72 | Define roles: Participant, Judge, Organizer | Pass (Mehroj, 27 Oct) |
| TC-73 | Permission matrix: which role can do what | Pass (`permissions.test.ts` reads the docs/03 matrix row by row, CI) |
| TC-74 | Backend authorization checks on every endpoint | Pass (Mehroj, regression on `main`, 27 Oct) |
| TC-75 | UI shows only actions allowed for the role | Pass (Mehroj, regression on `main`, 27 Oct) |
| TC-76 | Organizer can assign Judge role | Pass (Mehroj, 27 Oct) |
| TC-77 | Test: each role blocked from others' actions | Pass (Mehroj, 27 Oct) |
| TC-118 | After an organizer makes a user a judge, `/judge` works for them without logging in again (Decision 8) | Pass (Mehroj, 27 Oct) |
| TC-125 | Making a participant who is on a team a judge is refused; nobody can change their own role (Decision 11) | Pass (Mehroj, 27 Oct). The join/role-change race (bug 3) is fixed and has a database test (29 Oct) |
| TC-128 | The seed creates the first organizer and can run twice without error (Decision 7) | Pass (Mehroj, regression on `main`, 27 Oct) |

### Auto-assign judges to teams (Should have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it. Decision 1: every judge scores every team for now.

| ID | Check | Result |
|---|---|---|
| TC-78 | Assignment algorithm: spread teams fairly across judges | Not run |
| TC-79 | Avoid assigning the same team to one judge twice | Not run |
| TC-80 | Organizer triggers auto-assign for an event | Not run |
| TC-81 | Show resulting judge-team assignments to the organizer | Not run |
| TC-82 | Re-run when judges or teams change | Not run |
| TC-83 | Test: fair distribution | Not run |
| TC-84 | Test: no duplicates | Not run |

### Leave a comment under projects (Should have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it.

| ID | Check | Result |
|---|---|---|
| TC-85 | Comment box on the project page | Not run |
| TC-86 | Show comment author, role and time | Not run |
| TC-87 | Edit/delete own comments | Not run |
| TC-88 | Only judges can comment; comments are visible to the team and organizers | Not run |
| TC-89 | Test: add | Not run |
| TC-90 | Test: edit | Not run |
| TC-91 | Test: delete | Not run |
| TC-92 | Test: permission | Not run |

### Log in and see the teams (Should have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it. The judge dashboard itself is built and tested in "Assign points against criteria".

| ID | Check | Result |
|---|---|---|
| TC-93 | Judge dashboard after login | Not run |
| TC-94 | List of teams assigned to the judge | Not run |
| TC-95 | Open a team's project submission from the list | Not run |
| TC-96 | Test: judge sees only assigned teams | Not run |

### See the event schedule and event brief (Should have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it.

| ID | Check | Result |
|---|---|---|
| TC-97 | Organizer can add schedule items (time, title) and a brief | Not run |
| TC-98 | Schedule and brief shown on the event page | Not run |
| TC-99 | Times displayed in the user's timezone | Not run |
| TC-100 | Test: schedule display | Not run |

### See the final ranking (Must have, Decision 3)

| ID | Check | Result |
|---|---|---|
| TC-101 | Rank teams by weighted total score | Pass (Abdurauf, 27 Oct) |
| TC-102 | Tie-break: compare scores on the highest-weight criterion, then the next highest | Pass (Mehroj, 29 Oct: a real tie on "Demo Hack · judging": Null Pointers 8/7/9 and Byte Me 10/7/4 both total 79.0; Byte Me ranks 1st on Innovation, the 50% criterion, and the ranks aren't shared) |
| TC-103 | Organizer reviews the preview (judge count per team), then publishes from the overview or the ranking page | Pass (Abdurauf, 27 Oct) |
| TC-104 | Ranking visible to everyone only after publishing | Pass (Abdurauf, 27 Oct) |
| TC-105 | Test: ranking order | Pass (Abdurauf, 27 Oct) |
| TC-106 | Test: unpublished ranking hidden | Pass (Abdurauf, 27 Oct) |
| TC-124 | A team without a submission isn't ranked; a criterion nobody scored counts as 0 (Decision 10) | Pass (Abdurauf, 27 Oct) |

### Works on both screens: desktop / phone (Should have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it. A basic phone check at 390 px is part of the UI style pass (#26).

| ID | Check | Result |
|---|---|---|
| TC-107 | Responsive layout for main pages | Not run |
| TC-108 | Mobile navigation menu | Not run |
| TC-109 | Forms and tables usable on small screens | Not run |
| TC-110 | Test on phone and desktop browsers | Not run |

### Team member roles assignment (Could have)

> **After the release.** Not part of the Oct 28 release; these cases aren't run for it.

| ID | Check | Result |
|---|---|---|
| TC-111 | Define the list of team roles (for example Developer, Designer, Presenter) | Not run |
| TC-112 | The team creator can assign a role to each member | Not run |
| TC-113 | Each member has at most one team role | Not run |
| TC-114 | Show every member's role on the team page | Not run |
| TC-115 | Test: assign | Not run |
| TC-116 | Test: change and view roles | Not run |

## Automated checks

Unit tests (Vitest, `npm run test`) run in CI on every pull request. They back the cases below, but they don't replace
them: a case is `Pass` only once its tester has checked it by hand in the browser. Most test names carry their TC
number; where one doesn't, the table names the test. Keep this table in step when a PR adds tests.

| Cases | Test file | Where |
|---|---|---|
| TC-73 | `src/lib/auth/permissions.test.ts` (permission matrix row by row) | `main` |
| TC-118 | `src/lib/auth/dal.test.ts`, test "accepts a role granted after login, without logging in again" | `main` |
| TC-09, TC-11 | `src/lib/validation/profile.test.ts` | `main` |
| TC-10, TC-11, TC-13 | `src/app/(app)/profile/actions.test.ts` (saves the session user's profile, refuses a missing name or faculty) | `main` |
| TC-64, TC-65, TC-70 | `src/lib/validation/submission.test.ts` | `main` |
| TC-64…TC-67, TC-69…TC-71, TC-121 | `src/app/(app)/events/[eventId]/team/submit/actions.test.ts`, `src/lib/domain/submission.test.ts` | `main` |
| TC-05, TC-101, TC-102, TC-105, TC-124 | `src/lib/domain/ranking.test.ts`, `src/lib/queries/ranking.test.ts` | `main` |
| TC-35, TC-67 | `src/lib/domain/event-state.test.ts` (`canRegister`, `canSubmit`) | `main` |
| TC-23, TC-24, TC-29 | `src/lib/validation/event.test.ts` | `main` |
| TC-24…TC-30 | `src/app/organizer/events/event-actions.test.ts` | `main` |
| TC-123 | `src/lib/domain/event-switches.test.ts` | `main` |
| TC-52…TC-57 | `src/app/organizer/events/[eventId]/participants/data.test.ts` | `main` |
| TC-38, TC-39, TC-42, TC-43 | `src/lib/domain/registration.test.ts` | `main` |
| TC-15…TC-18, TC-21, TC-22 | `src/lib/domain/teams.test.ts` | `main` |
| TC-45 | `src/lib/validation/auth.test.ts` | `main` |
| TC-59, TC-60, TC-61, TC-63 | `src/lib/domain/criteria.test.ts`, `src/lib/validation/criteria.test.ts` | `main` |
| TC-76 | `src/lib/domain/roles.test.ts` | `main` |
| TC-02, TC-04, TC-07, TC-08 | `src/lib/domain/scoring.test.ts` | `main` |
| TC-125 (bug 3) | `src/lib/transactions/lock-participant.db.test.ts` (a join and a role change at the same moment; needs `TEST_DATABASE_URL`, so not in CI) | `master` |

End-to-end tests (Playwright, `npm run test:e2e`) run locally before a release, on the demo seed, with the app on port 3000 (`AUTH_URL`'s port, or logging out lands on another port). On 27 Oct: 8 passed, and `home.spec.ts` failed because it was stale (bug 7). On 29 Oct, on `master` at `1f6dcff` (#86): 121 passed, 1 skipped and 9 failed. The same 9 fail on `1f6dcff`
without this report's fixes, one at a time as well as in parallel, so they come from the late redesign PRs, not from the
release features. They are tests of polish added on 28–29 Oct, not of a release case:

| Spec | Fails | What the test waits for |
|---|---|---|
| `e2e/landing-nav.spec.ts` "while Happening now is still streaming in" (5 tests) | The "Happening now" skeleton (`#happening-now [aria-busy="true"]`) is never seen | A slowed-down stream of the landing's live events; locally the section arrives before the check |
| `e2e/logout-hard-nav.spec.ts` (3 tests) | "You're logged out." never shows after log out from the menus | The full-page log out from #85 |
| `e2e/action-result-once.spec.ts` "Profile doesn't replay its first save" | Times out clicking on /profile | The profile form after #82 added the phone field |

Each needs its owner to check whether the app or the test is wrong before the sign-off.

| Cases | Spec | Where |
|---|---|---|
| — | `e2e/home.spec.ts` (home page) | `main` |
| TC-44…TC-51 | `e2e/auth.spec.ts` | `main` |
| TC-01, TC-02, TC-04, TC-07 | `e2e/judge.spec.ts` (also the scorecard's skip link and number keys) | `main` |

Every other release case is checked by hand by its tester.

## Release test run

Run by the team after Abdurauf's final deploy (Wed 28 Oct), **by hand** on https://hackhub.mekhroj.uz with one account
per role. Every line passed; no failures to log. Use a new event, never the demo seed (it's local only). Tick each line, and log any failure in the bug log
before signing off.

**Smoke test** ([Setup and deployment](04-setup-and-deployment.md#smoke-test-after-a-deploy))

- [x] `curl -fsS https://hackhub.mekhroj.uz/api/health` returns `{"status":"ok"}`
- [x] The home page loads over HTTPS, on desktop and on a phone
- [x] `docker compose -f docker-compose.prod.yml logs app` (or `/var/log/hackhub-autodeploy.log`) shows no errors

**Main flow**

1. [x] **Organizer** (the seeded account) logs in, creates an event ("Event created…"), and sets criteria that total
   100% ("Criteria saved.")
2. [x] Organizer opens registration. The event shows on `/events` when signed out
3. [x] **Participant A** registers an account, lands on `/profile`, saves name and faculty, then registers for the event
4. [x] Participant A creates a team. **Participant B** (a second new account, profile filled in) joins with the invite code
5. [x] **Judge:** the organizer makes a third new account a judge on **Users**. That person opens `/judge` without
   logging in again
6. [x] Organizer opens submissions. Participant B submits the project ("Project submitted."). Participant A sees it
   and edits it ("Submission updated.")
7. [x] Organizer closes submissions (confirm dialog). The judge sees the event on `/judge` and scores the team on
   every criterion ("Scored")
8. [x] Organizer checks **Ranking** (1 judge, the total looks right), then publishes (confirm dialog)
9. [x] The event page shows "Final ranking" to a signed-out visitor; participant A sees "Your team"; the judge's form
   is read-only

**Negative checks**

- [x] A participant opening `/organizer` lands on `/my-events` with "You don't have access to that page."
- [x] Registering the same email again (another letter case) is refused
- [x] After closing submissions, the submit page shows the submission read-only

When every line is ticked, fill in the sign-off row below. Abdurauf reads this report before Mehroj signs.

## Bug log

| # | Found in | Description | Severity | Found by | Status |
|---|---|---|---|---|---|
| 1 | #31 / #35 Scoring | Typing something that isn't a number (`1e`, `abc`) in a score box sent it as blank, so saving deleted the judge's saved score and still said "Scores saved." | High | Mehroj, 27 Oct | Fixed before merge in #35 (`125a2f8`): junk is refused, and only a box submitted blank is cleared. Re-tested 27 Oct |
| 2 | #29 / #33 Criteria | Saving criteria could delete scores a judge saved at the same moment (count, then delete, with no lock; scores cascade) | Medium | Mehroj, 27 Oct | Fixed before merge in #33 (`d3be1fc`): the event row is locked first. `save-criteria.db.test.ts` fails without the lock. Re-tested 27 Oct |
| 3 | #30 / #34 Roles, #23 Teams | A team join that starts just before an organizer makes that participant a judge can still commit, leaving a judge on a team (TC-125) | Low | Mehroj, 27 Oct | Fixed 29 Oct: create and join share-lock the user row and re-check the role inside their transaction (`lib/transactions/lock-participant.ts`, [System design](07-system-design.md#transactions)). `lock-participant.db.test.ts` fails without the lock |
| 4 | #25 Ranking preview | A client navigation from Overview to Ranking hit "uncached data during navigation" in dev (params read outside the page's own Suspense) | Medium | Abdurauf, 27 Oct | Fixed before merge in #25 (`1736674`). Re-tested 27 Oct |
| 5 | #28 / #32 Login | A database error during login showed "Email or password is incorrect." instead of the error page | Low | Mehroj, 27 Oct | Fixed before merge in #32 (`789fed6`) |
| 6 | #17 Demo seed | Re-running the demo seed left test teams, registrations and criteria on the demo events | Low | Xurliman, 27 Oct | Fixed before merge in #17 (`cb91482`) |
| 7 | `e2e/home.spec.ts` | The home-page e2e test still expects the old landing page (a "HackHub" heading and the three role names), so it fails since #16 | Low | Mehroj, 27 Oct | Fixed 27 Oct in #26 (`e00dc92`), updated again for the redesigned landing (`b79ff64`). Passes on 29 Oct |
| 8 | Redesign: log in, register, judging | A client navigation between /login and /register, or from one team to the next in the judge's queue, hit "uncached data during navigation" in dev (the same cause as bug 4: the area's loading.tsx is already on screen) | Low | Mehroj, 29 Oct | Fixed 29 Oct: those pages read the session, params and data inside their own Suspense. The e2e run shows no such error |

## Release sign-off

| Release | Date | Regression run | Open bugs | Signed off by |
|---|---|---|---|---|
| Final | 29 Oct 2026 | By hand on https://hackhub.mekhroj.uz (the team), plus the 29 Oct automated rerun on `master` | None in the release cases. 9 e2e tests from the late redesign PRs fail; see [Automated checks](#automated-checks) | Mehroj |
