# 4. Setup and deployment

> **Status:** planned setup for the chosen stack: Next.js + Prisma + PostgreSQL, self-hosted on a VPS with Docker
> (see [Architecture](03-architecture.md#technology-stack)). The app hasn't been scaffolded yet. When it is, check each
> command against the real project, and fill in each _TBD_. That's the job of the "Deploy the system" card.

## Environments

| Environment | Purpose | URL | Database |
|---|---|---|---|
| Local | Development on each team member's machine | `http://localhost:3000` | Postgres in Docker |
| Production | The deployed system (semester deliverable) | https://hackhub.mekhroj.uz (HTTPS via the host's nginx, behind Cloudflare) | Postgres container on the VPS, with a persistent volume |

## Prerequisites

- Git
- Node.js 20 LTS or newer, and npm
- Docker and Docker Compose (for the local database and for production)

## Local setup

```bash
git clone https://github.com/ollayorbek0833/HackHub.git
cd HackHub
npm install
cp .env.example .env            # then fill in the values below
docker compose up -d db         # local PostgreSQL
npx prisma migrate dev          # create the schema
npm run dev                     # http://localhost:3000
```

Useful commands:

| Command | What it does |
|---|---|
| `npx prisma studio` | Browse the database in a web UI |
| `npx prisma migrate dev --name <change>` | Create a migration after editing `prisma/schema.prisma` |
| `npm test` | Unit tests (Vitest) |
| `npx playwright test` | End-to-end tests |

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
| `SEED_ORGANIZER_EMAIL` | Organizer | `SEED_ORGANIZER_PASSWORD` |
| `judge@hackhub.test` | Judge (has scored Null Pointers) | `SEED_DEMO_PASSWORD` |
| `judge2@hackhub.test` | Judge (nothing scored) | `SEED_DEMO_PASSWORD` |
| `participant1..4@hackhub.test` | Participant, team Null Pointers (submitted) | `SEED_DEMO_PASSWORD` |
| `participant5..6@hackhub.test` | Participant, team Byte Me (submitted) | `SEED_DEMO_PASSWORD` |
| `participant7@hackhub.test` | Participant, team Lone Wolf (no submission) | `SEED_DEMO_PASSWORD` |
| `participant8@hackhub.test` | Participant, registered, no team | `SEED_DEMO_PASSWORD` |

Events: **Demo Hack · judging** (registration and submissions closed, ready for judging and publishing) and
**Open Hack · live** (registration and submissions open, no teams). Running the demo seed again puts both events
back in this state. Never run it in production.

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
- **nginx** (on the host, not in Docker) holds the TLS certificate and proxies to the app.

### First-time server setup

The release runs on the team's dev server (`ssh ideal-dev-server`), checkout `/root/hackhub`. `hackhub.mekhroj.uz` is proxied through
Cloudflare, and nginx uses the Cloudflare origin certificate for `*.mekhroj.uz` that is already on the server, so certbot isn't needed there.
The site config is versioned in [`deploy/nginx/hackhub.mekhroj.uz.conf`](../deploy/nginx/hackhub.mekhroj.uz.conf).

For a new server:

1. Point the domain's DNS at the VPS.
2. Install Docker and the Compose plugin. Ports 80 and 443 stay with nginx; nothing else is opened.
3. Clone the repo on the server and create the production `.env` there. Don't commit it.
4. Add the site to nginx and get a certificate (for example `sudo certbot --nginx -d <domain>`), then `sudo nginx -t && sudo systemctl reload nginx`:

```nginx
# /etc/nginx/sites-available/hackhub  (TLS certificate managed on the host, e.g. certbot)
server {
    listen 443 ssl http2;
    server_name <domain>;
    ssl_certificate     /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
server {
    listen 80;
    server_name <domain>;
    return 301 https://$host$request_uri;
}
```

### Deploy

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build   # migrate runs first, then the app starts
curl -fsS https://<domain>/api/health
```

### Automatic deploys

A systemd timer on the server runs [`deploy/autodeploy.sh`](../deploy/autodeploy.sh) every 2 minutes. When `origin/main`
has moved, it takes a `pg_dump` into `/root/hackhub-backups/` if the new commits add migrations. Then it fast-forwards,
runs the `docker compose` command above and waits up to 2 minutes for `/api/health`. If the check fails, it goes back
to the previous commit, rebuilds that and skips the failed commit until `main` moves again. Migrations are not
reversed. Every run is logged to `/var/log/hackhub-autodeploy.log`. No secrets or SSH keys are in the repository.

```bash
# install or update (as root, in /root/hackhub)
install -m 755 deploy/autodeploy.sh /usr/local/sbin/hackhub-autodeploy
cp deploy/systemd/hackhub-autodeploy.service deploy/systemd/hackhub-autodeploy.timer /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now hackhub-autodeploy.timer

hackhub-autodeploy --dry-run                 # what the next run would do
tail -f /var/log/hackhub-autodeploy.log      # or: journalctl -u hackhub-autodeploy
systemctl stop hackhub-autodeploy.timer      # pause (for example while deploying by hand); start to resume
```

### Backups

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

Take a backup before every deploy that includes a migration.

## Smoke test after a deploy

- [ ] The home page loads over HTTPS
- [ ] A new user can register and log in
- [ ] The events list loads
- [ ] An organizer can open the organizer area
- [ ] `docker compose -f docker-compose.prod.yml logs app` shows no errors
