# Droplet setup (Docker + nginx + TLS)

## Where do I run `mkdir`, `git clone`, and `docker compose`?

**On the DigitalOcean droplet (the Linux server), after you SSH in — not on your Mac/PC.**

```bash
# On YOUR LAPTOP — only this connects you to the server:
ssh root@YOUR_DROPLET_IP

# Everything below runs ON THE SERVER (you should see root@... prompt):
sudo mkdir -p /opt/geniusshiksha-app
sudo git clone git@github.com:Rupe88/geniusdigital.git /opt/geniusshiksha-app
cd /opt/geniusshiksha-app/frontend
cp .env.deploy.example .env.deploy && chmod 600 .env.deploy
docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
```

Or **one script** from the repo (still **on the droplet**, after the repo exists):  
`bash frontend/deploy/scripts/bootstrap-geniusshiksha-app.sh`

### If `git clone` fails (private repo, no credentials on the server)

Copy the project from your laptop (run **on your PC**, in your local repo folder):

```bash
rsync -avz --delete \
  -e "ssh -i /path/to/github_actions_deploy" \
  --exclude node_modules --exclude frontend/node_modules --exclude backend/node_modules \
  --exclude .next --exclude frontend/.next --exclude .git \
  ./  root@YOUR_DROPLET_IP:/opt/geniusshiksha-app/
```

Then SSH in and finish the first deploy:

```bash
ssh root@YOUR_DROPLET_IP
cd /opt/geniusshiksha-app/frontend
cp -n .env.deploy.example .env.deploy && chmod 600 .env.deploy
docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
```

**GitHub Actions** uses `git pull` on the server — add a **Deploy key** (read-only) on the repo and run  
`bash frontend/deploy/scripts/droplet-init-git-for-pull.sh` on the droplet so `/opt/geniusshiksha-app` is a real clone that can `git fetch`.

**Fast path:** **[ONE-COMMAND.md](./ONE-COMMAND.md)** (bootstrap + DNS + nginx).

**Recommended (current):** Monorepo clone on the droplet at **`/opt/geniusshiksha-app`**, deploy with **`docker-compose.build.yml`** (build on server). CI/CD: **repository root** `.github/workflows/deploy-frontend.yml` (SSH on push to `main`). One-time: **`deploy/scripts/bootstrap-geniusshiksha-app.sh`** (or manual clone + `frontend/.env.deploy`).

**Alternative:** GHCR image + cron pull — **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**. **DNS:** **[DNS.md](./DNS.md)**.

This page covers directory layout, nginx, and optional SSH troubleshooting.

One-time steps on the server (Ubuntu). Adjust paths if you prefer another directory.

## 1. Install Docker

Follow [Docker Engine install for Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Add your user to the `docker` group if not using root.

## 2. App directory and env

**Monorepo on droplet (SSH deploy from Actions):**

```bash
sudo mkdir -p /opt/geniusshiksha-app
sudo chown "$USER:$USER" /opt/geniusshiksha-app
# Private repo: use deploy key or PAT — then:
sudo git clone https://github.com/Rupe88/geniusdigital.git /opt/geniusshiksha-app
cd /opt/geniusshiksha-app/frontend
cp .env.deploy.example .env.deploy && chmod 600 .env.deploy
nano .env.deploy   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL
```

Or run **`bash deploy/scripts/bootstrap-geniusshiksha-app.sh`** from the repo (copies env and starts Docker).

**GHCR path (optional):** use `/var/www/geniusdigital-frontend` with only `docker-compose.prod.yml` + `.env.deploy` containing **`FRONTEND_IMAGE`** — see **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**.

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

**Build on droplet (default for `deploy-frontend.yml`):**

```bash
cd /opt/geniusshiksha-app/frontend
docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
```

**Pre-built GHCR image:** use `docker-compose.prod.yml` + `FRONTEND_IMAGE` in `.env.deploy` — see **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**.

## 6. GitHub Actions (monorepo root)

| Workflow | What it does |
|----------|----------------|
| **`.github/workflows/deploy-frontend.yml`** | Lint + `next build` in CI; on push to **`main`**, SSH to droplet → `git pull` in **`/opt/geniusshiksha-app`** → `docker compose -f docker-compose.build.yml` in **`frontend/`**. |

**Repository secrets:** `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (same PEM as in `~/.ssh/authorized_keys` on the droplet).

**Repository name:** workflow runs only when `github.repository == 'Rupe88/geniusdigital'` — fork/adjust if needed.

**Private GitHub repo:** the droplet must be able to `git pull` (deploy key, `git credential`, or cached HTTPS token).

### Nested workflow `frontend/.github/workflows/ci-cd.yml`

Not used when the Git repo root is the monorepo (GitHub only loads **root** `.github/workflows/`). Use the root **`deploy-frontend.yml`** above. The nested file is only relevant if the default branch is a **frontend-only** repo layout.

### GHCR (optional alternative)

- Images: **`ghcr.io/<lowercase owner>/<lowercase repo>`**.
- **Public package:** droplet `docker pull` needs no login.
- **Private package:** `docker login ghcr.io` on the droplet with a PAT (`read:packages`).

### Getting the private key for `DEPLOY_SSH_KEY`

Use the **full PEM** whose public key is in `authorized_keys` on the droplet (e.g. `github_actions_deploy`). Do **not** commit private keys.

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
