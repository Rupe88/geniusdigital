# Pull-based deploy (recommended — no SSH from GitHub Actions)

GitHub-hosted runners often **cannot complete SSH** to a droplet (banner timeout, fail2ban, IPv6, VPN/firewall quirks) even when TCP port 22 “looks” open.

**Reliable pattern:** CI **only builds and pushes** the image to **GHCR**. The droplet **pulls** that image on a timer. Nothing connects **inbound** from GitHub to SSH.

**Automated setup:** run **`deploy/scripts/bootstrap-droplet.sh`** on the server (see **[ONE-COMMAND.md](./ONE-COMMAND.md)**). The section below is the manual equivalent.

## 1. One-time on the droplet

Install Docker if needed. Create the app directory:

```bash
sudo mkdir -p /var/www/geniusdigital-frontend
sudo chown "$USER:$USER" /var/www/geniusdigital-frontend
```

Copy these files from the repo (or `scp` from your laptop once):

- `docker-compose.prod.yml`
- `docker-compose.build.yml` (optional)
- `deploy/scripts/droplet-cron-pull.sh`

Create `.env.deploy` (use **`:latest`** so cron always pulls what CI just pushed):

```bash
# Image — must match your GHCR repo (lowercase), tag :latest
FRONTEND_IMAGE=ghcr.io/rupe88/geniusdigital:latest

NEXT_PUBLIC_API_URL=https://api.geniusshiksha.com/api
NEXT_PUBLIC_APP_URL=https://geniusshiksha.com
```

Adjust `rupe88/geniusdigital` to match **your** `ghcr.io/<owner>/<repo>`.

If the GHCR package is **private**:

```bash
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Use a PAT with `read:packages`. Docker stores credentials in `~/.docker/config.json`.

## 2. First manual pull

```bash
chmod +x /var/www/geniusdigital-frontend/droplet-cron-pull.sh
DEPLOY_PATH=/var/www/geniusdigital-frontend /var/www/geniusdigital-frontend/droplet-cron-pull.sh
```

## 3. Cron (automatic deploys every few minutes)

```bash
sudo crontab -e
```

Add (runs every 3 minutes):

```cron
*/3 * * * * DEPLOY_PATH=/var/www/geniusdigital-frontend /var/www/geniusdigital-frontend/droplet-cron-pull.sh >>/var/log/geniusdigital-pull.log 2>&1
```

Create log file once: `sudo touch /var/log/geniusdigital-pull.log && sudo chown $USER:$USER /var/log/geniusdigital-pull.log`

After each push to `main`, CI updates `:latest` on GHCR; within **~3 minutes** the cron applies it.

## 4. nginx

Keep proxying to `127.0.0.1:3000` as in `deploy/nginx/geniusshiksha.com.conf`.

## Optional: disable SSH deploy from Actions

The workflow runs **SSH/rsync** by default after each image push. If GitHub cannot reach your droplet’s SSH port, set repository **Variable** `SKIP_SSH_DEPLOY` to `true` and rely on cron pull above instead.
