# HackHub documentation

HackHub is a web platform that runs a hackathon from start to finish: registration, teams,
project submission, judging and the final ranking. This folder is the project's documentation.
It is a semester deliverable, together with the deployed system.

## Contents

| # | Document | What it covers | Status |
|---|---|---|---|
| 1 | [Requirements](01-requirements.md) | All requirements by role, with priority and MoSCoW class | Complete |
| 2 | [Scope decisions](02-scope-decisions.md) | Requirements scrubbing results, cut items, and product rules | Complete |
| 3 | [Architecture](03-architecture.md) | Components, data model, permission matrix, scoring and assignment logic | Complete (stack: Next.js, Prisma, PostgreSQL) |
| 4 | [Setup and deployment](04-setup-and-deployment.md) | Local setup, demo data, environments, deploy steps | Local setup checked 27 Oct. Production deploy in progress (#28) |
| 5 | [User guide](05-user-guide.md) | How participants, judges and organizers use the platform | Complete for the Oct 28 release; reviewed as one guide on 28 Oct |
| 6 | [Test report](06-test-report.md) | Test approach, test cases from each card's tasks, results | Template. Results are added as features are tested |
| 7 | [System design](07-system-design.md) | Code layout, request flow, Prisma schema v1, frontend patterns, testing and deployment design | Decisions confirmed 26 Oct; matched to the build on 28 Oct |
| 8 | [UI specification](08-ui-spec.md) | UI specification for the designer: screens, contents, states | Every screen built; differences marked "As built" |

## Team

| Person | Role | Responsibilities |
|---|---|---|
| Mehroj Majidov | Project Manager | Runs the process, owns scope and the board, coordinates testing, writes the documentation |
| Ollayorbek Masharipov | Developer | Core build: auth and roles, submissions, responsive layout, judging logic |
| Xurliman Gobenova | Designer | Interface design and the participant-facing screens |
| Abdurauf Qarshiboyev | Developer, organizer side + ops | Organizer features and deployment |
| Abduaziz Kayumov | Mentor | Advises and reviews |

The original charter also had a QA tester, Komil Tohirov, who has since left the team. Testing is now shared:
each card is tested by someone other than the person who built it.

## How we work

- Work is tracked on the Trello board **HackHUB**. Its lists, in order, are Backlog → To do → Ready to Start → In Progress → Completed.
- Every card has one MoSCoW label (Must / Should / Could have) and one or more area labels
  (Participant, Organizer, Judging, Teams, Projects, Auth & Roles, Platform / UI).
- Every card has a **Tasks** checklist. A card moves to Completed only when all of its tasks are checked,
  and it has been tested by someone other than the person who built it.
- Work is planned in weekly sets. Each person has one card due by **Friday 23:30 (GMT+5)**.
