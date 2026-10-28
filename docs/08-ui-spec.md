# 8. UI specification

> **Status:** for design, 26 Oct 2026. It covers every screen in the Oct 28 release. The product rules marked
> **Decision** come from the release plan and were confirmed on 26 Oct
> ([Scope decisions](02-scope-decisions.md#product-rules)). Every screen is built as of 28 Oct; the few places where
> the build differs are marked "As built".

## How to use this spec

**Who it's for.** Xurliman, who designs every screen this week, and the developers who build the same screens in
parallel. It says **what** each screen contains and does: content, actions, rules, states and messages. It doesn't
say how anything looks.

| Fixed by this spec | Xurliman decides |
|---|---|
| Which screens exist, and their routes | Colours, type, spacing, radius, shadows, icons |
| What each screen shows and in what priority | Layout and visual hierarchy of each screen |
| Actions, form fields, validation rules | Which shadcn variant fits each element (within the component types listed) |
| States, and the exact text of errors and toasts | Illustrations, empty-state imagery, the logo treatment |
| What happens after each action | Microcopy that isn't quoted here (headings, helper text), as long as it keeps the tone below |

Where a visual choice is needed, the spec states it as a requirement ("the total must be visible while editing
weights") or as a question for her. If a rule here makes a good design impossible, raise it with Mehroj. Don't
quietly change the rule.

**Deliverable.** In the team's design file, one frame per screen at **desktop 1440 px** and **phone 390 px**.
Name each frame by its route, prefixed with the audience when the route doesn't already start with one:

| Route | Frame name |
|---|---|
| `/` | `public / home` |
| `/login` | `auth / login` |
| `/events/[eventId]/team` | `participant / events / [eventId] / team` |
| `/organizer/events/[eventId]/criteria` | `organizer / events / [eventId] / criteria` |

Add ` · 390` to phone frames, and a state name for extra states, for example
`participant / events / [eventId] / team · no team · 390`. Design the states the spec marks with **(frame)**. The
other states can be a note on the main frame.

**Handoff.** Developers don't wait for the designs. They build each screen from this spec with **shadcn/ui
defaults** (style `radix-nova`, base colour `neutral`, icons from `lucide`), and on Wed 28 Oct the style guide is
applied through the theme variables. So:

- Use shadcn component types (Button, Card, Table, Dialog, Badge and so on). A custom component that has no shadcn
  equivalent won't be built this week.
- Express the style guide as values for the theme variables in `src/app/globals.css`, so it can be applied in one place.
- Anything that only exists in a frame and not in this spec (a new field, a new action) isn't built unless Mehroj
  adds it here.

## Design priorities and order

| Order | Trello card | Screens | Due (23:30 GMT+5) |
|---|---|---|---|
| 1 | #46 Design: style guide and app shell | Style guide, navigation for each audience, user menu, phone menu, shared components | Tue 27 Oct |
| 2 | #45 Design: auth and participant screens | `/`, `/login`, `/register`, `/events`, `/events/[eventId]`, `/my-events`, `/profile`, `/profile/[userId]`, `/events/[eventId]/team`, `/events/[eventId]/team/submit` | Backlog |
| 3 | #44 Design: organizer screens | `/organizer`, `/organizer/events/new`, `/organizer/events/[eventId]`, `.../edit`, `.../criteria`, `.../participants`, `.../ranking`, `/organizer/users` | Backlog |
| 4 | #43 Design: judge screens | `/judge`, `/judge/teams/[teamId]` | Backlog |

With the deadline moved to Wed 28 Oct, the screen wireframes (#45, #44, #43) moved to the Backlog: developers build every
screen from this spec and the style guide (#46), and the designer does one style pass over the built screens (#26).

## Style guide and app shell (#46)

### Style guide

The style guide must define:

| Item | What's needed |
|---|---|
| Palette roles | A value, and a matching `-foreground` text colour where shadcn has one, for: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`. Plus a **success** role (with foreground) for "Submitted", "Scored" and "Registered". shadcn has no success variable, so it's added as `--success` |
| Dark mode | Optional this week. If it's skipped, say so in the style guide, and developers will ship light only |
| Type scale | Page title, section title, body, small/secondary text, table text, numbers in the score and ranking tables. Font families, if not the default |
| Radius | One base `--radius` value. shadcn derives the other sizes from it |
| Component states | Default, hover, focus, disabled, pending (while saving) and error for buttons and inputs. Selected/checked for switches and tabs |
| Status colours | How each event status and each submission/scoring status looks (see [Status badge](#shared-components-and-patterns)). Colour must never be the only signal |

Every foreground/background pair must reach WCAG AA contrast (4.5:1 for body text, 3:1 for large text and for the
focus ring against the background).

**As shipped (28 Oct):** the **Scoreboard** theme (scoreboard amber `#FFA41B` on a brown-black ground `#0C0A08`,
a live red `#FF3D2E`), dark only, and the **Podium H** logo with an Unbounded wordmark. The values, contrast ratios
and usage rules (amber only for the primary action and the ranking leader, red only for live states, the ranking's
fixed ramp, open-state badges with a red dot) are in [DESIGN.md](../DESIGN.md).

### App shell

Every page has the same shell: a header with the HackHub logo (links to `/`), the navigation for the current
audience, and the account area. The main area has the page title, an optional short description, and the page's
primary action. The primary action must be found in the same place on every page. Where that is, is her call.

| Audience | Navigation items | Account area |
|---|---|---|
| Visitor (signed out) | Events (`/events`) | "Log in" (`/login`) and "Register" (`/register`) |
| Participant | Events (`/events`), My events (`/my-events`) | User menu |
| Judge | Judging (`/judge`), Events (`/events`) | User menu |
| Organizer | Events I run (`/organizer`), Users (`/organizer/users`), Public events (`/events`) | User menu |

- **User menu.** Shows the user's name (or email until the profile is complete) and their role as text.
  Items: "My profile" (`/profile`) and "Log out". Logging out returns to `/` with the toast "You're logged out."
- **Current page.** The navigation item for the current section is marked, and not by colour alone.
- **Organizer event pages.** The five pages under `/organizer/events/[eventId]` share a sub-navigation: Overview,
  Edit, Criteria, Participants, Ranking. The event name and its status badges stay visible above it, under a
  compact banner strip (96 px on phone, 128 px from md) with the event logo overlapping its bottom edge
  (see [Event images](#shared-components-and-patterns)).
- **Back links.** Pages one level down (a team page, a judge's team, an organizer sub-page) have a back link to their parent.
- **Phone (390 px).** The navigation items collapse into a menu button that opens a side sheet with the same items
  and the user menu items. The page title and the primary action stay visible without opening anything. Tables
  switch to their phone fallback (see [Data table](#shared-components-and-patterns)). Nothing scrolls sideways except
  a table that's explicitly allowed to.
- **Access rules for every page.** Signed out on a page that needs sign-in → redirect to `/login`, then back to the
  page after login. Signed in with the wrong role → redirect to the role's home with the toast
  "You don't have access to that page." Unknown event, team or user → the not-found page:
  "We couldn't find this page." with a link to the role's home.
- **Role home.** Participant `/my-events`, judge `/judge`, organizer `/organizer`.

## Screen specs

Every screen also has these states unless it says otherwise. **Loading:** skeletons in the shape of the content,
not a full-page spinner. **Error loading:** "Something went wrong. Try again." with a "Try again" button.
**Saving:** the submit button shows a pending state and is disabled, so a form can't be sent twice. Field errors
show under the field. Errors that aren't about one field show above the form.

### Auth and participant (#45)

#### `/` Landing (#26)

- **Purpose.** Tell a visitor what HackHub is and get them to the events list or to register.
- **Who.** Everyone. A signed-in user is redirected to their role home.
- **Content (redesign, 28 Oct: the demo-day big screen).** The headline and a one-sentence description of HackHub;
  the published ranking of a sample event as the hero, clearly labelled "Example" (rank, team and project, judges,
  total; the leader lit per DESIGN.md); the real open events (the soonest three, with "See all {n} open events");
  what each role does in one line each; the steps of a hackathon on HackHub (register, form a team, submit, get
  judged, see the ranking).
- **Actions.** Under the scoreboard. Primary: "Run a hackathon" (`/register`). Secondary: "Join one" (`/events`).
- **Motion.** The scoreboard rows rise in once and the totals count up once, only when reduced motion is off.
- **States.** No open events: "No events are open right now. Open events show up here as soon as an organizer opens
  registration."

#### `/register` Create an account (P1, #3)

- **Who.** Signed out. Signed-in users are redirected to their role home.
- **Fields and rules.**

| Field | Rule | Error text |
|---|---|---|
| Email | Required, valid format. Stored lowercased | "Enter your email." / "Enter a valid email address, like name@example.com." |
| Password | Required, at least 8 characters (**Decision 8**) | "Enter a password." / "Use at least 8 characters." |
| Confirm password | Must match | "The passwords don't match." |

- **Server errors.** Email already registered: "An account with this email already exists. Log in instead." with a link to `/login` (TC-46, TC-50).
- **After success.** The user is signed in and sent to `/profile` with the toast "Account created. Add your name and faculty to finish your profile."
- **Other content.** A link "Already have an account? Log in". The password rule is shown before the user types, not only as an error.
- **Tests.** TC-44, TC-45, TC-46, TC-47, TC-49, TC-50, TC-72.

#### `/login` Log in (P1, #3)

- **Who.** Signed out.
- **Fields.** Email ("Enter your email."), password ("Enter your password.").
- **Server error.** Wrong email or password: "Email or password is incorrect." It never says which one was wrong (TC-51).
- **After success.** Back to the page that sent the user here, otherwise to the role home. No toast.
- **Other content.** A link "New to HackHub? Create an account". No "forgot password" in this release.
- **Tests.** TC-48, TC-51.

#### `/events` Events (P3, #5)

- **Purpose.** Browse events that are open for registration.
- **Who.** Everyone.
- **Data.** Events with registration open (**Decision 5**: a new event appears here only once the
  organizer opens registration), soonest start date first. Each item: name, start and end dates, the first ~160
  characters of the description, max team size, status badges, and for a signed-in participant a "Registered" badge if they are.
- **Layout.** A card per event: the banner on top (5:2 on phone, 8:3 from md), the logo overlapping its
  bottom-left edge, then the name, dates, team size, badges and description. Three columns on desktop, one on phone.
- **Actions.** Open an event (`/events/[eventId]`). The whole item is the link.
- **States.** **Empty (frame):** "No events are open for registration right now. Check back soon."
- **Tests.** TC-27, TC-36.

#### `/events/[eventId]` Event details (P3, O5, #5, #16)

- **Purpose.** Everything a participant needs to decide and register; after publishing, the final ranking.
- **Who.** Everyone, by link. Visitors see the same content without the participant actions.
- **Data.** Name, dates, full description, max team size, status badges (registration, submissions, results), number of registered participants.
- **Hero.** The banner across the top (2:1 on phone, 8:3 from md, loaded eagerly), a large logo overlapping its
  bottom-left edge, then the title, dates, badges and the primary action in the usual place (right of the title
  from md, under it on phone).
- **Primary action, by situation:**

| Situation | What's shown |
|---|---|
| Visitor, registration open | "Log in to register" → `/login`, then back here |
| Participant, not registered, registration open | "Register" button |
| Participant, profile incomplete, registration open | No register button. Instead: "Complete your profile before registering." with a link to `/profile` |
| Participant, registered | **(frame)** "You're registered" (success status), plus "Create or join a team" or "Go to my team" → `/events/[eventId]/team` |
| Not registered, registration closed | **(frame)** Disabled "Registration closed" and the line "Registration for this event is closed." (TC-38, TC-43) |
| Judge | No register button. Judges can't be on teams (**Decision 11**) |
| Organizer | "Manage event" → `/organizer/events/[eventId]` |

- **After "Register".** Stays on the page, the button becomes the registered state, toast "You're registered for {event name}." If the server says it's a duplicate (TC-39): "You're already registered for this event." If it closed in the meantime: "Registration for this event is closed."
- **Ranking section.** Only when results are published (**(frame)**). Columns: rank, team name, members, total (0–100).
  Nothing else: no per-criterion or per-judge scores (**Decision 10**). Teams tied on every criterion share
  a rank. Member names link to `/profile/[userId]` for signed-in users and are plain text for visitors. If the viewer's
  team is in the table, their row is marked, and not by colour alone. Before publishing the section isn't shown.
- **Tests.** TC-34, TC-37, TC-38, TC-41, TC-43, TC-101, TC-104, TC-106.

#### `/my-events` My events (P3, #5)

- **Purpose.** The participant's home: every event they registered for, and what to do next in each.
- **Who.** Participant.
- **Data, per event.** Name, dates, status badges, my team (name or "No team yet"), submission status ("Submitted" / "Not submitted"), and "Results published" with a link to the ranking when it is.
- **Layout.** The same event card as `/events` (banner, overlapping logo), two columns from md, with the team,
  submission and actions in the card body.
- **Actions.** "Open event" → `/events/[eventId]`. "Go to my team" or "Create or join a team" → `/events/[eventId]/team`.
- **Order.** Events whose results aren't published first, by start date.
- **States.** **Empty (frame):** "You haven't registered for any events yet." with "Browse events" → `/events`.
- **Tests.** TC-40.

#### `/profile` My profile (P2, #4)

- **Purpose.** Create and edit the signed-in user's profile. All roles use it.
- **Fields and rules.**

| Field | Rule | Error text |
|---|---|---|
| Name | Required, up to 80 characters | "Enter your name." / "Keep the name under 80 characters." |
| Faculty | Required, free text, up to 80 characters | "Enter your faculty." / "Keep the faculty under 80 characters." |
| Skills | Optional. Up to 10 short tags, each up to 30 characters, added one at a time and removable | "Add up to 10 skills." / "Keep each skill under 30 characters." |
| Bio | Optional, up to 500 characters. A character count is visible while typing | "Keep the bio under 500 characters." |
| Links | Optional, up to 3, each a full URL | "Enter a full link starting with https://." |

- **Read-only.** Email and role are shown but can't be changed here.
- **After save.** Stays on the page, toast "Profile saved." On the first save after registering, go to `/events` with the same toast.
- **States.** **Incomplete (frame):** a notice at the top: "Add your name and faculty to finish your profile. You need them to register for events."
- **Tests.** TC-09, TC-10, TC-11, TC-13.

#### `/profile/[userId]` Profile (P2, #4)

- **Purpose.** Read-only view of another user, reached from team member lists and the ranking.
- **Who.** Any signed-in user (**Decision 12**).
- **Data.** Name, faculty, role, skills, bio, links (open in a new tab). The email isn't shown.
- **States.** Profile not filled in yet: "This person hasn't filled in their profile yet." Viewing your own: a link "Edit my profile" → `/profile`.
- **Tests.** TC-12.

#### `/events/[eventId]/team` My team (P4, #6)

- **Purpose.** Create a team, join one with its invite code, see the members, leave.
- **Who.** Participant registered for the event. Not registered → **(frame)** "Register for this event before joining a team." with a link to the event (TC-16).
- **State: no team (frame).** Two actions, equally visible:
  - **Create a team.** Field: team name, required, 2–40 characters, unique in the event. Errors: "Enter a team name." / "A team with this name already exists in this event." The creator becomes the first member (TC-14).
  - **Join with a code.** Field: invite code, 6 characters, not case-sensitive (**Decision 4**). Errors:

| Case | Error text |
|---|---|
| Empty or wrong length | "Enter the 6-character code." |
| No team in this event has it | "No team in this event has this code. Check it with your team." |
| Team full | "This team is full ({maxTeamSize} members)." |
| Already on a team in this event | "You're already on a team in this event. Leave it first." (TC-17) |
| Team has already submitted | "This team has already submitted, so it can't take new members." |

- **State: on a team (frame).** Data: team name; the invite code with a "Copy code" action (toast "Code copied.") and
  one line on how to use it; members (name linking to their profile, faculty, "You" next to the current user);
  member count as "{n} of {maxTeamSize}"; submission status and its action ("Submit project" while submissions are
  open and nothing is submitted, "Edit submission" or "View submission" once it is).
- **Team full.** The code stays visible with "Your team is full." The designer decides how prominent this is.
- **Leave team.** Secondary, destructive. Confirm dialog: "Leave {team name}? You can join or create another team in this event." If the user is the last member: "You're the last member, so leaving deletes {team name}." (**Decision 9**). After leaving: stay on the page in the no-team state, toast "You left {team name}."
- **Submitted (frame).** "Leave team" is disabled with "You can't leave after your team has submitted." No new members can join.
- **After create/join.** Stay on the page in the on-a-team state, toast "Team created." or "You joined {team name}."
- **Tests.** TC-14, TC-15, TC-16, TC-17, TC-18, TC-19, TC-20, TC-21, TC-22.

#### `/events/[eventId]/team/submit` Submit project (P5, #7)

- **Purpose.** Submit the team's project, or edit it while submissions are open.
- **Who.** A member of a team in this event. No team → redirect to `/events/[eventId]/team`.
- **Fields and rules.** Any team member can submit or edit. One submission per team (TC-66).

| Field | Rule | Error text |
|---|---|---|
| Project title | Required, up to 100 characters | "Enter a project title." / "Keep the title under 100 characters." |
| Description | Required, up to 2000 characters, character count visible | "Add a description." / "Keep the description under 2000 characters." |
| Repository link | Required, a valid `http(s)` URL | "Enter a valid link, like https://github.com/team/project." |

- **Before submitting.** One line under the form: "Submitting locks your team: nobody can join or leave after this."
- **After first submit.** Go to `/events/[eventId]/team`, toast "Project submitted."
- **Already submitted, submissions open.** Form prefilled, button "Save changes", toast "Submission updated." Shows "Last updated {date, time}".
- **Submissions closed (frame).** No form. If submitted: the submission read-only, with "Submissions are closed for this event." If not: "Submissions are closed for this event. Your team didn't submit a project, so it won't be ranked." (TC-67, TC-71)
- **Submissions not open yet.** "Submissions haven't opened yet. The organizer will open them when building starts."
  As built: the event has one `submissionsOpen` switch, so the page treats submissions as closed (not "not open yet") once any team
  in the event has submitted, results are published, or the event's last day is over (`lib/domain/submission.ts`).
- **Tests.** TC-64, TC-65, TC-66, TC-67, TC-69, TC-70, TC-71.

### Organizer (#44)

#### `/organizer` Events I run (O1, #9)

- **Purpose.** The organizer's home: the events this organizer created, with their state at a glance.
- **Who.** Organizer. Shows only the events this organizer created; the tab counts and the event chip's switch menu
  count the same events. Any organizer can still open and manage any event by its URL.
- **Data, per event.** Name, dates, status badges, registered participants, teams, submissions.
- **Layout.** The same event card as `/events` (banner, overlapping logo); the whole card opens the event.
- **Actions.** Primary: "New event" → `/organizer/events/new`. Open an event → `/organizer/events/[eventId]`.
- **States.** **Empty (frame):** "No events yet. Create the first one." with "New event".
- **Tests.** TC-26.

#### `/organizer/events/new` and `/organizer/events/[eventId]/edit` Event form (O1, #9)

- **Who.** Organizer (TC-26, TC-30).
- **Fields and rules.** The same form for both. On edit it's prefilled.

| Field | Rule | Error text |
|---|---|---|
| Name | Required, up to 100 characters | "Enter the event name." |
| Description | Required, up to 2000 characters | "Add a description." |
| Start date | Required, a date (no time) | "Choose a start date." |
| End date | Required, not before the start date; the same day is fine (**Decision 5**) | "Choose an end date." / "The end date can't be before the start date." |
| Max team size | Whole number 1–10, default 4 | "Team size must be a whole number from 1 to 10." |

- **Edit only.** Max team size can't go below the largest current team: "{team name} already has {n} members, so the max can't be lower than {n}."
- **After create.** Go to `/organizer/events/[eventId]`, toast "Event created. It's hidden from participants until you open registration."
- **After edit.** Go to the overview, toast "Event saved."
- **Cancel.** Back to where the user came from. If anything changed, confirm: "Discard your changes?"
- **Tests.** TC-23, TC-24, TC-25, TC-28, TC-29.

#### `/organizer/events/[eventId]` Event overview (O4, #12)

- **Purpose.** Run the event: see where it stands and flip its switches.
- **Data.** Name, dates, status badges, counts (registered participants, teams, submissions), criteria status ("Not set", "Set: weights total 100%", "Locked").
- **Controls.**

| Control | Behaviour | Confirm dialog |
|---|---|---|
| Registration open/closed | A switch. Opening it lists the event on `/events` | None |
| Submissions open/closed | A switch | Closing: "Close submissions? Teams can't submit or edit, and judges can start scoring." |
| Publish results | A button. Sets `resultsPublished`, locks every score, shows the ranking on the event page (**Decision 3**) | "Publish results for {event}? Everyone will see the ranking, and judges can't change scores any more. This can't be undone." |

- **Rules for the controls.**
  - Publish is available only when submissions are closed and the criteria are set. Otherwise it's disabled with the reason: "Close submissions first." / "Set the judging criteria first."
  - Before publishing, the dialog reminds the organizer to check that every team has been scored. HackHub doesn't track this (see [Scope decisions](02-scope-decisions.md#consequences-of-the-cuts)). It links to the ranking preview.
  - Submissions can't be reopened once any score exists: "Judges have started scoring, so submissions can't reopen."
  - **Results published (frame).** All three controls are disabled, with "Results were published on {date}." and a link to the public event page.
- **Feedback.** Each switch change shows a toast: "Registration opened.", "Registration closed.", "Submissions opened.", "Submissions closed.", "Results published." The switch shows a pending state until the server confirms; if it fails, it goes back and shows "Couldn't update the event. Try again."
- **Tests.** TC-31, TC-32, TC-33, TC-34, TC-35, TC-103.

#### `/organizer/events/[eventId]/criteria` Criteria and weights (O2, #10)

- **Purpose.** Set the judging criteria, their weights and their max scores.
- **Data and fields.** A list of criteria. Each row: name, weight (%), max score, and a remove action. "Add criterion" adds an empty row.

| Field | Rule | Error text |
|---|---|---|
| Name | Required, up to 60 characters, unique in the event | "Enter a criterion name." / "Each criterion needs a different name." |
| Weight | Whole number 1–100 | "Weight must be a whole number from 1 to 100." |
| Max score | Whole number, at least 1, default 10 (**Decision 6**) | "Max score must be a whole number of at least 1." |

- **Running total.** The total of the weights must be visible at all times while editing, including on phone with
  the keyboard open, and must update as the user types. It must say clearly whether it's exactly 100%, and what's
  missing or over ("Total 90%: 10% left to assign"), by text and not colour alone.
- **Save.** Saves the whole list at once. Rejected unless the total is exactly 100 and there's at least one criterion: "Weights must add up to 100%. They add up to {n}% now." / "Add at least one criterion." (checked on the server too, TC-60). After save: stay, toast "Criteria saved."
- **States.** **Empty (frame):** "No criteria yet. Judges can't score until you add them." with one empty row ready. **Locked (frame):** read-only list with "Criteria are locked because judges have started scoring." No add, remove or save (TC-61).
- **Leaving with unsaved changes.** Confirm: "Discard your changes to the criteria?"
- **Tests.** TC-58, TC-59, TC-60, TC-61, TC-62, TC-63.

#### `/organizer/events/[eventId]/participants` Participants and teams (O3, #11)

- **Purpose.** See everyone registered and every team, and which teams have submitted.
- **Who.** Organizer only (TC-55, TC-57).
- **Two views,** switched with tabs, each with a count in its label:

| View | Columns | Notes |
|---|---|---|
| Participants | Name (links to profile), email, faculty, team (or "No team"), registered on | Sorted by name. A search by name or email |
| Teams | Team name, members (names), member count "{n} of {max}", submission ("Submitted {date}" / "Not submitted") | Opening a team shows its submission read-only: title, description, repository link |

- **States.** **Empty:** "Nobody has registered yet." / "No teams yet."
- **Tests.** TC-52, TC-53, TC-54, TC-56, TC-68.

#### `/organizer/events/[eventId]/ranking` Ranking preview (O5, #16)

- **Purpose.** See the ranking before publishing it, as part of the manual review.
- **Data.** The same table as the published ranking: rank, team, members, total (0–100), plus a "Judges" column with how many judges scored each team, for the manual review. Teams without a submission
  aren't ranked; they're listed under the table as "Not ranked (no submission): {team names}" (**Decision 10**).
- **Notes shown on the page.** "A criterion nobody scored counts as 0 for that team." and "Ties are broken by the highest-weight criterion, then the next."
- **Actions.** "Publish results" (same rules and dialog as the overview). After publishing: the page says "Results were published." and links to the public event page. (As built: no date, because the schema stores no publish time; the overview does the same.)
- **States.** **Not ready (frame):** before submissions close or before criteria exist: "The ranking appears once submissions are closed and criteria are set." **No scores yet:** the table with every total 0 and the line "No scores yet."
- **Tests.** TC-05, TC-101, TC-102, TC-103, TC-105.

#### `/organizer/users` Users and roles (S1, #13)

- **Purpose.** Make a user a judge, or a judge a participant again.
- **Data.** Every user: name (or "No name yet"), email, role, and whether they're on a team (event names). A search by name or email, and a filter by role.
- **Actions, per row.** "Make judge" on a participant, "Make participant" on a judge. Organizers have no action, and nobody can change their own role.
- **Rule.** A participant who's on a team in any event can't become a judge (**Decision 11**). The action is disabled with the reason: "{name} is on a team in {event}, so they can't become a judge."
- **After a change.** The row updates, toast "{name} is now a judge." / "{name} is now a participant." No confirm dialog: the change can be undone right away.
- **States.** **Empty search:** "No users match '{query}'."
- **Tests.** TC-73, TC-74, TC-75, TC-76, TC-77.

### Judge (#43)

#### `/judge` Judging (J1, #8)

- **Purpose.** The judge's home: which events are being judged, which teams to score, and how far along they are.
- **Who.** Judge. Every judge judges every team in every event (**Decision 1**), so there's no assignment step.
- **Data.** Events in judging: submissions closed, results not published, at least one submission. For each event:
  name, criteria count, and progress "{n} of {m} teams scored" (by this judge). Under it, every team that submitted:
  team name, project title, and this judge's status for it: "Not started", "In progress" (some criteria scored) or
  "Scored" (all criteria scored). Each event shows its small logo next to its name.
- **Actions.** Open a team → `/judge/teams/[teamId]`. The list must make the next unscored team easy to find.
- **Other sections.** "Results published": events this judge scored whose results are out, each linking to the public ranking. No actions.
- **States.** **Empty (frame):** "No events are being judged right now. Teams show up here once an organizer closes submissions." **Criteria not set:** the event is listed with "The organizer hasn't set the criteria yet. You can read the projects, but not score them."
- **Tests.** TC-93, TC-94, TC-95.

#### `/judge/teams/[teamId]` Score a team (J1, #8)

- **Purpose.** Read a team's project and score it on each criterion.
- **Data.** Event name; team name and members (names link to profiles); the submission: title, description, repository link (opens in a new tab). The description can be long; the scoring form must still be easy to reach.
- **Scoring form.** One row per criterion: name, weight (%), and a score input with its range shown next to it ("0–{maxScore}"). Scores are whole numbers.

| Rule | Error text |
|---|---|
| Score is a whole number from 0 to the criterion's `maxScore` | "Enter a whole number from 0 to {maxScore}." (TC-02, TC-07) |

- **Saving.** A judge can save with some criteria left empty; the team then shows "In progress" on `/judge`. Primary action: "Save scores", toast "Scores saved." Secondary: "Save and go to next team", which opens the next team in this event that this judge hasn't fully scored. When none are left, it goes to `/judge` with the toast "You've scored every team in {event}."
- **Editing.** Scores stay editable until results are published (**Decision 2**, TC-04). The form shows "Last saved {date, time}".
- **States.**
  - **Submissions still open:** read-only project, no form: "Scoring starts when the organizer closes submissions."
  - **Criteria not set:** "The organizer hasn't set the criteria yet."
  - **Results published (frame):** the judge's scores read-only with "Results are published, so scores can't be changed." and a link to the ranking. A save that arrives after publishing gets the same message.
  - **Team has no submission:** not-found page. Teams without a submission aren't scored.
  - **Unsaved changes:** leaving the page asks "Leave without saving your scores?"
- **Tests.** TC-01, TC-02, TC-03, TC-04, TC-06, TC-07, TC-08 (with decision 1, "unassigned" means a team with no submission or an event not in judging).

## Key flows

### Participant: from account to submission

1. `/register` → creates the account → `/profile`, fills in name and faculty → `/events`.
2. `/events` → opens an event → `/events/[eventId]` → "Register".
3. "Create or join a team" → `/events/[eventId]/team`. One member creates the team and shares the code outside HackHub; the others join with it.
4. **Waits on the organizer** to open submissions (`/organizer/events/[eventId]`).
5. "Submit project" → `/events/[eventId]/team/submit` → back on the team page with "Submitted". Edits are possible until submissions close.
6. **Waits on the organizer** to publish results → the ranking appears on `/events/[eventId]` and is linked from `/my-events`.

### Organizer: from new event to published results

1. `/organizer` → "New event" → `/organizer/events/new` → saved → overview.
2. `/organizer/events/[eventId]/criteria` → criteria, weights totalling 100, max scores → saved.
3. `/organizer/users` → makes the judges judges (before they join any team).
4. Overview → opens registration. The event now shows on **the participants' `/events`**.
5. `/organizer/events/[eventId]/participants` → follows registrations and teams. Closes registration when ready.
6. Overview → opens submissions. Later closes them. **Judges can now score on `/judge`.**
7. Asks the judges whether they've finished (no tracker in HackHub), and checks `/organizer/events/[eventId]/ranking`.
8. "Publish results" → confirm. Scores lock and the ranking shows on **the public `/events/[eventId]`**.

### Judge: scoring every team

1. Logs in → `/judge`. The event shows once **the organizer has closed submissions**.
2. Opens the first "Not started" team → `/judge/teams/[teamId]` → reads the project → enters a score per criterion.
3. "Save and go to next team" until every team is "Scored". Progress on `/judge` reads "{m} of {m} teams scored".
4. Can come back and change scores until **the organizer publishes results**; after that everything is read-only.

## Shared components and patterns

These repeat across screens. Designing each once in the style guide is enough. Only `button` and `card` are
installed today; developers add the rest with `npx shadcn add <name>`.

| Pattern | Where it's used | Builds on (shadcn) | Requirements |
|---|---|---|---|
| Status badge | Event lists, event pages, organizer pages, team and judge lists | Badge | Event values: "Registration open", "Registration closed", "Submissions open", "Submissions closed", "Results published". Item values: "Registered", "Submitted", "Not submitted", "Not started", "In progress", "Scored", "Locked". Each has a text label; colour only adds to it |
| Confirm dialog | Publish results, close submissions, leave team, discard changes | AlertDialog | Title names the action and the object. Body says what changes and whether it can be undone. The confirm button repeats the verb ("Publish results", "Leave team"), the destructive ones use the destructive style. Cancel gets focus first |
| Empty state | Every list | Card (or a plain block) | One sentence saying why it's empty, and the next action as a button when there is one |
| Form field with error | Every form | Label, Input, Textarea, Field (or Form) | Visible label, optional helper text, error text under the field, and the field marked invalid (`aria-invalid`) |
| Data table with phone fallback | Organizer lists, users, rankings, criteria | Table | On phone each row becomes a stacked item showing the key column first (team or person name) and the rest as label/value pairs. Rankings keep rank and total side by side |
| Score input with max | Judge scoring | Input (`type="number"`, `min`, `max`, `step=1`) | The range is visible next to the input, not only in a placeholder |
| Weight row and running total | Criteria | Input, plus a sticky summary | See the criteria screen |
| Switch with status | Event overview | Switch, Label | The current state is written next to the switch ("Open" / "Closed") |
| Toasts | After every save or change | Sonner | Short, past tense, one line. Errors that need action stay in the page, not only in a toast |
| Notice | Locked, closed and published states | Alert | States the rule and, where useful, who can change it |
| Navigation and user menu | App shell | NavigationMenu or plain links, DropdownMenu, Sheet (phone), Avatar (optional) | See [App shell](#app-shell) |
| Tabs | Participants and teams, organizer sub-navigation | Tabs (or links styled as tabs) | Each sub-page has its own URL |
| Copy code | Team page | Button with an icon and text | The code must be easy to read aloud and copy by hand; copying confirms with a toast |
| Skeleton | Loading states | Skeleton | Matches the shape of the content |
| Event images | Event cards, the event page, the organizer event header, `/judge` | `EventBanner`, `EventAvatar` in `components/events/` (plain `<img>` from `/uploads`) | Banner: the organizer's 1600×600 image, 8:3 from md and a taller crop on phone. Logo: a 512×512 rounded square with a ring in the surface colour, so it sits on the banner's edge; sizes sm (40 px), md (64 px), lg (80 px, 112 px from md). Alt text "{event} banner" / "{event} logo"; lazy-loaded below the fold. **Without an image:** a gradient from the theme tokens, picked from a hash of the event name (same name, same colours), with a soft pattern on the banner and the event's initials on the logo; these are decorative (`aria-hidden`), since the name is always written next to them |
| Date input | Event form | Input `type="date"`, or Popover + Calendar | Keyboard entry must work |

## Accessibility and content rules

- **Labels.** Every input has a visible label. A placeholder is never the only label.
- **Focus.** Every interactive element has a visible focus state that uses `ring`. Keyboard order follows the reading
  order. Dialogs trap focus and return it to the button that opened them.
- **Colour.** Never the only signal. Status badges carry text; the running total says "exactly 100%" or the
  difference; the current navigation item and the viewer's ranking row have a non-colour marker.
- **Errors.** Say what's wrong and how to fix it, in one sentence, ending with a full stop. No codes, no "Invalid
  input", no blame. Errors appear next to the field they belong to and are announced to screen readers.
- **Targets.** Buttons, switches and links in lists are at least 44 × 44 px on phone.
- **Dates and times.** Times are stored in UTC and shown in GMT+5 (Tashkent), which is the local time of every
  expected user, without a timezone label. Dates: `26 Oct 2026`. Date and time: `26 Oct 2026, 14:05` (24-hour).
  Date ranges: `29–30 Oct 2026`.
- **Numbers.** Totals are 0–100 with one decimal place (`87.5`). Weights are whole percents (`30%`). Scores show their range (`7 / 10`).
- **Tone.** Plain, short, friendly. Second person ("You're registered"). Sentence case for headings and buttons.
  Buttons are verbs ("Create team", not "Submit"). The product is "HackHub".
- **Names.** Show a user's name; fall back to their email only in organizer views and the user's own menu.

## Out of scope for this release

Don't design these now. They stay in the Backlog, labelled for after the Oct 28 release:

| Card | Item | Note |
|---|---|---|
| #14 | Event schedule and challenge brief (P6, O7) | The event page has no schedule or brief section yet. Leave room for one if that's easy |
| #15 | Judge sees only assigned teams (J2) | Superseded by decision 1. The judge's team list is part of #8 |
| #17 | Judge comments on teams (J3) | No comment box on the judge or team pages |
| #19 | Auto-assign judges (O6) | No judges tab on organizer pages |
| #31 | Team member roles (P7) | No role per member on the team page |
| #18 | Dedicated responsive pass (S2) | The phone frames in this spec are still required. #18 is the later polish pass |
| — | Password reset, email verification, event deletion, unpublishing results, dark mode (unless the style guide includes it) | Not in any card |
