# DNS for geniusshiksha.com → DigitalOcean droplet

Until DNS points at your server, the browser will show **NXDOMAIN** or “can’t be reached” even if the app runs fine on the droplet.

## Values to enter (Kailash / any DNS host)

| Type | Host / name | Value |
|------|-------------|--------|
| **A** | `@` (apex / blank) | **Your droplet public IPv4** |
| **A** | `www` | **Same IPv4** |

Example (replace if your IP differs): **`64.227.182.187`**

## Where to edit

- **KailashHost / Kailash:** open **DNS / Zone editor** for `geniusshiksha.com` (not only the “Nameservers” page). Add the **A** records there.
- **Propagation:** often minutes, sometimes up to 24–48 hours.

## Verify

```bash
dig geniusshiksha.com +short
dig www.geniusshiksha.com +short
```

Both should return your droplet IPv4.

## After DNS works

Point **nginx** (and **Certbot**) at this host so **https://geniusshiksha.com** serves the app on **127.0.0.1:3000**. See `deploy/DROPLET.md`.

## If the registrar shows an overdue invoice

Pay it — unpaid domains may stop resolving.
