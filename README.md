# WiFiTruth India

Crowd-measured WiFi quality for hostels, hotels and homestays in India. Travellers search a stay, confirm by GPS that they are really there, run a speed test in the browser, pick where they tested (room, rooftop, reception...) and submit anonymously. Each stay page shows median download, upload and latency, a red / yellow / green bar with the percentage of readings in each band, a per-spot breakdown, the sample count and a confidence label.

- Stack: Next.js 16 (App Router), TypeScript, Tailwind 4, Leaflet + OpenStreetMap, `@cloudflare/speedtest`, Supabase Postgres (optional), Vitest, Playwright.
- No login. A random device id (kept in localStorage) and the IP are stored only as salted SHA-256 hashes. Raw GPS coordinates are never stored or logged; only the distance to the stay is kept.
- Without Supabase credentials the app runs on a local JSON file (`.data/db.json`) seeded with 15 sample stays, so you can try everything locally.

## Rules and bands

- GPS accuracy must be 100 m or better and the visitor within 150 m of the stay (re-checked on the server).
- One reading per device per stay per day (day = IST calendar day).
- Bands by download: Poor < 10 Mbps, Moderate 10 to 25, Good 25 or more (labelled Excellent from 50). Upload below 25% of the band threshold, or latency above 150 ms, downgrades one band.
- Stay and spot figures are medians; readings older than 90 days count half. Confidence: fewer than 3 readings Low, 3 to 9 Medium, 10 or more High.

## Run locally

Requires Node 20+ and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Optional: copy `.env.example` to `.env.local`. For local use nothing is required (a development-only hash salt is used). Data is stored in `.data/db.json` (git-ignored); delete the file to reset.

## Tests and checks

```bash
npm run lint
npm run typecheck
npm test               # Vitest unit and integration tests
npm run build          # production build
npx playwright install chromium   # once
npm run test:e2e       # Playwright (chromium)
```

The e2e suite starts its own dev server on port 3100 with an isolated data file (`.data/e2e.json`, wiped at start) and high rate limits. Geolocation, the speed test engine (`window.__wifiSpeedTestEngine`), OpenStreetMap tiles and Photon search are mocked, so it needs no network. It covers the full submit flow with aggregate and band-bar updates, GPS denied / too far / low accuracy, duplicate and rate-limit messages, adding a missing stay, out-of-India rejection, a mobile viewport flow, axe accessibility checks (home and stay pages), XSS, input validation and header checks.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for Supabase | Project URL, e.g. `https://abcd.supabase.co`. With the key below it switches the app from the JSON file to Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | for Supabase | Service role key. Server-only: never prefix it with `NEXT_PUBLIC_`, never commit it. |
| `HASH_SALT` | production | Secret used to hash device ids and IPs. At least 16 characters, long and random. In production the app refuses submissions (503) if it is missing or short. Do not change it later unless you accept that "one reading per day" resets. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public origin (e.g. `https://wifitruth.vercel.app`) for canonical URLs, Open Graph and the sitemap. Falls back to Vercel's production URL, then `http://localhost:3000`. |
| `DATA_FILE` | no | Path of the local JSON data file (default `.data/db.json`). Ignored when Supabase is configured. |
| `NEXT_PUBLIC_SKIP_LOCATION_CHECK` | no | TESTING ONLY. Set to `true` to skip the GPS check and allow repeat tests. Leave unset for real use. Requires a redeploy to change. |
| `RATE_LIMIT_IP_MAX`, `RATE_LIMIT_DEVICE_MAX`, `RATE_LIMIT_STAY_MAX` | no | Per 10 minutes limits for submissions per IP (20), per device (8) and new stays per IP (10). |

Generate a salt, for example: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Set up Supabase

1. Create a free project at <https://supabase.com> (pick the Mumbai region for India).
2. Open **SQL Editor** > **New query**, paste the whole of `supabase/migrations/20261015000001_init.sql` and click **Run**. It creates the tables, enums, row level security, the aggregate views and the grants.
3. New query again, paste `supabase/seed.sql` and **Run** to load the 15 sample stays (safe to re-run).
4. Open **Project Settings** > **API** (or **Data API**). Copy the **Project URL** and the **service_role** key.
5. Put them in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   HASH_SALT=your-long-random-string
   ```
6. `npm run dev` and submit a reading; check **Table Editor** > `readings` for a row with hashes and a distance, and no coordinates.

Security model: `readings` has row level security on and no policy, and anon/authenticated privileges are revoked, so only the server (service role) can read or write it. The public can read `stays` and the two aggregate views only. The app never uses the anon key.

Alternative with the Supabase CLI: `supabase link --project-ref YOUR-REF` then `supabase db push` (migration) and run `supabase/seed.sql` in the SQL editor.

## Deploy to Vercel

1. Push this repository to GitHub (your own account).
2. At <https://vercel.com/new> import the repository. Framework preset: Next.js. Leave build and output settings at their defaults.
3. Before the first deploy open **Environment Variables** and add, for Production (and Preview if you want it):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as sensitive)
   - `HASH_SALT` (sensitive, 16+ random characters)
   - `NEXT_PUBLIC_SITE_URL` (the URL you will use, e.g. `https://your-app.vercel.app`; add it after the first deploy if you do not know it yet, then redeploy)
4. Click **Deploy**. Without the Supabase variables a deployment would fall back to an ephemeral local file, which is not suitable for production.
5. Verify: open the site, search "Kasol", open a stay, check `/sitemap.xml` and `/robots.txt`. To see GPS and speed tests work you must be physically at a stay (or use a Preview with your own test stay).
6. Optional: add a custom domain under **Settings** > **Domains** and update `NEXT_PUBLIC_SITE_URL`.

## Known limitations

- India check is a bounding box (lat 6.7 to 35.7, lon 68.1 to 97.4). It rejects the rest of the world but still accepts places in neighbouring countries inside the box (Nepal, Bhutan, Bangladesh, Sri Lanka's north, parts of Pakistan and Myanmar).
- Rate limiters are in memory per server instance. On Vercel (serverless) they are best effort; the hard guarantees are the per-day uniqueness constraint in the database and the GPS gates. `X-Forwarded-For` is trusted as set by Vercel.
- GPS validation is client-reported: a determined person can send fake coordinates to the API. Server re-validation stops accidents and casual abuse, not a targeted spoof.
- Anyone can add a stay (rate limited, validated, shown as plain text). There is no moderation queue, so duplicate or junk stays can appear.
- Photon (OSM) search and the Cloudflare speed test depend on third-party endpoints. Packet loss relies on Cloudflare's public TURN server and shows 0 if unavailable. Neither was exercised against the live services in automated tests (mocked).
- Aggregation reads up to the latest readings per stay in app code (Supabase REST caps a response at 1000 rows by default), which is fine for early traffic; move recency weighting into SQL when volume grows.
- The SQL migration was reviewed carefully and checked by static tests but not executed on a live Postgres in this repository's test run. Run it on a fresh Supabase project first.
- Missing stay pages return HTTP 200 with the not-found UI (streamed), though noindex is emitted.
- No CSP header yet (Next inline scripts need nonces). Other security headers are set.

## Roadmap

- Owner verification (deferred): the `stays.claimed_by`, `claimed_at`, `claimed_contact` columns are reserved; v1 has no UI.
- Moderation and merge tools for user-added stays; stricter India boundary polygon.
- Move aggregation and recency weighting to SQL / materialized views; shared rate limiting (Upstash or a Postgres table).
- Reading history over time, ISP name detection, and shareable stay badges.
- CSP with nonces and abuse monitoring.
