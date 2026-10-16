import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { createStay, seedReading, stubExternal } from "./helpers";

const XSS_NAME = '<img src=x onerror="window.__xss=1"> <script>window.__xss=2</script>';

test.beforeEach(async ({ page }) => {
  await stubExternal(page);
});

test("user-added stay names are inert text on the stay page, map tooltip and search results", async ({ page, request }) => {
  const stay = await createStay(request, { name: `${XSS_NAME} ${Date.now()}` });
  await seedReading(request, stay);

  await page.goto(`/stays/${stay.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(stay.name);
  const map = page.getByTestId("stay-map");
  await expect(map.locator(".leaflet-interactive")).toBeVisible();
  await map.hover();
  await expect(page.locator(".leaflet-tooltip")).toHaveText(stay.name);
  await expect(page.locator(".leaflet-tooltip img, .leaflet-tooltip script")).toHaveCount(0);
  await expect(page.locator("main img[src='x'], main script")).toHaveCount(0);

  await page.goto("/?q=onerror");
  await expect(page.getByTestId("stay-list")).toContainText("onerror");
  await expect(page.locator("main img[src='x']")).toHaveCount(0);
  await page.goto("/log");
  await page.getByLabel("Search stays").fill("onerror");
  await expect(page.getByTestId("known-stays")).toContainText("onerror");
  await expect(page.locator("main img[src='x']")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

test("API input validation: bad ids, bad JSON, oversize bodies, bad values", async ({ request }) => {
  const stay = await createStay(request);

  for (const id of ["not-a-uuid", "1%3Bdrop%20table", "..%2F..%2Fetc"]) {
    expect((await request.get(`/api/stays/${id}/summary`)).status()).toBe(404);
    expect((await request.post(`/api/stays/${id}/validate-location`, { data: { lat: 1, lon: 1, accuracy: 1 } })).status()).toBe(404);
  }

  const badJson = await request.post("/api/readings", { headers: { "content-type": "application/json" }, data: "{nope" });
  expect(badJson.status()).toBe(400);
  expect((await badJson.json()).code).toBe("invalid");
  expect((await request.post("/api/stays", { headers: { "content-type": "application/json" }, data: "{nope" })).status()).toBe(400);

  const big = await request.post("/api/readings", { data: { stayId: stay.id, pad: "x".repeat(20_000) } });
  expect(big.status()).toBe(413);
  expect((await request.post("/api/stays", { data: { name: "x".repeat(20_000) } })).status()).toBe(413);

  const base = { deviceId: "valid-device-id-1234567890", spot: "room", downloadMbps: 10, uploadMbps: 5, latencyMs: 20, jitterMs: 1, packetLoss: 0 };
  const loc = { lat: stay.lat, lon: stay.lon, accuracy: 10 };
  const bad: Record<string, unknown>[] = [
    { stayId: "nope", ...base, location: loc },
    { stayId: stay.id, ...base, deviceId: "short", location: loc },
    { stayId: stay.id, ...base, deviceId: "bad chars !!!!!!!!!!!!!!!", location: loc },
    { stayId: stay.id, ...base, spot: "garage", location: loc },
    { stayId: stay.id, ...base, downloadMbps: "10", location: loc },
    { stayId: stay.id, ...base, downloadMbps: -1, location: loc },
    { stayId: stay.id, ...base, packetLoss: 101, location: loc },
    { stayId: stay.id, ...base },
    { stayId: stay.id, ...base, location: { lat: "x", lon: stay.lon, accuracy: 10 } },
  ];
  for (const data of bad) {
    const res = await request.post("/api/readings", { data });
    expect([400], JSON.stringify(data)).toContain(res.status());
  }
  expect((await (await request.get(`/api/stays/${stay.id}/summary`)).json()).summary.readingCount).toBe(0);

  const arr = await request.post("/api/readings", { data: [1, 2, 3] });
  expect(arr.status()).toBe(400);
  const nul = await request.post("/api/readings", { headers: { "content-type": "application/json" }, data: "null" });
  expect(nul.status()).toBe(400);
});

test("error responses do not leak internals", async ({ request }) => {
  const responses = [
    await request.post("/api/readings", { data: { stayId: "00000000-0000-4000-8000-0000000000aa", deviceId: "valid-device-id-1234567890", spot: "room", downloadMbps: 10, uploadMbps: 5, latencyMs: 20, jitterMs: 1, packetLoss: 0, location: { lat: 20, lon: 80, accuracy: 5 } } }),
    await request.get("/api/stays/00000000-0000-4000-8000-0000000000aa/summary"),
    await request.post("/api/stays", { data: { name: "x" } }),
    await request.get("/api/stays/00000000-0000-4000-8000-0000000000aa/readings"),
    await request.post("/api/readings", { headers: { "content-type": "application/json" }, data: "{" }),
  ];
  for (const r of responses) {
    const body = await r.text();
    expect(body).not.toMatch(/stack|node_modules|supabase|ECONN|at \w+ \(|\.ts:|\.json/i);
  }
});

test("no raw coordinates of the visitor's fix are stored", async ({ request }) => {
  const stay = await createStay(request);
  const fixLat = stay.lat + 0.000317;
  const fixLon = stay.lon - 0.000419;
  await seedReading(request, stay, { location: { lat: fixLat, lon: fixLon, accuracy: 12.3456789 } });
  const raw = fs.readFileSync(".data/e2e.json", "utf8");
  expect(raw).not.toContain(String(fixLat));
  expect(raw).not.toContain(String(fixLon));
  expect(raw).not.toContain("12.3456789");
  const snapshot = JSON.parse(raw) as { readings: Record<string, unknown>[] };
  const stored = snapshot.readings.find((r) => r.stayId === stay.id)!;
  expect(Object.keys(stored)).not.toEqual(expect.arrayContaining(["lat"]));
  expect(Object.keys(stored)).not.toEqual(expect.arrayContaining(["lon"]));
  expect(stored.deviceHash).toMatch(/^[0-9a-f]{64}$/);
  expect(stored.ipHash).toMatch(/^[0-9a-f]{64}$/);
  expect(stored.distanceM).toBeGreaterThan(0);
  expect(JSON.stringify(stored)).not.toContain("seed-");
});

test("security headers, robots and sitemap", async ({ request }) => {
  const home = await request.get("/");
  const h = home.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["permissions-policy"]).toContain("geolocation=(self)");
  expect(h["x-powered-by"]).toBeUndefined();

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toMatch(/Sitemap: http.*\/sitemap\.xml/);

  const stay = await createStay(request);
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain(`/stays/${stay.id}`);
  expect(xml).toContain("/stays/00000000-0000-4000-8000-000000000001");
});

test("canonical and og urls use metadataBase", async ({ page }) => {
  await page.goto("/stays/00000000-0000-4000-8000-000000000001");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^http:\/\/localhost:\d+\/stays\/0000/);
});
