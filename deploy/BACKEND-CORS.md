# Backend CORS for geniusshiksha.com

The browser loads the app from **https://geniusshiksha.com** and calls the API (e.g. **https://api.geniusshiksha.com/api**). The API must allow that origin.

## Required backend settings

Add your public frontend origin to CORS allowlist (exact URL, no trailing slash unless your framework expects it):

```text
https://geniusshiksha.com
https://www.geniusshiksha.com
```

Typical Express-style env:

```bash
CORS_ORIGINS=https://geniusshiksha.com,https://www.geniusshiksha.com
FRONTEND_URL=https://geniusshiksha.com
```

If the frontend uses `axios` with `withCredentials: true`, the server must:

- Respond with `Access-Control-Allow-Credentials: true`
- Use a **specific** `Access-Control-Allow-Origin` (not `*`) matching the page origin

After changing CORS, restart the backend and verify in DevTools → Network → a failing request → Response headers.

## Health check

`GET /health` on the API host only proves the process is running. It does not replace correct `NEXT_PUBLIC_API_URL` or CORS configuration.
