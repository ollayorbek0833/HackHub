# 4. Setup and deployment

> **Status:** checked against the repository on 27 Oct 2026 (Next.js 16, Prisma 7, PostgreSQL 18, Auth.js v5). Local
> setup is final. Production has run at https://hackhub.mekhroj.uz since 26 Oct; the final release deploy is in
> progress, see #28 ("Deploy the system").

## Environments

| Environment | Purpose | URL | Database |
|---|---|---|---|
| Local | Development on each team member's machine | `http://localhost:3000` | Postgres in Docker |
| Production | The deployed system (semester deliverable) | https://hackhub.mekhroj.uz (HTTPS via the host's nginx, behind Cloudflare) | Postgres container on the VPS, with a persistent volume |

## Prerequisites

- Git
- Node.js 22 LTS and npm (CI and the production image use Node 22)
- Docker and Docker Compose (for the local database and for production)

## Local setup

```bash
git clone https://github.com/ollayorbek0833/HackHub.git
cd HackHub
npm install                     # also generates the Prisma client
cp .env.example .env            # then fill in the values: see Configuration
docker compose up -d            # local PostgreSQL 18 on localhost:5432
npx prisma migrate dev          # create the schema
npx prisma db seed              # the first organizer (and demo accounts with SEED_DEMO_USERS=true)
npm run db:seed:demo            # demo events, teams, submissions and scores (local only)
npx playwright install chromium # once, for the end-to-end tests
npm run dev                     # http://localhost:3000
```

