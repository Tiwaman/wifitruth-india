# WiFiTruth India — v2 plan: dashboard, lodging-only, premium travel UI

## What the user asked for
1. Today the results and the "log speed" flow share one page. Split them:
   - **Home = dashboard**: aggregates results for all stays. Clicking a stay opens its **detail page** with the aggregate plus a **trail of the latest logged entries**.
   - **"Log internet speed"** is a clear feature/CTA on the home page that leads to a separate **log page** where the user picks a stay, verifies location, tests and submits.
2. Only **stays** (hotel, hostel, guesthouse, homestay, resort, and similar lodging) can be chosen or added. No random places (cities, cafes, shops, landmarks).
3. The UI looks basic. Make it **premium and travel-themed** (WiFi motifs, travel backdrop), friendly and inviting, mobile-first.

## Decisions (final, no questions needed)
- Information architecture:
  - `/` Dashboard: hero + search/filter of tracked stays, aggregate cards (median Mbps, red/yellow/green bar, tests count, last tested), sort (best speed, most tested, recently tested), state filter, "Log internet speed" primary CTA.
  - `/stays/[id]` Stay detail (read-only): headline numbers, band bar, per-spot breakdown, map, **recent entries trail** (time ago, spot, download/upload/latency, band chip), CTA "Log speed here" -> `/log?stay=<id>`.
  - `/log` Log flow: step 1 choose stay (search; lodging only), 2 verify location, 3 run speed test + pick spot, 4 share. Deep link `?stay=<id>` pre-selects the stay.
  - Old `/stays/[id]` measuring UI moves into `/log`.
- Lodging-only rules:
  - Allowed OSM values: tourism = hotel, hostel, guest_house, motel, apartment, chalet, resort (and leisure=resort), camp_site, alpine_hut, wilderness_hut. Anything else is dropped from map search.
  - Map `kind` mapping from OSM value to our `stay_kind` (hostel, hotel, homestay, resort, guesthouse, other).
  - Adding a missing stay: allowed only as a lodging type (required dropdown with no "other" place option), name and coordinates required, with a "use my current location" helper, an explicit "this is a place to sleep" confirmation, India check, duplicate-near-name check. Server enforces the same rules.
  - Existing non-lodging rows are not auto-deleted. Provide a documented SQL cleanup.
- Recent entries trail: new API returns the last N readings for a stay with only public fields (spot, speeds, latency, band, createdAt). Never device/IP hashes or distance.
- Visual direction: "Wanderlust" look. Deep teal/ocean to sunset-coral gradient hero, soft glass cards, subtle animated WiFi signal arcs, inline-SVG travel scenery (mountains, palm/beach, route dotted line, paper plane, pin) with no external image licensing, rounded modern type via `next/font`, consistent icons, smooth micro-motion respecting `prefers-reduced-motion`, AA contrast, dark text on light cards.
- Keep: test-mode flag, anonymity, privacy rules, no raw coordinates stored.

## Milestones
1. **M1 Data and rules**: lodging allow-list and kind mapping (Photon + Nominatim normalizers), stricter add-stay validation (server + UI contract), stays-with-summaries list API (search, state filter, sort), recent-readings API, unit tests.
2. **M2 Page structure**: new dashboard `/`, stay detail `/stays/[id]` with trail, `/log` flow with deep link and stay picker, navigation between them, redirects, working (not yet pretty) UI, e2e updated to new flow.
3. **M3 Design system and shell**: tokens, fonts, header/nav, footer, hero with animated WiFi arcs and travel SVG scenery, button/card/chip/band-bar redesign, background treatment, icons.
4. **M4 Premium pages**: dashboard cards and filters, stay detail layout with trail timeline, log flow as a stepper with speed gauge visuals, polished empty/loading/error states, mobile layouts, micro-interactions.
5. **M5 QA and docs**: Playwright flows for dashboard -> detail -> log -> submit -> trail updates, lodging-only enforcement, a11y (axe), mobile viewport, visual screenshots reviewed, lint/typecheck/unit/build green, README + PROGRESS updated, cleanup SQL documented. **Stop and ask before pushing.**

## Definition of done per milestone
Lint, typecheck, unit tests green; for UI milestones run the e2e suite (stop any running dev server first, e2e must never touch Supabase); note appended to `docs/PROGRESS.md`; local commit.
