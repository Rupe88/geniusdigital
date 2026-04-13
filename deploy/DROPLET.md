# Droplet setup (Docker + nginx + TLS)

## Where do I run `mkdir`, `git clone`, and `docker compose`?

**On the DigitalOcean droplet (the Linux server), after you SSH in — not on your Mac/PC.**

This repository (**Rupe88/geniusdigital**) is the **Next.js app at the repo root** (there is no `frontend/` subfolder in the clone).

### Recommended: GitHub Actions + GHCR (no full git clone on the server)

CI is **`.github/workflows/ci-cd.yml`**: lint → build/push image to **GHCR** → **SSH** to the droplet → rsync `docker-compose.prod.yml` + `.env.deploy` → `docker compose pull && up`.

- **Deploy directory on the server (default):** `/var/www/geniusdigital-frontend`
- **One-time on the droplet:** install Docker, create the directory, configure **nginx + TLS**, open **SSH + HTTP/HTTPS** in the firewall (see below). You can seed the first run with:

```bash
sudo bash deploy/scripts/bootstrap-droplet.sh
```

(or download that script from `main` per the script header). That pulls `docker-compose.prod.yml` and starts the **GHCR** image; no `git clone` required for deploy.

**GitHub:** set secrets **`DEPLOY_SSH_KEY`**, **`DEPLOY_HOST`**, and optionally **`DEPLOY_USER`** / **`DEPLOY_PATH`**. If the GHCR package is **private**, set **`GHCR_READ_TOKEN`** + **`GHCR_USERNAME`** (or rely on a cron pull — **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**).

### Alternative: clone repo on the droplet and build there (slow on small VPS)

```bash
ssh root@YOUR_DROPLET_IP
sudo mkdir -p /opt/geniusshiksha-app
sudo git clone git@github.com:Rupe88/geniusdigital.git /opt/geniusshiksha-app
cd /opt/geniusshiksha-app
cp .env.deploy.example .env.deploy && chmod 600 .env.deploy
docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
```

Or: **`bash deploy/scripts/bootstrap-geniusshiksha-app.sh`** (clones to `/opt/geniusshiksha-app` if missing).

**Fast path:** **[ONE-COMMAND.md](./ONE-COMMAND.md)** (bootstrap + DNS + nginx).

**DNS:** **[DNS.md](./DNS.md)**.

This page covers directory layout, nginx, and optional SSH troubleshooting.

One-time steps on the server (Ubuntu). Adjust paths if you prefer another directory.

## 1. Install Docker

Follow [Docker Engine install for Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Add your user to the `docker` group if not using root.

## 2. App directory and env

**Default (CI/CD):** Actions rsyncs to **`/var/www/geniusdigital-frontend`** (override with repo variable **`DEPLOY_PATH`**). Ensure the directory exists and is writable by the SSH user:

```bash
sudo mkdir -p /var/www/geniusdigital-frontend
sudo chown "$USER:$USER" /var/www/geniusdigital-frontend
```

First deploy can be **`sudo bash deploy/scripts/bootstrap-droplet.sh`** (downloads compose from GitHub, writes `.env.deploy` with **`FRONTEND_IMAGE`**, pulls GHCR). Or push to **`main`** after GitHub secrets are set — CI will populate the same path.

**Optional — build on the droplet instead of GHCR:** clone the repo and use the repo root (not `frontend/`):

```bash
sudo mkdir -p /opt/geniusshiksha-app
sudo chown "$USER:$USER" /opt/geniusshiksha-app
git clone https://github.com/Rupe88/geniusdigital.git /opt/geniusshiksha-app
cd /opt/geniusshiksha-app
cp .env.deploy.example .env.deploy && chmod 600 .env.deploy
nano .env.deploy   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL
```

Or run **`bash deploy/scripts/bootstrap-geniusshiksha-app.sh`** from a clone.

**GHCR-only path (no clone):** **`docker-compose.prod.yml`** + **`.env.deploy`** with **`FRONTEND_IMAGE`** — see **[PULL-DEPLOY.md](./PULL-DEPLOY.md)**.

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

**Pre-built GHCR image (default CI path):**

```bash
cd /var/www/geniusdigital-frontend
docker compose -f docker-compose.prod.yml --env-file .env.deploy pull
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --remove-orphans
```

(Usually you do not run this by hand — **`.github/workflows/ci-cd.yml`** does it after each push to **`main`**.)

**Build on the droplet (emergency / no registry):**

```bash
cd /opt/geniusshiksha-app   # repo root; adjust path if you cloned elsewhere
docker compose -f docker-compose.build.yml --env-file .env.deploy up -d --build --remove-orphans
```

See **[PULL-DEPLOY.md](./PULL-DEPLOY.md)** for cron-based pull if SSH from Actions is blocked (`SKIP_SSH_DEPLOY=true`).

## 6. GitHub Actions (this repo)

| Workflow | What it does |
|----------|----------------|
| **`.github/workflows/ci-cd.yml`** | Lint → Docker build + push to **GHCR** (`:sha` and `:latest`) → on **`main`**, SSH to droplet → rsync `docker-compose.prod.yml` + `.env.deploy` → `docker compose pull && up` in **`DEPLOY_PATH`** (default **`/var/www/geniusdigital-frontend`**). |

**Repository secrets (recommended):**

| Secret | Purpose |
|--------|--------|
| **`DEPLOY_SSH_KEY`** | Private key PEM (public half in droplet `~/.ssh/authorized_keys`) |
| **`DEPLOY_HOST`** | Droplet **IPv4** (recommended) or DNS name |
| **`DEPLOY_USER`** | Optional; default **`root`** |
| **`DEPLOY_PATH`** | Optional; default **`/var/www/geniusdigital-frontend`** |
| **`GHCR_READ_TOKEN`** | **Only if** the GHCR package is private — PAT with `read:packages` |
| **`GHCR_USERNAME`** | GitHub username for `docker login` when using **`GHCR_READ_TOKEN`** |

**Optional variables:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` (defaults match geniusshiksha.com / api.geniusshiksha.com). **`DEPLOY_SSH_FORCE_IPV4`:** set to `true` if SSH fails over IPv6.

**GHCR visibility:** if the package is **public**, the droplet can `docker pull` without login. If **private**, use **`GHCR_READ_TOKEN`** in CI (or log in on the server once).

### Getting the private key for `DEPLOY_SSH_KEY`

Use the **full PEM** whose public key is in `authorized_keys` on the droplet. Do **not** commit private keys.

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
