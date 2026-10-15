# WiFiTruth India — Plan

Crowd-measured WiFi quality for stays in India. Anonymous submissions, GPS-validated, aggregated per stay and per spot.

## Decisions (made by Commander, no further input needed)
- Stack: Next.js (App Router) + TypeScript + Tailwind, deploy on Vercel; Supabase Postgres (free tier). Local-first.
- Speed test: `@cloudflare/speedtest` (download, upload, latency, jitter, packet loss).
- Stay search: Photon (OSM) via own cached API route, restricted to India bbox. Users can add a missing stay.
- Map: Leaflet + OSM tiles.
- Anonymous: no login. Hashed device id (cookie/localStorage UUID) + hashed IP (salted). One reading per device per stay per day; GPS accuracy <= 100 m; distance to stay <= 150 m.
- Owner verification: DEFERRED. Schema leaves room (`stays.claimed_*` nullable columns), no UI in v1.
- Bands (download Mbps; upload must be >= 25% of download threshold else downgrade one band; latency > 150 ms downgrades one band):
  - Poor < 10, Moderate 10-25, Good >= 25 (Excellent >= 50 shown as label).
- Aggregation: median per stay and per spot; recency weight (last 90 days full, older half); confidence: <3 readings "Low", 3-9 "Medium", >=10 "High".
- Bar: red / yellow / green segmented bar showing % of readings per band.
- Secrets live in `.env.local` only; nothing is pushed anywhere without Aman's confirmation.

## Milestones
1. **Scaffold** — Next.js+TS+Tailwind project, lint, env template, folder structure, Vitest + Playwright set up.
2. **Database** — Supabase SQL migration: stays, readings, spots enum, RLS (public read, insert via server only), aggregate view/function, seed of ~15 India stays. Local fallback: pluggable data layer (in-memory/JSON adapter) so app and tests run without Supabase credentials.
3. **Stay search** — `/api/search` Photon proxy with cache + India bbox; search UI with debounce; add-missing-stay form.
4. **GPS validation** — geolocation hook, haversine distance, accuracy gate, clear UX for denied/low-accuracy/too-far states, server re-validation.
5. **Speed test** — Cloudflare speedtest wrapper, progress UI (down/up/latency/jitter/loss), spot picker (reception, room, dorm, rooftop, common area, other).
6. **Submission API** — `/api/readings` with validation, hashing, rate limit, duplicate-per-day rule, sanity limits on values.
7. **Aggregation and bands** — pure scoring library (bands, median, recency, confidence) with unit tests; API returning stay summary and per-spot breakdown.
8. **Stay page and dashboard** — Mbps numbers, red/yellow/green percentage bar, spot breakdown, sample count, recency, map; home page with search and top-rated/recent.
9. **Polish** — responsive mobile-first UI, loading/empty/error states, accessibility, SEO metadata, privacy note (store only distance result, not raw coordinates), rate-limit messages.
10. **E2E testing and hardening** — Playwright flows (search -> validate -> test -> submit -> see aggregate; denied GPS; too-far; duplicate; add stay), mocked geolocation and speedtest, unit/integration suite, production build, README with Vercel + Supabase deploy steps.

## Definition of done per milestone
Code builds, lint clean, tests for that milestone pass, short note appended to `docs/PROGRESS.md`.
