# 1. Requirements

## Product summary

Participants register, create a profile with their skills, browse events, register for one, and create a team or join
one with its invite code. Organizers set up the event, set the judging criteria and their weights, and open and close
registration and submissions. Teams submit their projects. Every judge scores every submitted team against the
criteria. The platform calculates the weighted results, and the organizer publishes the final ranking.

For the Oct 28 release there's no matchmaking (teams form outside the platform), no judge assignment (every judge
scores every team, Decision 1), and the event schedule and challenge brief come after the release. The requirements
below are the original list; [Scope decisions](02-scope-decisions.md#product-rules) has the binding rules.

## Roles

| Role | Who it is | Main goal |
|---|---|---|
| Participant | A student taking part in the hackathon | Register, form a team, submit a project |
| Judge | A person who scores projects | Score every submitted team fairly against the criteria |
| Organizer | The person running the event | Set up the event, manage the process, publish the results |

## Priority scale

Each requirement was scored from 1 to 10 during requirements scrubbing. For each one we also recorded how
stakeholders would react if it was built and if it wasn't.

| Score | MoSCoW class |
|---|---|
| 10 | Must have |
| 8–9 | Should have |
| 6–7 | Could have |
| 1–3 | Cut (see [Scope decisions](02-scope-decisions.md)) |

## Requirements

### Participant

| ID | Requirement | Priority | Class | If built | If not built |
|---|---|---|---|---|---|
| P1 | Register with email and password, and log in | 10 | Must | Extremely happy | Ultra unhappy |
| P2 | Create a profile with name, faculty and skills (bio and contact links are optional) | 10 | Must | Very happy | Unhappy |
| P3 | Browse open events and register for one | 10 | Must | Happy | Not happy |
| P4 | Create a team or join an existing one | 10 | Must | Very happy | Extremely unhappy |
| P5 | Submit a project: title, description and repository link | 10 | Must | Happy | Unhappy |
| P6 | See the event schedule and challenge brief | 9 | Should | Happy | Unhappy |
| P7 | Team member roles inside a team (for example developer, designer, presenter) | 7 | Could | Happy | Not happy |

### Judge

| ID | Requirement | Priority | Class | If built | If not built |
|---|---|---|---|---|---|
| J1 | Score each assigned team against the published criteria | 10 | Must | Happy | Unhappy |
| J2 | Log in and see only the teams assigned to them | 9 | Should | Happy | Unhappy |
| J3 | Leave a short written comment for each team | 8 | Should | Happy | Unhappy |

### Organizer

| ID | Requirement | Priority | Class | If built | If not built |
|---|---|---|---|---|---|
| O1 | Create an event with a name, dates and description | 10 | Must | Extremely happy | So not happy |
| O2 | Set the judging criteria and their weights | 10 | Must | Happy | Unhappy |
| O3 | See all registered participants and teams | 10 | Must | Needed, so happy | Unhappy |
| O4 | Open and close registration and submissions | 10 | Must | Happy | Unhappy |
| O5 | See the final ranking, calculated automatically from judge scores | 9 | Should | Happy | Unhappy |
| O6 | Auto-assign judges to teams (replaces manual assignment) | — | Should (provisional) | — | — |
| O7 | Publish the event schedule and challenge brief (organizer side of P6) | 9 | Should | — | — |

### System-wide

| ID | Requirement | Priority | Class | If built | If not built |
|---|---|---|---|---|---|
| S1 | Three roles with separate permissions: participant, judge, organizer | 10 | Must | Happy | Unhappy |
| S2 | Works on both phone and desktop screens | 8 | Should | Happy | Unhappy |

### Project deliverables (non-functional)

| ID | Deliverable | Class |
|---|---|---|
| D1 | UI design and mockups for the main screens | Must |
| D2 | Test plan and QA for every Must have feature | Must |
| D3 | A deployed system with a public URL | Must |
| D4 | Project documentation (this folder) | Must |

## Traceability to the original requirement list

The original charter listed 20 numbered requirements. Here is where each one ended up:

| Original # | Requirement | Now |
|---|---|---|
| 1 | Register and log in | P1 |
| 2 | Profile with name, faculty, skills | P2 |
| 3 | Browse and register for events | P3 |
| 4 | Create or join a team | P4 |
| 5 | List of participants looking for a team | **Cut** |
| 6 | Submit a project | P5 |
| 7 | Edit the submission until the deadline | Cut, then brought back on 26 Oct as part of P5: edit while submissions are open ([Scope decisions](02-scope-decisions.md#items-brought-back)) |
| 8 | Event schedule and challenge brief | P6 (+ O7) |
| 9 | Judge sees only assigned teams | J2 |
| 10 | Score teams against criteria | J1 |
| 11 | Comment per team | J3 |
| 12 | See which teams are not yet scored | **Cut** |
| 13 | Create an event | O1 |
| 14 | Criteria and weights | O2 |
| 15 | See participants and teams | O3 |
| 16 | Assign judges to teams (manual) | **Replaced** by O6 |
| 17 | Open and close registration and submissions | O4 |
| 18 | Final ranking | O5 |
| 19 | Three roles with permissions | S1 |
| 20 | Phone and desktop | S2 |
| — | Team member roles (added during scrubbing) | P7 |

## Detailed behaviour

The step-by-step behaviour of each requirement is kept in the **Tasks** checklist of its Trello card. The
[test report](06-test-report.md) turns those tasks into test cases.
