#!/usr/bin/env bash
#
# One-time setup on the Ubuntu droplet: directories, compose files from GitHub, .env.deploy,
# docker compose pull/up, optional cron + log. Run as root or with sudo.
#
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/deploy/scripts/bootstrap-droplet.sh | sudo -E bash -s
#   # or clone repo, then:
#   sudo bash deploy/scripts/bootstrap-droplet.sh
#
# Optional environment (defaults work for geniusdigital / geniusshiksha.com):
#   DEPLOY_PATH          default /var/www/geniusdigital-frontend
#   GITHUB_REPO          default Rupe88/geniusdigital  (must match GitHub repo that builds GHCR image)
#   GITHUB_REPO_BRANCH   default main
#   GITHUB_RAW_TOKEN     if repo or files are private: PAT with repo Contents read
#   NEXT_PUBLIC_API_URL
#   NEXT_PUBLIC_APP_URL
#   GHCR_USER            GitHub username for docker login (if GHCR_TOKEN set)
#   GHCR_TOKEN           PAT with read:packages (if GHCR image is private)
#   INSTALL_CRON         set to 1 or yes to install crontab entry

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/geniusdigital-frontend}"
GITHUB_REPO="${GITHUB_REPO:-Rupe88/geniusdigital}"
GITHUB_REPO_BRANCH="${GITHUB_REPO_BRANCH:-main}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.geniusdigi.com/api}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://geniusshiksha.com}"

# GHCR image = ghcr.io/<lowercase owner>/<lowercase repo>:latest (same as CI publish-image job)
REPO_LC="$(echo "$GITHUB_REPO" | tr '[:upper:]' '[:lower:]')"
GHCR_IMAGE_LC="ghcr.io/${REPO_LC}:latest"

RAW_BASE="https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_REPO_BRANCH}"

log() { echo "[bootstrap] $*"; }
die() { echo "[bootstrap] ERROR: $*" >&2; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  die "Install Docker first: https://docs.docker.com/engine/install/ubuntu/"
fi
if ! docker compose version >/dev/null 2>&1; then
  die "Install Docker Compose plugin (docker compose)."
fi

mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

CURL=(curl -fsSL)
if [ -n "${GITHUB_RAW_TOKEN:-}" ]; then
  CURL=(curl -fsSL -H "Authorization: token ${GITHUB_RAW_TOKEN}")
fi

log "Fetching compose files from ${RAW_BASE} ..."
"${CURL[@]}" "${RAW_BASE}/docker-compose.prod.yml" -o docker-compose.prod.yml
"${CURL[@]}" "${RAW_BASE}/deploy/scripts/droplet-cron-pull.sh" -o droplet-cron-pull.sh
chmod +x droplet-cron-pull.sh

if [ ! -s docker-compose.prod.yml ]; then
  die "Could not download docker-compose.prod.yml. Set GITHUB_REPO / GITHUB_REPO_BRANCH or GITHUB_RAW_TOKEN for private repos."
fi

ENV_FILE="${DEPLOY_PATH}/.env.deploy"
if [ ! -f "$ENV_FILE" ]; then
  log "Writing ${ENV_FILE}"
  umask 077
  cat > "$ENV_FILE" <<EOF
FRONTEND_IMAGE=${GHCR_IMAGE_LC}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
EOF
  chmod 600 "$ENV_FILE"
else
  log "Keeping existing ${ENV_FILE} (remove it first to regenerate)"
fi

if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USER:-}" ]; then
  log "Logging in to ghcr.io ..."
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
elif [ -n "${GHCR_TOKEN:-}" ]; then
  die "Set GHCR_USER (GitHub username) together with GHCR_TOKEN for docker login."
fi

log "Pulling image and starting stack ..."
docker compose -f docker-compose.prod.yml --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans

sleep 2
if curl -fsS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health | grep -q 200; then
  log "Health check OK: http://127.0.0.1:3000/api/health"
else
  log "WARN: health check did not return 200 yet; check: docker compose -f docker-compose.prod.yml --env-file .env.deploy logs -f web"
fi

if [ "${INSTALL_CRON:-}" = "1" ] || [ "${INSTALL_CRON:-}" = "yes" ]; then
  CRON_LINE="*/3 * * * * DEPLOY_PATH=${DEPLOY_PATH} ${DEPLOY_PATH}/droplet-cron-pull.sh >>/var/log/geniusdigital-pull.log 2>&1"
  touch /var/log/geniusdigital-pull.log 2>/dev/null || sudo touch /var/log/geniusdigital-pull.log
  ( crontab -l 2>/dev/null | grep -v 'droplet-cron-pull.sh'; echo "$CRON_LINE" ) | crontab -
  log "Cron installed (every 3 min). Log: /var/log/geniusdigital-pull.log"
fi

log "Done. Next:"
log "  1) DNS: point geniusshiksha.com A + www A to this server's public IPv4 (see deploy/DNS.md)."
log "  2) nginx + TLS: copy deploy/nginx/geniusshiksha.com.conf and run certbot (see deploy/DROPLET.md)."
log "  3) If GHCR is public, you may omit GHCR_TOKEN on next pulls."
