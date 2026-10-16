import { test, expect } from "@playwright/test";
import { createStay, mockSpeedEngine, seedReading, stubExternal, uniq } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubExternal(page);
  await mockSpeedEngine(page);
});

test("stay with no readings shows the empty state, an empty trail and the log CTA", async ({ page, request }) => {
  const s = await createStay(request);
  await page.goto(`/stays/${s.id}`);
  await expect(page.getByTestId("empty-summary")).toBeVisible();
  await expect(page.getByTestId("trail-empty")).toBeVisible();
  await expect(page.getByTestId("stay-map")).toBeVisible();
  await expect(page.getByTestId("log-here")).toHaveAttribute("href", `/log?stay=${s.id}`);
});

test("dashboard lists stays with median, band bar, test count and last tested; click opens the detail with a trail", async ({ page, request }) => {
  const s = await createStay(request, { name: uniq("Dash Stay") });
  await seedReading(request, s, { spot: "rooftop" });
  await seedReading(request, s, { spot: "room" });
  await seedReading(request, s, { downloadMbps: 4, uploadMbps: 2, spot: "room" });

  await page.goto(`/?q=${encodeURIComponent(s.name)}`);
  const card = page.getByTestId("stay-card").filter({ hasText: s.name });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId("card-median")).toHaveText("60");
  await expect(card.getByTestId("card-count")).toHaveText("3 tests");
  await expect(card).toContainText(/last tested today/);
  await expect(card.getByTestId("band-bar")).toHaveAttribute("aria-label", /33% Poor.*67% Good/);
  await expect(card.getByTestId("band-badge")).toHaveAttribute("data-band", "good");

  await card.click();
  await expect(page).toHaveURL(new RegExp(`/stays/${s.id}$`));
  await expect(page.getByTestId("sample-count")).toHaveText("3 readings");
  await expect(page.getByTestId("confidence")).toHaveText("Medium");
  await expect(page.getByTestId("stat-download")).toContainText("60");
  await expect(page.getByTestId("band-legend")).toContainText("Poor 33%");
  await expect(page.getByTestId("band-legend")).toContainText("Good 67%");
  await expect(page.getByTestId("spot-breakdown").locator("li")).toHaveCount(2);
  await expect(page.getByTestId("stay-map")).toBeVisible();

  const trail = page.getByTestId("trail-entry");
  await expect(trail).toHaveCount(3);
  await expect(trail.first()).toContainText(/just now|min ago/);
  await expect(trail.first()).toContainText("Room");
  await expect(trail.first()).toContainText("4 Mbps down");
  await expect(trail.first().getByTestId("band-badge")).toHaveAttribute("data-band", "poor");
  await expect(trail.last()).toContainText("Rooftop");
});

test("detail page 'Log speed here' deep-links to the log flow with the stay preselected", async ({ page, request }) => {
  const s = await createStay(request);
  await page.goto(`/stays/${s.id}`);
  await page.getByRole("link", { name: "Log speed here" }).click();
  await expect(page).toHaveURL(new RegExp(`/log\\?stay=${s.id}$`));
  await expect(page.getByTestId("selected-stay")).toContainText(s.name);
  await expect(page.getByTestId("choose-stay")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /verify/i })).toBeVisible();
});

test("log page with an unknown or malformed ?stay shows the picker with a notice", async ({ page }) => {
  for (const id of ["00000000-0000-4000-8000-0000000000ff", "not-a-uuid"]) {
    await page.goto(`/log?stay=${id}`);
    await expect(page.getByTestId("log-notice")).toBeVisible();
    await expect(page.getByTestId("choose-stay")).toBeVisible();
  }
});

test("dashboard filters: state, search and sort", async ({ page, request }) => {
  const tag = uniq("Sorty");
  const a = await createStay(request, { name: `${tag} Alpha`, state: "Kerala" });
  const b = await createStay(request, { name: `${tag} Bravo`, state: "Kerala" });
  const c = await createStay(request, { name: `${tag} Charlie`, state: "Goa" });
  await seedReading(request, a, { downloadMbps: 30, uploadMbps: 15 });
  for (let i = 0; i < 3; i++) await seedReading(request, b, { downloadMbps: 12, uploadMbps: 6 });
  await seedReading(request, c, { downloadMbps: 90, uploadMbps: 40 });
  const names = () => page.getByTestId("stay-card").locator("p.font-semibold").allTextContents();

  await page.goto(`/?q=${encodeURIComponent(tag)}&sort=best`);
  expect(await names()).toEqual([`${tag} Charlie`, `${tag} Alpha`, `${tag} Bravo`]);
  await page.goto(`/?q=${encodeURIComponent(tag)}&sort=tested`);
  expect((await names())[0]).toBe(`${tag} Bravo`);
  await page.goto(`/?q=${encodeURIComponent(tag)}&sort=recent`);
  expect((await names())[0]).toBe(`${tag} Charlie`);

  await page.goto("/");
  await page.getByLabel("Search stays").fill(tag);
  await page.getByLabel("State").selectOption("Kerala");
  await page.getByLabel("Sort by").selectOption("tested");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/state=Kerala/);
  expect(await names()).toEqual([`${tag} Bravo`, `${tag} Alpha`]);

  await page.goto(`/?q=${encodeURIComponent(uniq("nothing-matches"))}`);
  await expect(page.getByTestId("stays-empty")).toBeVisible();
});

test("untested stays are listed as such", async ({ page, request }) => {
  const s = await createStay(request, { name: uniq("Fresh Stay") });
  await page.goto(`/?q=${encodeURIComponent(s.name)}`);
  await expect(page.getByTestId("stay-card").getByTestId("card-untested")).toBeVisible();
});

test("recent-readings API returns only public fields", async ({ request }) => {
  const s = await createStay(request);
  await seedReading(request, s);
  const res = await request.get(`/api/stays/${s.id}/readings?limit=5`);
  expect(res.status()).toBe(200);
  const { readings } = await res.json();
  expect(readings).toHaveLength(1);
  expect(Object.keys(readings[0]).sort()).toEqual(["band", "createdAt", "downloadMbps", "jitterMs", "latencyMs", "spot", "uploadMbps"]);
  expect(JSON.stringify(readings)).not.toMatch(/hash|distance|device/i);
  expect((await request.get("/api/stays/not-a-uuid/readings")).status()).toBe(404);
  expect((await request.get("/api/stays/00000000-0000-4000-8000-0000000000aa/readings")).status()).toBe(404);
});

test("stays-with-summaries API supports search, state filter and sort", async ({ request }) => {
  const tag = uniq("ApiList");
  const a = await createStay(request, { name: `${tag} A`, state: "Sikkim" });
  const b = await createStay(request, { name: `${tag} B`, state: "Sikkim" });
  await seedReading(request, a, { downloadMbps: 20, uploadMbps: 10 });
  await seedReading(request, b, { downloadMbps: 70, uploadMbps: 30 });
  const res = await request.get(`/api/stays/summaries?q=${encodeURIComponent(tag)}&state=Sikkim&sort=best`);
  const json = await res.json();
  expect(json.stays.map((x: { stay: { id: string } }) => x.stay.id)).toEqual([b.id, a.id]);
  expect(json.stays[0].summary.medianDownloadMbps).toBe(70);
  expect(json.states).toContain("Sikkim");
  expect(JSON.stringify(json)).not.toMatch(/deviceHash|ipHash/);
});
