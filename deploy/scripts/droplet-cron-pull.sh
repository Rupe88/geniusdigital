#!/usr/bin/env bash
# Run on the droplet via cron (e.g. every 3 minutes). No inbound SSH from GitHub required.
# Prereq: docker-compose.prod.yml, .env.deploy in DEPLOY_PATH (FRONTEND_IMAGE should use :latest).
set -euo pipefail
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/geniusdigital-frontend}"
cd "$DEPLOY_PATH"
docker compose -f docker-compose.prod.yml --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans
