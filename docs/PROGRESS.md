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

## Test results
- Vitest: 5 files, 23 tests pass. ESLint and `tsc` clean. `next build` clean (no warnings).
- Playwright (chromium, mocked geolocation): 8 pass (smoke removed from count: smoke, GPS ok/too far/low accuracy/denied, search, add stay, outside India).
