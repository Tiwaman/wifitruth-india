import { test, expect, type Page } from "@playwright/test";
import { BASE, createStay, mockSpeedEngine, placeAt, seedReading, stubExternal, uniq } from "./helpers";

test.use({ permissions: ["geolocation"] });

test.beforeEach(async ({ page }) => {
  await stubExternal(page);
  await mockSpeedEngine(page);
});

async function fillAddForm(page: Page, f: { name: string; city: string; state: string; lat: string; lon: string; kind?: string; confirm?: boolean }) {
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Name").fill(f.name);
  if (f.kind) await page.getByLabel("Type").selectOption(f.kind);
  await page.getByLabel("City").fill(f.city);
  await page.getByLabel("State").fill(f.state);
  await page.getByLabel("Latitude").fill(f.lat);
  await page.getByLabel("Longitude").fill(f.lon);
  if (f.confirm !== false) await page.getByLabel(/this is a place to sleep/i).check();
}

test("full flow: dashboard, stay detail, log deep link, GPS ok, speed test, pick spot, submit, detail shows the new numbers and trail", async ({ page, context, request }) => {
  const stay = await createStay(request);
  await seedReading(request, stay, { downloadMbps: 60, uploadMbps: 30 });
  await seedReading(request, stay, { downloadMbps: 4, uploadMbps: 2 });
  await placeAt(context, stay);

  await page.goto(`/?q=${encodeURIComponent(stay.name)}`);
  await page.getByTestId("stay-card").getByText(stay.name).click();
  await expect(page.getByRole("heading", { name: stay.name })).toBeVisible();
  await expect(page.getByTestId("sample-count")).toHaveText("2 readings");
  await expect(page.getByTestId("band-legend")).toContainText("Poor 50%");
  await expect(page.getByTestId("band-legend")).toContainText("Good 50%");
  await expect(page.getByTestId("stat-download")).toContainText("32");
  await expect(page.getByTestId("trail-entry")).toHaveCount(2);

  await page.getByTestId("log-here").click();
  await expect(page).toHaveURL(new RegExp(`/log\\?stay=${stay.id}`));
  await expect(page.getByTestId("selected-stay")).toContainText(stay.name);

  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
  await page.getByRole("radio", { name: "Rooftop" }).check();
  await page.getByRole("button", { name: /start speed test/i }).click();
  await expect(page.getByTestId("metric-download")).toContainText("42.5");
  await page.getByRole("button", { name: /submit reading/i }).click();
  await expect(page.getByTestId("submit-message")).toHaveAttribute("data-status", "done");

  await page.getByTestId("see-results").click();
  await expect(page).toHaveURL(new RegExp(`/stays/${stay.id}$`));
  await expect(page.getByTestId("sample-count")).toHaveText("3 readings");
  await expect(page.getByTestId("band-legend")).toContainText("Poor 33%");
  await expect(page.getByTestId("band-legend")).toContainText("Good 67%");
  await expect(page.getByTestId("band-bar").first()).toHaveAttribute("aria-label", /33% Poor/);
  await expect(page.getByTestId("stat-download")).toContainText("42.5");
  await expect(page.getByTestId("band-badge").first()).toHaveAttribute("data-band", "good");
  await expect(page.getByTestId("spot-breakdown")).toContainText(/rooftop/i);
  await expect(page.getByTestId("trail-entry")).toHaveCount(3);
  await expect(page.getByTestId("trail-entry").first()).toContainText(/rooftop.*just now/i);
});

test("dashboard CTA leads to the log page where a stay is chosen by search", async ({ page, request }) => {
  const stay = await createStay(request);
  await page.goto("/");
  await page.getByRole("link", { name: "Log internet speed" }).click();
  await expect(page).toHaveURL(/\/log$/);
  await expect(page.getByTestId("choose-stay")).toBeVisible();
  await expect(page.getByRole("button", { name: /start speed test/i })).toHaveCount(0);
  await page.getByLabel("Search stays").fill(stay.name);
  await page.getByTestId("known-stays").getByText(stay.name).click();
  await expect(page).toHaveURL(new RegExp(`/log\\?stay=${stay.id}`));
  await expect(page.getByTestId("selected-stay")).toContainText(stay.name);
  await expect(page.getByRole("button", { name: /verify/i })).toBeVisible();
});

test.describe("location gate keeps the speed test locked", () => {
  const cases = [
    { name: "too far", dLat: 0.01, accuracy: 20, status: "too_far" },
    { name: "low accuracy", dLat: 0, accuracy: 400, status: "low_accuracy" },
  ];
  for (const c of cases) {
    test(c.name, async ({ page, context, request }) => {
      const stay = await createStay(request);
      await placeAt(context, { lat: stay.lat + c.dLat, lon: stay.lon }, c.accuracy);
      await page.goto(`/log?stay=${stay.id}`);
      await page.getByRole("button", { name: /verify/i }).click();
      await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", c.status);
      await expect(page.getByRole("button", { name: /start speed test/i })).toBeDisabled();
    });
  }

  test("GPS denied", async ({ request, browser }) => {
    const stay = await createStay(request);
    const ctx = await browser.newContext({ permissions: [] });
    const p = await ctx.newPage();
    await stubExternal(p);
    await mockSpeedEngine(p);
    await p.goto(`${BASE}/log?stay=${stay.id}`);
    await p.getByRole("button", { name: /verify/i }).click();
    await expect(p.getByTestId("location-message")).toHaveAttribute("data-status", "denied");
    await expect(p.getByRole("button", { name: /start speed test/i })).toBeDisabled();
    await ctx.close();
  });
});

