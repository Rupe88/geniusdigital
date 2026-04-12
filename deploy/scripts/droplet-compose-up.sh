#!/usr/bin/env bash
# Run on the droplet after .env.deploy and docker-compose.prod.yml are in DEPLOY_PATH.
set -euo pipefail
cd "${DEPLOY_PATH:?}"
docker compose -f docker-compose.prod.yml --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans
