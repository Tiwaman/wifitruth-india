import { test, expect, type APIRequestContext } from "@playwright/test";
import { KASOL } from "./helpers";

async function makeStay(request: APIRequestContext) {
  const lat = 15.4 + Math.random() * 0.01;
  const lon = 73.8 + Math.random() * 0.01;
  const name = `E2E Hostel ${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const res = await request.post("/api/stays", { data: { name, kind: "hostel", city: "Goa", state: "Goa", lat, lon } });
  const { stay } = await res.json();
  return { stay, lat, lon, name };
}

async function submit(request: APIRequestContext, s: { stay: { id: string }; lat: number; lon: number }, i: number, over = {}) {
  return request.post("/api/readings", {
    data: {
      stayId: s.stay.id,
      deviceId: `e2e-device-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      spot: i === 0 ? "rooftop" : "room",
      downloadMbps: 60,
      uploadMbps: 30,
      latencyMs: 20,
      jitterMs: 2,
      packetLoss: 0,
      location: { lat: s.lat, lon: s.lon, accuracy: 10 },
      ...over,
    },
  });
}

test("stay with no readings shows the empty state", async ({ page, request }) => {
  const s = await makeStay(request);
  await page.goto(`/stays/${s.stay.id}`);
  await expect(page.getByTestId("empty-summary")).toBeVisible();
  await expect(page.getByTestId("stay-map")).toBeVisible();
});

test("stay page shows aggregates, band bar, spots; home lists the stay", async ({ page, request }) => {
  const s = await makeStay(request);
  expect((await submit(request, s, 0)).status()).toBe(201);
  expect((await submit(request, s, 1)).status()).toBe(201);
  expect((await submit(request, s, 2, { downloadMbps: 4, uploadMbps: 2 })).status()).toBe(201);

  await page.goto(`/stays/${s.stay.id}`);
  await expect(page.getByTestId("sample-count")).toHaveText("3 readings");
  await expect(page.getByTestId("confidence")).toHaveText("Medium");
  await expect(page.getByTestId("stat-download")).toContainText("60");
  await expect(page.getByTestId("band-badge").first()).toHaveAttribute("data-band", "good");
  await expect(page.getByTestId("band-legend")).toContainText("Poor 33%");
  await expect(page.getByTestId("band-legend")).toContainText("Good 67%");
  await expect(page.getByTestId("band-bar").first()).toHaveAttribute("aria-label", /33% Poor/);
  await expect(page.getByTestId("spot-breakdown").locator("li")).toHaveCount(2);

  await page.goto("/");
  await expect(page.getByTestId("top-stays")).toContainText(s.name);
  await expect(page.getByTestId("recent-stays")).toContainText(s.name);
});

test("API rejects bad submissions with friendly messages", async ({ request }) => {
  const s = await makeStay(request);
  const far = await submit(request, s, 0, { location: { lat: s.lat + 0.05, lon: s.lon, accuracy: 10 } });
  expect(far.status()).toBe(422);
  expect((await far.json()).error).toMatch(/within 150 m/);
  const silly = await submit(request, s, 1, { downloadMbps: 999999 });
  expect(silly.status()).toBe(400);
  const summary = await (await request.get(`/api/stays/${s.stay.id}/summary`)).json();
  expect(summary.summary.readingCount).toBe(0);
});

test("unknown stay shows not-found page, privacy page renders", async ({ page }) => {
  await page.goto("/stays/00000000-0000-4000-8000-0000000000ff");
  await expect(page.getByTestId("not-found")).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
});

test("page has SEO metadata and a skip link", async ({ page }) => {
  await page.goto(`/stays/${KASOL}`);
  await expect(page).toHaveTitle(/Kasol|WiFi/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip to content/i })).toBeFocused();
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 375, height: 700 } });
  test("home does not overflow horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
