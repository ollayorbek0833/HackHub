# HackHub

[![CI](https://github.com/ollayorbek0833/HackHub/actions/workflows/ci.yml/badge.svg)](https://github.com/ollayorbek0833/HackHub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 22](https://img.shields.io/badge/node-22-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Live site](https://img.shields.io/badge/live-hackhub.mekhroj.uz-2ea44f)](https://hackhub.mekhroj.uz)

HackHub is a web platform that runs a hackathon from start to finish. Participants register, create a profile with
their skills, browse events, register for one, and create a team or join one with its invite code. Organizers set up
the event, set the judging criteria and their weights, and open and close registration and submissions. Teams submit
their projects. Every judge scores every submitted team against the criteria. HackHub calculates the weighted results,
and the organizer publishes the final ranking.

Live: https://hackhub.mekhroj.uz

## Team

| Person | Role | Responsibilities |
|---|---|---|
| Mehroj Majidov | Project Manager | Runs the process, owns scope and the board, coordinates testing, writes the documentation |
| Ollayorbek Masharipov | Developer | Core build: auth and roles, submissions, responsive layout, judging logic |
| Xurliman Gobenova | Designer | Interface design and the participant-facing screens |
| Abdurauf Qarshiboyev | Developer, organizer side + ops | Organizer features and deployment |
| Abduaziz Kayumov | Mentor | Advises and reviews |

Each card is tested by someone other than the person who built it.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 with shadcn/ui, Prisma 7 with PostgreSQL 18, Auth.js v5
(email and password), zod, Vitest and Playwright. Production runs in Docker behind nginx.

## Getting started

You need Node.js 22, npm and Docker.

```bash
npm install
cp .env.example .env     # fill in AUTH_SECRET and SEED_ORGANIZER_*
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run db:seed:demo     # demo events and accounts (set SEED_DEMO_* in .env first)
npm run dev              # http://localhost:3000
```

The full steps, the demo data and the production deploy are in
[Setup and deployment](docs/04-setup-and-deployment.md).

## Documentation

Project documentation is in [`docs/`](docs/README.md): requirements, scope decisions, architecture, setup and
deployment, user guide, test report, system design and the UI specification.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), and report security issues privately as described
in [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE).