test("duplicate same-day submission shows a friendly message and does not change the aggregate", async ({ page, context, request }) => {
  const stay = await createStay(request);
  await placeAt(context, stay);
  await page.goto(`/log?stay=${stay.id}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
  await page.getByRole("button", { name: /start speed test/i }).click();
  await page.getByRole("button", { name: /submit reading/i }).click();
  await expect(page.getByTestId("submit-message")).toHaveAttribute("data-status", "done");

  await page.getByRole("button", { name: /run again/i }).click();
  await page.getByRole("button", { name: /submit reading/i }).click();
  await expect(page.getByTestId("submit-message")).toHaveAttribute("data-status", "duplicate");
  await expect(page.getByTestId("submit-message")).toContainText(/already submitted a reading for this stay today/i);
  const summary = await (await request.get(`/api/stays/${stay.id}/summary`)).json();
  expect(summary.summary.readingCount).toBe(1);
});

test("rate-limit response is shown as a clear, non-error message", async ({ page, context, request }) => {
  const stay = await createStay(request);
  await placeAt(context, stay);
  await page.route("**/api/readings", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "300" },
      json: { ok: false, code: "rate_limited", error: "You are submitting too quickly. Please wait about 5 minutes and try again." },
    }),
  );
  await page.goto(`/log?stay=${stay.id}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
  await page.getByRole("button", { name: /start speed test/i }).click();
  await page.getByRole("button", { name: /submit reading/i }).click();
  const msg = page.getByTestId("submit-message");
  await expect(msg).toHaveAttribute("data-status", "rate_limited");
  await expect(msg).toContainText("too quickly");
  await expect(msg).toHaveClass(/yellow/);
});

test("add a missing stay on the log page, then test it end to end", async ({ page, context }) => {
  const name = uniq("E2E Added Hostel");
  const lat = 25.3 + Math.random() * 0.1;
  const lon = 83.0 + Math.random() * 0.1;
  await placeAt(context, { lat, lon });
  await page.goto("/log");
  await fillAddForm(page, { name, kind: "hostel", city: "Varanasi", state: "Uttar Pradesh", lat: String(lat), lon: String(lon) });
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.getByTestId("selected-stay")).toContainText(name);

  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
  await page.getByRole("button", { name: /start speed test/i }).click();
  await page.getByRole("button", { name: /submit reading/i }).click();
  await expect(page.getByTestId("submit-message")).toHaveAttribute("data-status", "done");
  await page.getByTestId("see-results").click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByTestId("sample-count")).toHaveText("1 reading");
  await expect(page.getByTestId("band-legend")).toContainText("Good 100%");
  await expect(page.getByTestId("trail-entry")).toHaveCount(1);
});

test("adding a stay outside India is rejected in the form and the API", async ({ page, request }) => {
  await page.goto("/log");
  await fillAddForm(page, { name: uniq("Singapore Lodge"), kind: "hotel", city: "Singapore", state: "Central", lat: "1.35", lon: "103.8" });
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.getByText("Location must be inside India.")).toBeVisible();
  expect(page.url()).not.toContain("stay=");

  const res = await request.post("/api/stays", {
    data: { name: "London Hostel", kind: "hostel", confirmLodging: true, city: "London", state: "England", lat: 51.5, lon: -0.12 },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe("Location must be inside India.");
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("dashboard, detail, log, test and submit work on a phone-sized screen without horizontal scroll", async ({ page, context, request }) => {
    const stay = await createStay(request);
    await placeAt(context, stay);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await page.goto(`/?q=${encodeURIComponent(stay.name)}`);
    expect(await overflow()).toBe(false);
    await page.getByTestId("stay-card").getByText(stay.name).tap();
    await expect(page.getByRole("heading", { name: stay.name })).toBeVisible();
    expect(await overflow()).toBe(false);
    await page.getByTestId("log-here").tap();
    await expect(page.getByTestId("selected-stay")).toContainText(stay.name);
    await page.getByRole("button", { name: /verify/i }).tap();
    await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
    await page.getByRole("button", { name: /start speed test/i }).tap();
    await expect(page.getByTestId("metric-download")).toContainText("42.5");
    await page.getByRole("button", { name: /submit reading/i }).tap();
    await expect(page.getByTestId("submit-message")).toHaveAttribute("data-status", "done");
    expect(await overflow()).toBe(false);
    await page.getByTestId("see-results").tap();
    await expect(page.getByTestId("sample-count")).toHaveText("1 reading");
    expect(await overflow()).toBe(false);
  });
});