In `.env`, set at least `AUTH_SECRET` (`openssl rand -base64 32`), `SEED_ORGANIZER_EMAIL` and `SEED_ORGANIZER_PASSWORD`.
For the demo accounts also set `SEED_DEMO_USERS=true` and `SEED_DEMO_PASSWORD` (at least 8 characters). The accounts
and the two demo events are listed under [Demo data](#demo-data-local-only).

**Postgres 18 volume.** The `postgres:18` image keeps its data in a subdirectory of `/var/lib/postgresql`, so
`docker-compose.yml` mounts the volume at `/var/lib/postgresql`, not at `/var/lib/postgresql/data` as older guides
say. If you still have a volume from an older Postgres version, the container won't start: remove the volume with
`docker compose down -v` (this deletes the local data), then run `docker compose up -d` and the steps above again.

**Port 5432 taken.** If another Postgres already uses port 5432 on your machine, change the host side of `ports` in
`docker-compose.yml` (for example `"5433:5432"`) and the port in `DATABASE_URL` to match.

Before opening a pull request, run what CI runs:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Useful commands:

| Command | What it does |
|---|---|
| `npm run typecheck` | Generates the route types, then runs `tsc --noEmit` |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; starts the app itself) |
| `npx prisma studio` | Browse the database in a web UI |
| `npx prisma migrate dev --name <card>-<change>` | Create a migration after editing `prisma/schema.prisma` ([System design](07-system-design.md#migration-workflow)) |
| `npx prisma migrate reset --force && npx prisma db seed && npm run db:seed:demo` | Start again from a clean local database |

## Configuration

Configuration is read from environment variables, in `.env` locally and set on the server in production.
`.env` is never committed. `.env.example` lists every variable with placeholder values.

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Prisma connection string | `postgresql://hackhub:hackhub@localhost:5432/hackhub` |
| `AUTH_SECRET` | Signs Auth.js sessions | output of `openssl rand -base64 32` |
| `AUTH_URL` | Public URL of the app | `http://localhost:3000` locally, `https://<domain>` in production |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials for the Postgres container | set per environment |
| `SEED_ORGANIZER_EMAIL` / `SEED_ORGANIZER_PASSWORD` | The first organizer, created by `npx prisma db seed` | set per environment |
| `UPLOAD_DIR` | Where event logos and header images are stored. Optional | `./uploads` (the default) locally; `/app/uploads` in the production image |
| `SEED_DEMO_USERS` / `SEED_DEMO_PASSWORD` | Local and CI only, never production: create the demo accounts below, all with this password | `true` / at least 8 characters |

### Demo data (local only)

```bash
npx prisma db seed        # the organizer, plus judge@ and participant1..3@ when SEED_DEMO_USERS=true
npm run db:seed:demo      # demo events, teams and scores; safe to run again; refuses NODE_ENV=production
# clean database:
npx prisma migrate reset --force && npx prisma db seed && npm run db:seed:demo
```

| Account | Role | Password |
|---|---|---|
| `SEED_ORGANIZER_EMAIL` | Organizer (created Demo Hack and Open Hack) | `SEED_ORGANIZER_PASSWORD` |
| `organizer2@hackhub.test` | Organizer (created Second Hack) | `SEED_DEMO_PASSWORD` |
| `judge@hackhub.test` | Judge (has scored Null Pointers) | `SEED_DEMO_PASSWORD` |
| `judge2@hackhub.test` | Judge (nothing scored) | `SEED_DEMO_PASSWORD` |
| `participant1..4@hackhub.test` | Participant, team Null Pointers (submitted) | `SEED_DEMO_PASSWORD` |
| `participant5..6@hackhub.test` | Participant, team Byte Me (submitted) | `SEED_DEMO_PASSWORD` |
| `participant7@hackhub.test` | Participant, team Lone Wolf (no submission) | `SEED_DEMO_PASSWORD` |
| `participant8@hackhub.test` | Participant, registered, no team | `SEED_DEMO_PASSWORD` |

Events: **Demo Hack · judging** (registration and submissions closed, ready for judging and publishing),
**Open Hack · live** (registration and submissions open, no teams) and **Second Hack · upcoming** (organizer2's, still
closed). Each organizer's Events I run lists only their own. Running the demo seed again puts the events back in this
state. Never run it in production.

### Showcase data (wipes the database)

`prisma/seed-showcase.ts` **deletes everything** in the database it points at (every table except `_prisma_migrations`)
and fills it with realistic demo data: 5 organizers, 15 judges and 1,000 participants (Gmail-style emails, `+998` phones,
password `12345678i` for everyone), and 50 events, 10 per organizer: 2 finished, 2 in judging, 2 live with submissions
open, 2 live with registration open and 2 upcoming, with criteria, teams, submissions and scores to match.

- It refuses to run unless `SHOWCASE_CONFIRM=wipe:<database name>` names the database it is connected to, and prints the
  host and database first.
- It runs in one transaction and checks the data (criteria total 100, team sizes, scores only for submitted teams, unique
  emails, phones and invite codes, and more) before committing. If a check fails, it rolls back and the old data stays.
- It's deterministic: running it again gives the same people, events and teams. Event dates are relative to today in
  Tashkent, or to `--today=YYYY-MM-DD`.
- It's never part of a deploy. Back up first (see Backups), then pause automatic deploys while it runs.

```bash
# locally
SHOWCASE_CONFIRM=wipe:hackhub npm run db:seed:showcase
# production, in the migrate image (it has tsx and prisma/)
docker compose -f docker-compose.prod.yml run --rm -e SHOWCASE_CONFIRM=wipe:<db> migrate npx tsx prisma/seed-showcase.ts
```

Afterwards, point `SEED_ORGANIZER_EMAIL` at the first organizer it prints and set `SEED_ORGANIZER_PASSWORD=12345678i`, so
the seed on the next deploy finds that organizer instead of adding a new one.

## Production deployment (VPS + Docker)

The VPS already runs nginx, which terminates HTTPS. The app stack runs in Docker, defined in `docker-compose.prod.yml`:

```
Internet ──▶ Cloudflare ──443──▶ nginx on the host (TLS) ──▶ 127.0.0.1:${APP_PORT} app (Next.js) ──▶ db (PostgreSQL, volume)
                                                 app starts after migrate (one-shot) exits OK
```

- **app** is built from the repo's `Dockerfile`, using Next.js `output: "standalone"` to keep the image small. Its port is published on
  `127.0.0.1:${APP_PORT}` only (3120 on the dev server, which hosts other apps), so it's reachable through nginx and not directly
  from the internet.
- **migrate** is a one-shot container that runs `prisma migrate deploy` and the seed before the app starts.
- **db** keeps its data in a named volume, so it survives restarts and redeploys. It publishes no port.
- **uploads** is a named volume mounted at `/app/uploads` in the app (`UPLOAD_DIR`). It holds the event images, so they
  survive redeploys. Back it up with the database:
  `docker run --rm -v hackhub_uploads:/u -v "$PWD":/b alpine tar czf /b/uploads-$(date +%F).tgz -C /u .`
- nginx allows request bodies up to 12 MB (`client_max_body_size 12m;`) for the image uploads. After changing the repo's
  nginx conf, copy it to the host and run `nginx -t && systemctl reload nginx`.
- **nginx** (on the host, not in Docker) holds the TLS certificate and proxies to the app.

> **In progress, see #28.** This stack has served https://hackhub.mekhroj.uz since 26 Oct. Abdurauf owns the final
> release deploy on Wed 28 Oct and confirms or corrects these steps there.

### First-time server setup

The release runs on the team's dev server (`ssh ideal-dev-server`), checkout `/root/hackhub`. `hackhub.mekhroj.uz` is proxied through
Cloudflare, and nginx uses the Cloudflare origin certificate for `*.mekhroj.uz` that is already on the server, so certbot isn't needed there.
The site config is versioned in [`deploy/nginx/hackhub.mekhroj.uz.conf`](../deploy/nginx/hackhub.mekhroj.uz.conf).

For a new server:

1. Point the domain's DNS at the VPS.
2. Install Docker and the Compose plugin. Ports 80 and 443 stay with nginx; nothing else is opened.
3. Clone the repo on the server and create the production `.env` there. Don't commit it.
   Besides the variables in [Configuration](#configuration), set `APP_PORT` (the host port nginx proxies to) and
   `AUTH_TRUST_HOST=true` (Auth.js then trusts nginx's forwarded headers). Never set `SEED_DEMO_USERS` in production.
4. Copy [`deploy/nginx/hackhub.mekhroj.uz.conf`](../deploy/nginx/hackhub.mekhroj.uz.conf) to
   `/etc/nginx/sites-available/`. Change the server name, the certificate paths (for example from
   `sudo certbot --nginx -d <domain>`) and the upstream port to match `APP_PORT`, and link it into `sites-enabled`.
   Then run `sudo nginx -t && sudo systemctl reload nginx`.

### Deploy

```bash
ssh ideal-dev-server
cd /root/hackhub
git pull
docker compose -f docker-compose.prod.yml up -d --build   # migrate runs first, then the app starts
curl -fsS https://hackhub.mekhroj.uz/api/health
```

The `migrate` service runs `prisma migrate deploy` and the seed (the first organizer only) on every deploy, so
there's no separate migration step. The server hosts other apps: don't stop or change their containers or nginx
sites.

Since 27 Oct these steps run automatically when `master` moves: see [Automatic deploys](#automatic-deploys).

### Backups

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

Take a backup before every deploy that includes a migration.

### Automatic deploys

A systemd timer on the server runs [`deploy/autodeploy.sh`](../deploy/autodeploy.sh) every 2 minutes. When `origin/master`
has moved, it takes a `pg_dump` into `/root/hackhub-backups/` if the new commits add migrations. Then it fast-forwards,
runs the `docker compose` command above and waits up to 2 minutes for `/api/health`. If the check fails, it goes back
to the previous commit, rebuilds that and skips the failed commit until `master` moves again. Migrations are not
reversed. Every run is logged to `/var/log/hackhub-autodeploy.log`. No secrets or SSH keys are in the repository.

```bash
# install or update (as root, in /root/hackhub)
install -m 755 deploy/autodeploy.sh /usr/local/sbin/hackhub-autodeploy
cp deploy/systemd/hackhub-autodeploy.service deploy/systemd/hackhub-autodeploy.timer /etc/systemd/system/
cp deploy/logrotate/hackhub-autodeploy /etc/logrotate.d/
systemctl daemon-reload && systemctl enable --now hackhub-autodeploy.timer

hackhub-autodeploy --dry-run                 # what the next run would do
tail -f /var/log/hackhub-autodeploy.log      # or: journalctl -u hackhub-autodeploy
systemctl stop hackhub-autodeploy.timer      # pause (for example while deploying by hand); start to resume
```

If `master` is ever force-pushed, the timer stops deploying and logs one `ERROR … not a fast-forward`. Check what
changed (`git fetch origin && git diff HEAD origin/master --stat`), then run
`git reset --hard origin/master && systemctl start hackhub-autodeploy.service`.

## Smoke test after a deploy

- [ ] `curl -fsS https://hackhub.mekhroj.uz/api/health` succeeds
- [ ] The home page loads over HTTPS
- [ ] A new user can register and log in
- [ ] The events list loads
- [ ] An organizer can open the organizer area
- [ ] `docker compose -f docker-compose.prod.yml logs app` shows no errors
