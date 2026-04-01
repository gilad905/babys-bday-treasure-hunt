# Baby's Bday Treasure Hunt

Play on: https://gilad905.github.io/babys-bday-treasure-hunt/

## Key security model

This app uses the Google Maps JavaScript SDK in the browser, so a browser key is always public at runtime.

Use two different keys:

1. browser key (public): used by the frontend via `VITE_GOOGLE_MAPS_CLIENT_KEY`
2. server key (secret): used only in the Worker proxy for Street View metadata

Do not reuse your personal unrestricted key in the frontend.

## Frontend env

Create `.env` from `.env.example`:

```env
VITE_GOOGLE_MAPS_CLIENT_KEY=YOUR_PUBLIC_BROWSER_KEY_HERE
VITE_PROXY_BASE_URL=https://your-worker-subdomain.workers.dev
```

Browser key restrictions (Google Cloud Console):

1. API restrictions: only Maps JavaScript API
2. application restrictions: HTTP referrers
3. allowlist only your production origins, for example:
	- `https://gilad905.github.io/*`
4. set quota limits and billing alerts

## Worker proxy (Cloudflare)

The proxy is in `worker/` and exposes:

- `GET /api/streetview/metadata?lat=...&lng=...`

It includes:

1. strict origin allowlist (`ALLOWED_ORIGINS`)
2. per-IP fixed-window rate limiting
3. server-side use of `GOOGLE_MAPS_SERVER_KEY`

### Deploy worker

```bash
cd worker
npm install
npx wrangler secret put GOOGLE_MAPS_SERVER_KEY
npx wrangler deploy
```

Set vars in `worker/wrangler.toml`:

- `ALLOWED_ORIGINS` as comma-separated exact origins
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`

Then set `VITE_PROXY_BASE_URL` in the frontend `.env` to your deployed Worker URL.

## Local development

```bash
npm install
npm run dev
```

If `VITE_PROXY_BASE_URL` is missing, the app falls back to the Google JS Street View service so local development still works.