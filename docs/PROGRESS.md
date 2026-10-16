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

## M10 E2E and hardening (done)
- E2E: Playwright now runs its own dev server on port 3100 (`reuseExistingServer: false`), wipes `.data/e2e.json` at start (`e2e/reset-data.mjs`), stubs OSM tiles and Photon, mocks geolocation and the speed engine. New specs: `flows` (full submit flow with aggregate and red/yellow/green percentages 50/50 -> 33/67, GPS denied / too far / low accuracy, duplicate, rate-limit message, add stay then test it, out-of-India, mobile viewport flow), `a11y` (axe wcag2a/2aa/21a/21aa on home, stay with and without readings), `hardening` (XSS, validation, no leaks, no stored raw coordinates, headers, sitemap/robots, canonical). 35 tests; full suite run 3 times consecutively, all green. Rate limit UI is tested with a mocked 429 (the real limiter is unit tested; e2e limits are raised).
- Hardening fixes: Leaflet tooltip rendered the stay name as HTML (stored XSS) -> now a text node; non-UUID stay ids reached Supabase and produced 500s -> `isUuid` guard on all id routes and the stay page; JSON body size cap (8 KB, 413) via `readJson`; try/catch on every route (generic messages only); new-stay rate limit (10 / 10 min / IP) and control/bidi character stripping, osm type restricted to N/W/R; `HASH_SALT` must be 16+ chars in production; security headers (nosniff, DENY framing, referrer, permissions-policy geolocation=self), `X-Powered-By` removed.
- Supabase adapter: duplicate only on Postgres code 23505 (other 409s throw), OSM-unique race returns the existing stay, search now matches name/city/state with filter-syntax characters stripped (parity with the memory store); unit tests with mocked fetch.
- SQL review fixes: revoke default anon/authenticated privileges then grant read-only on stays and the views, `security_invoker = false` explicit, `reading_day` default IST (app always supplies it), length checks on city/state, osm_type in N/W/R, osm pair constraint, osm_id > 0. Static tests in `src/lib/migration.test.ts`. Still not executed on a live Postgres (none available locally).
- Docs: README (run, tests, env, Supabase setup, Vercel deploy, limitations, roadmap), `metadataBase` from `NEXT_PUBLIC_SITE_URL` (fallback Vercel production URL, then localhost), `sitemap.xml` (home, privacy, all stays), robots references the sitemap.
- Known gap found: the India bbox accepts Nepal/Bangladesh/north Sri Lanka points; documented, polygon is on the roadmap.

## Final gate (after M10)
- ESLint, `tsc`, `next build` clean. Vitest: 15 files, 120 tests pass. Playwright: 35 pass, 3 consecutive runs.

# v2 (see docs/PLAN-V2.md)

## v2 M1 Data and rules (done)
- `src/lib/lodging.ts`: OSM allow-list (tourism hotel, motel, hostel, guest_house, apartment, chalet, resort, camp_site, alpine_hut, wilderness_hut; leisure=resort) and mapping to `stay_kind` (motel->hotel, guest_house->guesthouse, apartment/chalet->homestay, camp_site/huts->other). Photon (`osm_key`/`osm_value`) and Nominatim (`category`/`type`) normalizers drop everything else; `Place.kind` is now always a `StayKind`.
- Add-stay validation (server `POST /api/stays` and form contract): lodging type required (hotel, hostel, guesthouse, homestay, resort; "other" only when the request carries an OSM reference, i.e. camp sites/huts picked from map search), `confirmLodging: true` required, India bbox check, near-duplicate check (same name ignoring generic words like hotel/hostel, within 200 m, answers 409 with `existing`).
- `GET /api/stays/summaries?q=&state=&sort=best|tested|recent` returns all stays with summaries (scoring lib) plus the list of states; unrated stays always last. `GET /api/stays/[id]/readings?limit=` returns the latest readings (default 10, max 50) with only spot, speeds, latency, jitter, band, createdAt.
- Env overrides `PHOTON_BASE_URL` and `NOMINATIM_BASE_URL` (default to the public servers), used by e2e to point at a local stub.
- Unit tests: 167 total (was 120).

