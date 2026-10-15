# Progress

## M1 Scaffold (done)
- Next.js 16 (App Router) + TypeScript + Tailwind 4, ESLint (next core-web-vitals + typescript), Vitest, Playwright (chromium) configured.
- Layout: `src/app` (pages, `api/`), `src/components`, `src/hooks`, `src/lib` (pure logic + `data/` layer), `e2e/`, `supabase/`.
- `.env.example` (Supabase vars optional, `HASH_SALT` for M6). Secrets go in `.env.local` (git-ignored).
- Run: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.

## M2 Database (done)
- `supabase/migrations/20261015000001_init.sql`: `stays`, `readings`, enums `stay_kind` and `spot`, RLS (public read on stays; readings have no policy so only the service role writes/reads), views `stay_aggregates` and `spot_aggregates` (medians), unique (stay, device, day), `claimed_*` columns reserved. `supabase/seed.sql`: 15 sample stays (Kasol, Manali, Rishikesh, Goa, Bengaluru, more).
- Data layer `src/lib/data`: `DataStore` interface; Supabase REST adapter (used when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set); in-memory adapter with JSON persistence at `.data/db.json` (used otherwise, seeded from `seed.ts`).
- SQL is NOT executed against a real Supabase instance yet (no credentials); review before first apply.
- Tests: memory store, seed, duplicate rule, medians, persistence.

## M3 Stay search (done)
- `GET /api/search?q=` Photon proxy (India bbox, countrycode IN filter, 10 min in-memory TTL cache, 5s timeout, graceful fallback). `GET/POST /api/stays` (local search; add stay with validation, India bbox, OSM dedupe).
- UI: debounced (300 ms) search on `/` showing known stays and OSM places immediately as each source returns; picking an OSM place creates/reuses the stay; "Add it" manual form.
- Note: live Photon was not reachable from the build machine, so only the normalizer is tested (fixtures); the UI degrades to local results.

## M4 GPS validation (done)
- `src/lib/geo.ts`: haversine, `evaluateLocation` (accuracy <= 100 m, distance <= 150 m, accuracy checked first), `validateLocationServer` used by `POST /api/stays/[id]/validate-location` for server re-validation.
- `useGeolocation` hook and `LocationCheck` component on `/stays/[id]` with states: denied, unavailable, timeout, low accuracy, too far, ok.
- Raw coordinates are not stored; only the distance result is returned.

## M5 Speed test (done)
- `src/lib/speedtest`: `SpeedTestEngine` interface, Cloudflare wrapper (`createCloudflareEngine`, results converted to Mbps/ms/% and AIM result logging disabled), pure progress helpers. `resolveEngine()` uses `window.__wifiSpeedTestEngine` when present so Playwright can inject a mock (`e2e/helpers.ts: mockSpeedEngine`).
- UI: `SpeedTest` (spot picker, progress bar, live metrics) inside `StayMeasure`; locked until the GPS check passes.
- Packet loss uses Cloudflare's public TURN server; if unavailable it is reported as 0 (not measured). Not exercised against the real Cloudflare endpoints from the build machine.

## M6 Submission API (done)
- `POST /api/readings` (thin route) -> `src/lib/submit-reading.ts` (dependency-injected, unit tested): IP rate limit (20 / 10 min) before parsing, device rate limit (8 / 10 min) after parsing, body parsing and sanity limits (`src/lib/readings.ts`), stay lookup, server re-validation via `validateLocationServer`, insert. Stored: salted SHA-256 of device id and IP, distance in metres, spot, values. No raw coordinates.
- One reading per device per stay per day (day = IST calendar day) enforced by the store (unique constraint in Supabase). Friendly messages with stable `code` (`duplicate`, `rate_limited` + `Retry-After`, `too_far`, `low_accuracy`, etc.).
- `HASH_SALT` required in production (503 `server_misconfigured` if missing); non-production uses a fixed non-secret dev salt. Rate limiters are in-memory per server instance (best effort on serverless).
- `DataStore.listReadings` added (memory + Supabase). Client device id lives in localStorage (`src/lib/device-id.ts`). `StayMeasure` has the submit step. Playwright uses `DATA_FILE=.data/e2e.json` so tests do not touch dev data.

## M7 Aggregation and bands (done)
- `src/lib/scoring.ts` (pure): `bandFor` (Poor <10, Moderate 10-25, Good >=25; upload < 25% of the reached band's download threshold = one downgrade; latency > 150 ms = one downgrade; both can apply, floor Poor; "Excellent" label = undowngraded Good with download >= 50), `weightedMedian`, `recencyWeight` (<= 90 days 1.0, older 0.5), `confidenceFor` (<3 Low, 3-9 Medium, >=10 High, by raw count), `toPercentages` (whole numbers summing to 100), `summarize`, `summarizeStay` (per-spot breakdown).
- Interpretation choices: stay/spot band is computed from the weighted medians; band percentages are recency-weighted shares of readings (each reading banded individually).
- `src/lib/stay-summary.ts` and `GET /api/stays/[id]/summary` (stay + summary + spots); `getHomeLists` (recent = latest readings; top = >= 3 readings, ranked by band then median download).
- Tests: 36 scoring tests (thresholds, boundaries, downgrades, weighting, percentages, empty/single) + service tests.

## M8 Stay page and dashboard (done)
- Stay page (`/stays/[id]`): `StaySummaryCard` (median download/upload/latency in Mbps/ms, Poor/Moderate/Good/Excellent badge, red/yellow/green `BandBar` with a percentage legend, sample count, last-tested recency, confidence, per-spot breakdown with mini bars), Leaflet map (`StayMap`, plain leaflet, OSM tiles, circle marker so no image assets are needed), then the verify / speed test / submit flow. The page refreshes after a successful submit.
- Home: hero, search, "Top stays" (>= 3 readings) and "Recently tested" lists via `StayCard`.
- Playwright: `e2e/dashboard.spec.ts` creates a fresh stay and readings through the API, then checks aggregates, band percentages, spots, home lists.

## M9 Polish (done)
- Mobile-first layout, shared header/footer with privacy note, `/privacy` page, skip link, visible focus ring, reduced-motion support, labels on all inputs, text colours of at least slate-700 on white, band shown by text and percentage as well as colour, progress bar with ARIA values, `aria-live` for status messages.
- States: root `loading.tsx`, `error.tsx` (uses `retry`, the Next 16 API), `not-found.tsx`, empty states (no readings, empty home lists), home list failure message, map failure fallback.
- SEO: title template, per-stay `generateMetadata` (title and description include band, Mbps and sample count), Open Graph/Twitter basics, canonical paths, `robots.txt` (disallows `/api/`). No sitemap, and `metadataBase` is not set (needs the deploy URL).
- Rate-limit and duplicate messages are shown in yellow with plain wording; limits can be overridden by `RATE_LIMIT_IP_MAX` / `RATE_LIMIT_DEVICE_MAX`.
- Known: a missing stay returns HTTP 200 with the not-found UI (streamed through `loading.tsx`), noindex is still emitted by Next.

## Test results (after M9)
- Vitest: 11 files, 96 tests pass. ESLint and `tsc` clean. `next build` clean.
- Playwright (chromium, mocked geolocation and speed test engine): 17 pass.
