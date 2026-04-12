# Droplet setup (Docker + nginx + TLS)

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

## 6. GitHub Actions secrets

Workflow: `.github/workflows/ci-cd.yml` — **lint** → **build & push Docker image to GHCR** → **deploy** (SSH: sync compose, write `.env.deploy`, `docker compose pull` + `up`). Pushes to `main` skip redundant `npm run build` in CI (the Docker build is the production build). PRs still run `npm run build` for verification.

### GHCR (container registry)

- The workflow publishes to **`ghcr.io/<lowercase owner>/<lowercase repo>`** (same name as your GitHub repo).
- **Public package:** droplet does not need `docker login` for `docker pull`.
- **Private package:** add repository secrets **`GHCR_READ_TOKEN`** (PAT with `read:packages`) and optional **`GHCR_USERNAME`** (GitHub username for that PAT). If unset, login uses `github.repository_owner`.

Use the **same droplet and usually the same SSH key** as **genius-digital-backend** (`DEPLOYMENT.md` there). Each GitHub repo has its own secrets — copy the **values** from the backend repo into this frontend repo (or use **organization secrets** so both repos read the same names).

Configure **either** repository **Secrets** or **Variables** (Settings → Secrets and variables → Actions). **Secrets override Variables** when both exist. Only the SSH private key must be a **Secret**.

| Name | Secret or Variable? | Same as backend? | Example / notes |
|------|---------------------|------------------|-----------------|
| `DEPLOY_SSH_KEY` | **Secret only** | Yes — same PEM as backend | Full private key (`BEGIN` … `END`). Never use Variables for keys. |
| `DEPLOY_HOST` | Secret **or** Variable | Yes — same droplet | e.g. `64.227.182.187` |
| `DEPLOY_USER` | Secret **or** Variable | Yes | Defaults to `root` if unset |
| `DEPLOY_PATH` | Secret **or** Variable | **No** — frontend dir on server | Defaults to `/var/www/geniusdigital-frontend` if unset (backend uses `/opt/genius-digital-backend`) |
| `DEPLOY_SSH_PORT` | Secret **or** Variable | Optional | Defaults to `22` |

**Minimum required for deploy:** `DEPLOY_SSH_KEY` + `DEPLOY_HOST` (or rely on default path/user if your server matches the defaults above).

**Production API / site URL (optional):** Set repository **Variables** (or Secrets) `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` if they differ from the defaults (`https://api.geniusdigi.com/api` and `https://geniusshiksha.com`). These are written into `.env.deploy` on every deploy.

If you already added `SSH_PRIVATE_KEY` instead of `DEPLOY_SSH_KEY`, the workflow still accepts it as a fallback.

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
