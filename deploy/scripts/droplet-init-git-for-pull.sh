#!/usr/bin/env bash
# Run ON THE DROPLET after code was copied with rsync (no .git folder).
# Then add this machine's SSH public key to GitHub → Repo → Settings → Deploy keys (read-only).
#   cat /root/.ssh/id_ed25519.pub   # or the key you use for git@github.com
#
set -euo pipefail
ROOT="${1:-/opt/geniusshiksha-app}"
cd "$ROOT"
if [ ! -d .git ]; then
  git init
  git remote add origin git@github.com:Rupe88/geniusdigital.git || true
  git fetch origin 2>/dev/null || { echo "Add deploy key to GitHub, then: git fetch origin && git checkout -b main origin/main"; exit 0; }
fi
echo "Git ready in $ROOT"
