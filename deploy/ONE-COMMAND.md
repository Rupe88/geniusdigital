# Droplet setup (one path, minimal mistakes)

Do these **in order**.

## 0) From your laptop (SSH works here; GitHub Actions / Cursor often cannot)

If you have `github_actions_deploy` and SSH works to the droplet:

```bash
cd /path/to/frontend
export SSH_KEY=/path/to/github_actions_deploy
bash deploy/scripts/push-to-droplet-from-laptop.sh
```

This uploads compose + `.env.deploy` and runs `docker compose pull` / `up`. Use `GHCR_USER` + `GHCR_TOKEN` if the GHCR package is private.

## 1) DNS (at Kailash / your DNS host)

Add **A** records: `@` and `www` → **droplet public IPv4** (see `deploy/DNS.md`).

## 2) On the droplet (SSH as root)

**Option A — pipe from GitHub (public repo):**

```bash
curl -fsSL https://raw.githubusercontent.com/Rupe88/geniusdigital/main/deploy/scripts/bootstrap-droplet.sh | sudo -E bash -s
```

**Private repo:** clone the repo on the server, `cd` into it, then:

```bash
sudo bash deploy/scripts/bootstrap-droplet.sh
```

**Private GHCR image** (docker login once):

```bash
export GHCR_USER=your_github_username
export GHCR_TOKEN=ghp_xxxxxxxx        # read:packages
```

Then run bootstrap again or run `docker login` before bootstrap.

**Install cron** (auto pull every 3 minutes after each CI push):

```bash
sudo INSTALL_CRON=yes bash deploy/scripts/bootstrap-droplet.sh
```

(if you already ran bootstrap without cron, run again with `INSTALL_CRON=yes` or add the line from `deploy/PULL-DEPLOY.md` manually.)

## 3) nginx + HTTPS

If you used **git clone** on the server:

```bash
sudo cp deploy/nginx/geniusshiksha.com.conf /etc/nginx/sites-available/geniusshiksha.com
```

If you only ran **curl** for bootstrap, fetch the sample config:

```bash
sudo curl -fsSL -o /etc/nginx/sites-available/geniusshiksha.com \
  https://raw.githubusercontent.com/Rupe88/geniusdigital/main/deploy/nginx/geniusshiksha.com.conf
```

Then:

```bash
sudo ln -sf /etc/nginx/sites-available/geniusshiksha.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d geniusshiksha.com -d www.geniusshiksha.com
```

(Adjust `server_name` in the file if needed; install `certbot` + `python3-certbot-nginx` if missing.)

## 4) Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/health
```

Expect **200**. Then open **https://geniusshiksha.com** in a browser (after DNS propagates).