## v2 M2 Page structure (done, functional styling only)
- `/` dashboard: hero placeholder with "Log internet speed" CTA, GET-form filters (search, state, sort), stay cards (median Mbps, red/yellow/green BandBar, test count, last tested). `/stays/[id]`: read-only detail (summary, spots, latest-tests trail, map, "Log speed here" -> `/log?stay=<id>`). `/log`: choose stay (lodging-only search or deep link), verify location, speed test and spot, submit, link back to results. Add-stay form moved to `/log` with type dropdown, confirm checkbox and "use my current location".
- Shared styling lives in `src/components/ui.tsx` (Card, ButtonLink, Chip) and the existing BandBar/StayCard; measuring UI (`StayMeasure`) moved from the detail page to `LogFlow`. `StaySearch` renamed `StayPicker`. Test-mode flag (`NEXT_PUBLIC_SKIP_LOCATION_CHECK`) untouched and still handled in `StayMeasure`.
- E2E: Playwright now also starts `e2e/stub-upstream.mjs` (port 3101) as a fake Photon/Nominatim that mixes lodging with cafes/cities/attractions, so the real normalizers are exercised without network. 46 e2e tests pass (was 35). Supabase env stays blanked.
- Not done yet (later milestones): premium visual design, real hero artwork, stepper UI. Cleanup SQL for existing non-lodging rows is still to be documented (M5).

## v2 M3 Design system and shell (done)
- Tokens as CSS variables in `globals.css` mapped into the Tailwind 4 theme (ocean teal, coral/amber, sand surfaces, ink text). Fonts via `next/font/google` (self-hosted at build): Outfit for headings, Plus Jakarta Sans for body, with adjusted fallbacks to avoid layout shift.
- Shell: sticky translucent `SiteHeader` (working mobile menu, Escape closes, aria-expanded), `SiteFooter` with wave pattern, `Logo` (wifi + pin), skip link, `.bg-topo` / `.bg-waves` inline-SVG textures, focus rings (amber on dark sections).
- Components: `ui.tsx` (Container, Card, Button/ButtonLink, Chip, Notice), `icons.tsx` (inline SVG set, no new deps), `Scenery` (hero artwork: mountains, sun, sea, palm, dotted route, plane, pin), `WifiArcs`, `SpotIcon`/`KindIcon`, `EmptyState`. Animations (arc pulse, plane drift, pin bob) are disabled under `prefers-reduced-motion`.

## v2 M4 Premium pages (done)
- Dashboard: hero with search and CTAs, trust strip, pill filter toolbar, premium `StayCard` grid, how-it-works strip, closing CTA, illustrated empty state, shimmer skeleton in `loading.tsx`. BandBar redesigned (segmented, rounded, percentages; text always accompanies colour).
- Stay detail: gradient banner with kind chip and band badge, big speed tiles, per-spot rows with icons and mini bars, "Latest tests" timeline, map card, single "Log speed here" link that is a fixed bottom bar on mobile and sits in the banner on desktop.
- Log flow: 4-step `Stepper`, `StepCard` states (locked/active/done), `SpeedGauge` with live phase and progress, icon-chip `SpotPicker` (native radio group; e2e now uses `getByRole("radio", { name: "Rooftop" })`), celebratory success card with "See results" and "Test another spot", styled test-mode banner.
- Screenshots: `node e2e/shots.mjs` (own servers on 3101/3200, do not run with e2e) writes desktop 1280 and mobile 390 PNGs to `.shots/` (git-ignored); no horizontal overflow on any captured page.
- Fixed from axe: coral text contrast, nested div inside `dl`.
- Gates: eslint, tsc, `next build` clean; Vitest 167 pass; Playwright 46 pass.

## v2 M5 QA and docs (done)
- `supabase/cleanup-non-lodging.sql`: read-only SELECT of candidates (E2E names, `<`/`>`/"script" in name or city, kind `other` with no OSM ref whose name equals city/state) with a `reason` column; two commented-out DELETEs (by id, or everything listed). Seed ids (`00000000-0000-4000-8000-0000000000NN`) are excluded everywhere. Not executed on a live Postgres; static test `src/lib/cleanup-sql.test.ts` checks no live writes and seed protection.
- README refreshed: pages, lodging-only rule, trail API, design system, test mode and a WARNING to switch it off before launch, e2e never uses Supabase, `node e2e/shots.mjs`, "Cleaning up data". Vercel steps unchanged.
- Tests added: `src/lib/test-mode.test.ts`, `src/lib/cleanup-sql.test.ts`, e2e mobile menu -> /log. The test-mode flag is covered by unit tests only (it is inlined at build time and a second `next dev` in the same directory is not clean); the full mobile dashboard -> detail -> log -> submit e2e already existed.
- Gate: eslint, tsc, `next build` clean; Vitest 19 files / 172 tests; Playwright 47 pass, run twice consecutively. No dev servers left on 3100/3101/3200. Nothing pushed.
