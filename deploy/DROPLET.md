# Droplet setup (Docker + nginx + TLS)

One-time steps on the server (Ubuntu). Adjust paths if you prefer another directory.

## 1. Install Docker

Follow [Docker Engine install for Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Add your user to the `docker` group if not using root.

## 2. App directory and env

```bash
sudo mkdir -p /var/www/geniusdigital-frontend
sudo chown "$USER:$USER" /var/www/geniusdigital-frontend
```

Copy the project here (first deploy: `git clone` or `rsync` from your machine). GitHub Actions will **rsync** on each deploy; **do not** commit `.env.deploy`.

```bash
cd /var/www/geniusdigital-frontend
cp .env.deploy.example .env.deploy
chmod 600 .env.deploy
nano .env.deploy   # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_APP_URL
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

```bash
cd /var/www/geniusdigital-frontend
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --build
```

## 6. GitHub Actions secrets

Workflow: `.github/workflows/ci-cd.yml` (lint + build on every PR/push; deploy only on `main` after a successful build, or via **Actions → Run workflow**).

Use the **same droplet and usually the same SSH key** as **genius-digital-backend** (`DEPLOYMENT.md` there). Each GitHub repo has its own secrets — copy the **values** from the backend repo into this frontend repo (or use **organization secrets** so both repos read the same names).

In **this** repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Secret | Same as backend? | Example / notes |
|--------|------------------|-----------------|
| `DEPLOY_SSH_KEY` | Yes — **same PEM** as backend (`github_actions_deploy` private key) | Full key including `BEGIN` / `END` lines |
| `DEPLOY_HOST` | Yes — same server | e.g. `64.227.182.187` |
| `DEPLOY_USER` | Yes | e.g. `root` |
| `DEPLOY_PATH` | **No** — frontend directory on the server | e.g. `/var/www/geniusdigital-frontend` (backend uses `/opt/genius-digital-backend`) |
| `DEPLOY_SSH_PORT` | Optional | Default SSH `22` |

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

## Firewall (optional)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
