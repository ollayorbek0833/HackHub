# Contributing

Thanks for your interest! Bug reports, ideas and pull requests are welcome.

## Getting Started

You need Node.js 22, npm and Docker.

```bash
npm install
cp .env.example .env     # fill in AUTH_SECRET and SEED_ORGANIZER_*
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run db:seed:demo     # optional demo events and accounts (set SEED_DEMO_* in .env first)
npm run dev              # http://localhost:3000
```

The full steps are in [Setup and deployment](docs/04-setup-and-deployment.md). Where code goes, the form pattern and
the per-route guards are in [System design](docs/07-system-design.md).

## Before Opening a Pull Request

CI runs these on every pull request:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run `npm run test:e2e` too when you change a flow the Playwright specs in `e2e/` cover.

- Keep changes focused; one topic per pull request.
- Add or update tests when behaviour changes: unit tests sit next to the code as `*.test.ts`, end-to-end specs in
  `e2e/`.
- Schema changes need a Prisma migration (`npx prisma migrate dev --name <change>`), committed with the change.
- New settings go in `.env.example` with a comment, and in the setup docs.
- Use shadcn components and theme tokens, and check new screens at phone width.
- Write commit messages as a short sentence about the user-visible change, like the existing history.
- Pull requests target `master` and are squash-merged. Each one is tested by someone other than its author.
- Merging doesn't deploy by itself; production is redeployed from `master` afterwards. List anything the server
  needs (new environment variables, a manual step) in the pull request.

## Questions and Security

Ask questions in an [issue](https://github.com/ollayorbek0833/HackHub/issues). Report vulnerabilities privately as
described in [`SECURITY.md`](SECURITY.md).

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
