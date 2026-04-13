#!/usr/bin/env bash
#
# Run on YOUR LAPTOP where SSH works (same key as CI: github_actions_deploy).
#
#   cd .../frontend
#   export SSH_KEY=../backend/github_actions_deploy
#   # optional for private GHCR: export GHCR_USER=... GHCR_TOKEN=ghp_...
#   bash deploy/scripts/push-to-droplet-from-laptop.sh
#
# Optional: DROPLET=root@64.227.182.187  DEPLOY_PATH=/var/www/geniusdigital-frontend
# If SSH hangs: export SSH_IPV4=1   or test: ssh -F /dev/null -i "$SSH_KEY" -o ConnectTimeout=15 root@IP true

set -euo pipefail

DROPLET="${DROPLET:-root@64.227.182.187}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/geniusdigital-frontend}"
SSH_KEY="${SSH_KEY:-./github_actions_deploy}"

NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.geniusshiksha.com/api}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://geniusshiksha.com}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ghcr.io/rupe88/geniusdigital:latest}"

if [ ! -f "$SSH_KEY" ]; then
  echo "Missing key. Example: export SSH_KEY=../backend/github_actions_deploy"
  exit 1
fi

SSH_EXTRA=(-F /dev/null -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=25 -o ConnectionAttempts=1
  -o ServerAliveInterval=8 -o ServerAliveCountMax=3)
if [ "${SSH_IPV4:-}" = "1" ] || [ "${SSH_IPV4:-}" = "true" ]; then
  SSH_EXTRA=(-4 "${SSH_EXTRA[@]}")
  echo "Using IPv4 only (SSH_IPV4)"
fi

SSH=(ssh "${SSH_EXTRA[@]}" "$DROPLET")
SCP=(scp "${SSH_EXTRA[@]}")

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Testing SSH to ${DROPLET} (fails in ~25s if unreachable; Ctrl+C = cancel)..."
echo "    Manual test: ssh ${SSH_EXTRA[*]} ${DROPLET} 'echo ok'"
"${SSH[@]}" "mkdir -p '$DEPLOY_PATH'"

echo "==> upload compose + cron script"
"${SCP[@]}" docker-compose.prod.yml docker-compose.build.yml "${DROPLET}:${DEPLOY_PATH}/"
"${SCP[@]}" deploy/scripts/droplet-cron-pull.sh "${DROPLET}:${DEPLOY_PATH}/"
"${SSH[@]}" "chmod +x '$DEPLOY_PATH/droplet-cron-pull.sh'"

ENV_LOCAL="$(mktemp)"
printf '%s\n' \
  "FRONTEND_IMAGE=${FRONTEND_IMAGE}" \
  "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" \
  > "$ENV_LOCAL"
"${SCP[@]}" "$ENV_LOCAL" "${DROPLET}:${DEPLOY_PATH}/.env.deploy"
rm -f "$ENV_LOCAL"
"${SSH[@]}" "chmod 600 '$DEPLOY_PATH/.env.deploy'"

if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USER:-}" ]; then
  echo "==> docker login ghcr.io"
  printf '%s' "$GHCR_TOKEN" | "${SSH[@]}" docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

echo "==> docker compose pull + up"
"${SSH[@]}" "cd '$DEPLOY_PATH' && docker compose -f docker-compose.prod.yml --env-file .env.deploy pull && docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans && docker ps && curl -sS -o /dev/null -w 'health HTTP %{http_code}\n' http://127.0.0.1:3000/api/health"

echo "==> Done. Configure DNS (deploy/DNS.md) and nginx + certbot (deploy/DROPLET.md)."
