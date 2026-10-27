#!/usr/bin/env bash
# Deploy origin/main to production when it moves (docs/04 > Automatic deploys).
# Run by hackhub-autodeploy.timer every 2 minutes, from the copy installed at
# /usr/local/sbin/hackhub-autodeploy, so a deploy never rewrites the script
# that is running it.
#
#   hackhub-autodeploy             deploy if origin/main has new commits
#   hackhub-autodeploy --dry-run   fetch and say what would happen, change nothing
#
# A run: fetch, back up the database if the new commits add migrations,
# fast-forward, rebuild with docker compose, then wait for /api/health. If the
# app doesn't come up healthy, it goes back to the previous commit and rebuilds
# that. Migrations are never reversed: the old code runs on the new schema,
# which works for the additive migrations docs/07 allows. A commit that failed
# is remembered and skipped until main moves past it.
#
# It never runs the demo seed and never reads or writes .env (pg_dump runs
# inside the db container, with that container's own POSTGRES_* variables).

set -uo pipefail

REPO_DIR="${HACKHUB_DIR:-/root/hackhub}"
BACKUP_DIR="${HACKHUB_BACKUP_DIR:-/root/hackhub-backups}"
LOG_FILE="${HACKHUB_DEPLOY_LOG:-/var/log/hackhub-autodeploy.log}"
STATE_DIR="${HACKHUB_STATE_DIR:-/var/lib/hackhub-autodeploy}"
LOCK_FILE="${HACKHUB_LOCK_FILE:-/run/lock/hackhub-autodeploy.lock}"
HEALTH_URL="${HACKHUB_HEALTH_URL:-https://hackhub.mekhroj.uz/api/health}"
HEALTH_TIMEOUT="${HACKHUB_HEALTH_TIMEOUT:-120}"
COMPOSE=(docker compose -f docker-compose.prod.yml)

main() {
  local dry_run=false
  [ "${1:-}" = "--dry-run" ] && dry_run=true

  # One run at a time. A run that finds the lock taken just exits.
  exec 9>"$LOCK_FILE"
  flock -n 9 || exit 0

  cd "$REPO_DIR" || fail "no checkout at $REPO_DIR"

  git fetch --quiet origin main || fail "git fetch origin main failed"
  local before after
  before="$(git rev-parse HEAD)"
  after="$(git rev-parse origin/main)"

  if [ "$before" = "$after" ]; then
    $dry_run && log "DRY RUN: up to date at ${before:0:7}, nothing to do"
    exit 0
  fi

  mkdir -p "$STATE_DIR"
  if [ "$after" = "$(cat "$STATE_DIR/failed-sha" 2>/dev/null)" ]; then
    # Already tried and rolled back. Wait for a new commit on main.
    $dry_run && log "DRY RUN: ${after:0:7} failed before; skipping it"
    exit 0
  fi

  # Only a clean checkout of main that can fast-forward.
  [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] ||
    fail "checkout is not on main ($(git rev-parse --abbrev-ref HEAD)); not deploying"
  [ -z "$(git status --porcelain --untracked-files=no)" ] ||
    fail "checkout has local changes; not deploying"
  git merge-base --is-ancestor "$before" "$after" ||
    fail "origin/main ${after:0:7} is not a fast-forward of ${before:0:7}; not deploying"

  local migrations
  migrations="$(git diff --name-only "$before" "$after" -- prisma/migrations)"

  if $dry_run; then
    log "DRY RUN: would deploy ${before:0:7} -> ${after:0:7}" \
      "($(git rev-list --count "$before..$after") commits," \
      "migrations: $([ -n "$migrations" ] && echo yes || echo no))"
    exit 0
  fi

  log "START deploy ${before:0:7} -> ${after:0:7}"

  if [ -n "$migrations" ]; then
    backup "$before" || fail "backup failed; not deploying ${after:0:7}"
  fi

  git merge --quiet --ff-only origin/main || fail "git merge --ff-only failed"

  if build_and_check; then
    rm -f "$STATE_DIR/failed-sha"
    log "OK deployed ${before:0:7} -> ${after:0:7}, health check passed"
    exit 0
  fi

  # Roll back to the commit that was running.
  log "!!! FAILED ${after:0:7}: rolling back to ${before:0:7}" \
    "$([ -n "$migrations" ] && echo "(migrations stay applied; backup in $BACKUP_DIR)")"
  echo "$after" >"$STATE_DIR/failed-sha"
  git reset --quiet --hard "$before"
  if build_and_check; then
    log "!!! ROLLED BACK to ${before:0:7}; ${after:0:7} is skipped until main moves"
  else
    log "!!! ROLLBACK TO ${before:0:7} IS ALSO UNHEALTHY. The site may be down: check by hand"
  fi
  exit 1
}

# Timestamped dump of the production database, before a migration runs.
backup() {
  mkdir -p "$BACKUP_DIR"
  local file
  file="$BACKUP_DIR/hackhub-$(date +%Y%m%d-%H%M%S)-${1:0:7}.sql.gz"
  # shellcheck disable=SC2016  # expanded inside the db container
  if "${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' |
    gzip >"$file" && [ -s "$file" ]; then
    log "backup $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file"
    return 1
  fi
}

# Rebuild and restart the stack (migrate runs before the app), then wait for
# the health check to pass.
build_and_check() {
  if ! "${COMPOSE[@]}" up -d --build >>"$LOG_FILE" 2>&1; then
    log "docker compose up failed (see the output above in this log)"
    return 1
  fi
  local waited=0
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    if curl -fsS -m 5 "$HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 5
    waited=$((waited + 5))
  done
  log "health check $HEALTH_URL didn't pass within ${HEALTH_TIMEOUT}s"
  return 1
}

log() {
  local line
  line="$(date '+%Y-%m-%d %H:%M:%S %z') $*"
  echo "$line" >>"$LOG_FILE"
  echo "$line"
}

fail() {
  log "ERROR $*"
  exit 1
}

main "$@"
