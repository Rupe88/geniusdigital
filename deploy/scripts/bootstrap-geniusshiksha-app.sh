#!/usr/bin/env bash
#
# =============================================================================
# WHERE TO RUN THIS
# =============================================================================
# On the DIGITALOCEAN DROPLET (the Ubuntu server), NOT on your laptop.
#
#   1) From your PC, open a shell to the server:
#        ssh root@64.227.182.187
#        # (use your droplet IP and user if different)
#
#   2) Install git if needed:  apt update && apt install -y git
#
#   3) Copy this script onto the server, or clone the repo first and run:
#        cd /opt/geniusshiksha-app
#        bash deploy/scripts/bootstrap-geniusshiksha-app.sh
#
#   Private repo: add a deploy key in GitHub repo → Settings → Deploy keys,
#   or use:  git clone https://github.com/Rupe88/geniusdigital.git
#   with a credential helper / PAT on the server.
# =============================================================================

set -euo pipefail

REPO="${1:-git@github.com:Rupe88/geniusdigital.git}"
TARGET="/opt/geniusshiksha-app"

if [ ! -d "${TARGET}/.git" ]; then
  mkdir -p "$(dirname "$TARGET")"
  echo "Cloning $REPO -> $TARGET ..."
  git clone "$REPO" "$TARGET"
fi

# Repo root is the Next.js app (no frontend/ subfolder on Rupe88/geniusdigital).
cd "${TARGET}"
if [ ! -f .env.deploy ]; then
  cp .env.deploy.example .env.deploy
  chmod 600 .env.deploy
  echo "Created ${PWD}/.env.deploy — edit if needed (defaults are for geniusshiksha.com)."
else
  echo "Using existing ${PWD}/.env.deploy"
fi

docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
echo "Frontend container should listen on 127.0.0.1:3000 — Nginx → https://geniusshiksha.com"
