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

In the repo → **Settings → Secrets and variables → Actions**, add:

| Secret            | Example                         |
|-------------------|---------------------------------|
| `SSH_PRIVATE_KEY` | Contents of the deploy private key |
| `DEPLOY_HOST`     | Droplet IP or hostname          |
| `DEPLOY_USER`     | `root` or deploy user           |
| `DEPLOY_PATH`     | `/var/www/geniusdigital-frontend` |
| `DEPLOY_SSH_PORT` | Optional; default `22`          |

Push to `main` runs deploy after CI; use **Actions → Deploy production → Run workflow** for manual runs.

## Firewall (optional)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
