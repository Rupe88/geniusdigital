# Droplet setup (Docker + nginx + TLS)

**Fast path:** **[ONE-COMMAND.md](./ONE-COMMAND.md)** (bootstrap + DNS + nginx).

**Default deploy path (recommended):** GitHub Actions **does not SSH** into the server. It pushes a container to **GHCR**; the droplet **pulls `:latest` on a cron**. See **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**. **DNS:** **[DNS.md](./DNS.md)**.

This page covers directory layout, nginx, and optional SSH troubleshooting.

One-time steps on the server (Ubuntu). Adjust paths if you prefer another directory.

## 1. Install Docker

Follow [Docker Engine install for Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Add your user to the `docker` group if not using root.

## 2. App directory and env

```bash
sudo mkdir -p /var/www/geniusdigital-frontend
sudo chown "$USER:$USER" /var/www/geniusdigital-frontend
```

Create the directory once; you do **not** need a full `git clone` on the droplet for normal CI deploys.

**Speed:** Images are **built on GitHub Actions** (with layer cache) and pushed to **GHCR** (`ghcr.io/<owner>/<repo>`). The droplet only runs `docker compose pull` + `up` (typically **about 1–2 minutes**). The slow `npm ci` / `next build` no longer runs on the VPS.

**`.env.deploy` and CI:** Each deploy **writes** `${DEPLOY_PATH}/.env.deploy`, including **`FRONTEND_IMAGE`** (the exact GHCR tag for that commit) plus `NEXT_PUBLIC_*` from repository Secrets/Variables.

For **manual** deploys, set `FRONTEND_IMAGE` to a tag you have pushed (e.g. `ghcr.io/owner/geniusdigital:sha`) or build locally with `docker-compose.build.yml`.

```bash
cd /var/www/geniusdigital-frontend
cp .env.deploy.example .env.deploy
chmod 600 .env.deploy
nano .env.deploy   # FRONTEND_IMAGE + NEXT_PUBLIC_*
```

## 3. DNS

Point **geniusshiksha.com** and **www.geniusshiksha.com** A records to the droplet public IP.

## 4. nginx + Let’s Encrypt

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Copy `deploy/nginx/geniusshiksha.com.conf` into `/etc/nginx/sites-available/`, symlink `sites-enabled`, then obtain certificates (HTTP must reach the server first):

```bash
sudo certbot certonly --nginx -d geniusshiksha.com -d www.geniusshiksha.com
```

If you prefer certonly with webroot, adjust the `/.well-known` block accordingly. After certs exist, enable the site and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. First container start

After a successful GitHub Actions deploy, `.env.deploy` already exists. **Manual** start (or emergency local build on the server):

```bash
cd /var/www/geniusdigital-frontend
# Production (pre-built image from GHCR):
docker compose -f docker-compose.prod.yml --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans

# Rare: build on the VPS (slow) — use docker-compose.build.yml instead of prod --build
# docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build
```

## 6. GitHub Actions

Workflow: `.github/workflows/ci-cd.yml` — **lint** → **build & push** to **GHCR** (`:sha` and `:latest`). Pushes to `main` skip redundant `npm run build` (Docker build is the production build). PRs still run `npm run build`.

**Default rollout:** the droplet applies updates with a **cron** that runs `docker compose pull` (see **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**). **No SSH secrets are required** for a green pipeline.

### GHCR (container registry)

- Images: **`ghcr.io/<lowercase owner>/<lowercase repo>`** (matches your GitHub repo name).
- **Public package:** droplet `docker pull` needs no login.
- **Private package:** on the droplet, `docker login ghcr.io` once with a PAT (`read:packages`).

### Optional: SSH deploy from Actions (off by default)

Inbound SSH from GitHub-hosted runners often fails (`banner exchange` timeouts). If you still want the workflow to rsync + `docker compose` over SSH, set repository **Variable** **`DEPLOY_USE_SSH`** to **`true`** and configure:

| Name | Secret or Variable? | Notes |
|------|---------------------|--------|
| `DEPLOY_SSH_KEY` | **Secret** | PEM for SSH |
| `DEPLOY_HOST` | Secret or Variable | Droplet IP/hostname |
| `DEPLOY_USER` | Optional | Default `root` |
| `DEPLOY_PATH` | Optional | Default `/var/www/geniusdigital-frontend` |
| `DEPLOY_SSH_PORT` | Optional | Default `22` |
| `GHCR_READ_TOKEN` | Optional | For private GHCR when using SSH job |
| `NEXT_PUBLIC_*` | Optional | Written into `.env.deploy` during SSH deploy |

If you already added `SSH_PRIVATE_KEY`, the SSH job accepts it as a fallback to `DEPLOY_SSH_KEY`.

### Getting the private key text to paste into `DEPLOY_SSH_KEY`

The backend repo does **not** document a special command — GitHub expects the **full private key file** (PEM), same one whose **public** half is in `~/.ssh/authorized_keys` on the droplet.

**If you already generated keys next to the backend** (e.g. `github_actions_deploy` + `github_actions_deploy.pub`):

On your **laptop** (path may differ):

```bash
cat /path/to/genius-digi-lms/backend/github_actions_deploy
```

Copy **everything** from `-----BEGIN OPENSSH PRIVATE KEY-----` through `-----END OPENSSH PRIVATE KEY-----` into the secret `DEPLOY_SSH_KEY` (one secret value, newlines preserved). GitHub accepts multiline secrets.

**If you need to create a new key pair:**

```bash
ssh-keygen -t ed25519 -C "github-actions-to-droplet" -f ./github_actions_deploy -N ""
```

Then put the **public** key on the server (same user you use in `DEPLOY_USER`):

```bash
ssh-copy-id -i ./github_actions_deploy.pub root@YOUR_DROPLET_IP
# or append the contents of github_actions_deploy.pub to ~/.ssh/authorized_keys on the droplet
```

Paste the contents of **`github_actions_deploy`** (private file, never the `.pub`) into `DEPLOY_SSH_KEY` in both backend and frontend repos.

Do **not** commit private keys; keep `github_actions_deploy` out of git (add to `.gitignore`). If a key was ever committed, generate a new pair and rotate.

Push to `main` runs deploy after CI; use **Actions → CI / CD → Run workflow** for manual runs.

## SSH: timeouts, `Connection reset`, `Broken pipe`, `banner exchange`

GitHub Actions uses a **new outbound IP every run**. The droplet must allow **SSH (TCP 22 or your custom port) from the whole internet**, not a single IP.

### 1. DigitalOcean Cloud Firewall (most common)

In **DigitalOcean → Networking → Firewalls**:

- Inbound: **SSH** — **Sources: All IPv4** and **All IPv6** (or `0.0.0.0/0` and `::/0`).
- Ensure this firewall is **attached to the droplet**, or **detach** the firewall to test.

If SSH is restricted to “your home IP only”, CI will **always** fail.

### 2. UFW on the droplet

```bash
sudo ufw allow 22/tcp
sudo ufw reload
sudo ufw status
```

### 3. `fail2ban` / `MaxStartups`

If `fail2ban` jails `sshd`, CI can be banned after a few attempts. Whitelist or relax `sshd`, or increase `findtime` / `maxretry`.

On the droplet, optional:

```text
# /etc/ssh/sshd_config
MaxStartups 30:50:100
```

Then: `sudo systemctl reload sshd`

The workflow **retries** SSH/rsync with backoff and runs a **TCP preflight** so firewall issues fail fast with a clear message.

### 4. IPv6 issues

If DNS returns IPv6 but routing is broken, set repository **Variable** `DEPLOY_SSH_FORCE_IPV4` to `true`, or put the droplet’s **IPv4 address** in `DEPLOY_HOST`.

## Firewall (optional)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
