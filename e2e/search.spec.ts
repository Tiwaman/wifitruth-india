import { test, expect } from "@playwright/test";
import { createStay, stubTiles, uniq } from "./helpers";

// These tests use the real /api/search route and the real Photon/Nominatim normalizers,
// fed by e2e/stub-upstream.mjs (every answer mixes lodging with cafes, cities, forts and shops).

test.beforeEach(async ({ page }) => {
  await stubTiles(page);
});

test("log page finds a known stay and opens it", async ({ page }) => {
  await page.goto("/log");
  await page.getByLabel("Search stays").fill("kasol");
  await page.getByTestId("known-stays").getByText("Zostel Kasol").click();
  await expect(page).toHaveURL(/\/log\?stay=00000000-0000-4000-8000-000000000001/);
  await expect(page.getByTestId("selected-stay")).toContainText("Zostel Kasol");
});

test("map search lists only lodging; cafes, cities, attractions and shops are filtered out", async ({ page }) => {
  const q = uniq("Zanzibar");
  await page.goto("/log");
  await page.getByLabel("Search stays").fill(q);
  const places = page.getByTestId("places");
  await expect(places).toBeVisible();
  await expect(places.getByRole("button")).toHaveCount(1);
  await expect(places).toContainText(`${q} Hotel`);
  for (const bad of ["Cafe", "City", "Fort", "Bakery"]) await expect(places).not.toContainText(`${q} ${bad}`);
});

test("Nominatim fallback is lodging-only too", async ({ page }) => {
  const q = uniq("photonfail Bellvue");
  await page.goto("/log");
  await page.getByLabel("Search stays").fill(q);
  const places = page.getByTestId("places");
  await expect(places.getByRole("button")).toHaveCount(1);
  await expect(places).toContainText(`${q} Guest House`);
  await expect(places).not.toContainText("Museum");
  await expect(places).not.toContainText("Station");
});

test("search API returns only lodging places with a stay kind", async ({ request }) => {
  const res = await request.get(`/api/search?q=${encodeURIComponent(uniq("Qwerty"))}`);
  const { places } = await res.json();
  expect(places).toHaveLength(1);
  expect(places[0].kind).toBe("hotel");
});

test("picking a map result creates the stay and opens the log flow for it", async ({ page, request }) => {
  const q = uniq("Pickable");
  await page.goto("/log");
  await page.getByLabel("Search stays").fill(q);
  await page.getByTestId("places").getByRole("button", { name: new RegExp(`${q} Hotel`) }).click();
  await expect(page).toHaveURL(/\/log\?stay=/);
  await expect(page.getByTestId("selected-stay")).toContainText(`${q} Hotel`);
  const found = await (await request.get(`/api/stays?q=${encodeURIComponent(q)}`)).json();
  expect(found.stays[0].kind).toBe("hotel");
});

test("add missing stay form requires a lodging type, a confirmation and offers no 'other' option", async ({ page }) => {
  await page.goto("/log");
  await page.getByRole("button", { name: /add it/i }).click();
  const options = await page.getByLabel("Type").locator("option").allTextContents();
  expect(options.join("|")).not.toMatch(/other/i);
  expect(options).toEqual(expect.arrayContaining(["Hotel", "Hostel", "Guesthouse", "Homestay", "Resort"]));
  await page.getByLabel("Name").fill(uniq("Form Check"));
  await page.getByLabel("City").fill("Manali");
  await page.getByLabel("State").fill("Himachal Pradesh");
  await page.getByLabel("Latitude").fill("32.24");
  await page.getByLabel("Longitude").fill("77.18");
  await page.getByRole("button", { name: "Add stay" }).click();
  expect(await page.getByLabel("Type").evaluate((el: HTMLSelectElement) => el.validity.valueMissing)).toBe(true);
  expect(page.url()).not.toContain("stay=");
  await page.getByLabel("Type").selectOption("homestay");
  expect(await page.getByLabel(/this is a place to sleep/i).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
});

test("add-stay API rejects non-lodging kinds, missing type and missing confirmation", async ({ request }) => {
  const base = { name: uniq("Reject Me"), city: "Manali", state: "Himachal Pradesh", lat: 32.24, lon: 77.18, confirmLodging: true };
  for (const [over, msg] of [
    [{ kind: "other" }, /kind of stay/],
    [{ kind: "cafe" }, /kind of stay/],
    [{ kind: undefined }, /kind of stay/],
    [{ kind: "hotel", confirmLodging: false }, /place to sleep/],
  ] as const) {
    const res = await request.post("/api/stays", { data: { ...base, ...over } });
    expect(res.status(), JSON.stringify(over)).toBe(400);
    expect((await res.json()).error).toMatch(msg);
  }
});

test("add-stay form shows the server's rejection when a non-lodging type is forced", async ({ page }) => {
  await page.goto("/log");
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Type").evaluate((el: HTMLSelectElement) => {
    const o = document.createElement("option");
    o.value = "cafe";
    o.text = "Cafe";
    el.append(o);
  });
  await page.getByLabel("Type").selectOption("cafe");
  await page.getByLabel("Name").fill(uniq("Sneaky Cafe"));
  await page.getByLabel("City").fill("Manali");
  await page.getByLabel("State").fill("Himachal Pradesh");
  await page.getByLabel("Latitude").fill("32.24");
  await page.getByLabel("Longitude").fill("77.18");
  await page.getByLabel(/this is a place to sleep/i).check();
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.locator("form [role=alert]")).toContainText(/kind of stay/i);
  expect(page.url()).not.toContain("stay=");
});

test("adding a near-duplicate stay is refused and points to the existing one", async ({ page, request }) => {
  const stay = await createStay(request, { name: uniq("Dupe Hotel"), kind: "hotel" });
  await page.goto("/log");
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Name").fill(stay.name.toUpperCase());
  await page.getByLabel("Type").selectOption("hotel");
  await page.getByLabel("City").fill("Testville");
  await page.getByLabel("State").fill("Goa");
  await page.getByLabel("Latitude").fill(String(stay.lat + 0.0005));
  await page.getByLabel("Longitude").fill(String(stay.lon));
  await page.getByLabel(/this is a place to sleep/i).check();
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.locator("form [role=alert]")).toContainText(/already listed nearby/i);
  await page.getByRole("link", { name: /instead/i }).click();
  await expect(page).toHaveURL(new RegExp(`stay=${stay.id}`));
});

test("rejects a location outside India", async ({ page }) => {
  await page.goto("/log");
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Name").fill("London Hostel");
  await page.getByLabel("Type").selectOption("hostel");
  await page.getByLabel("City").fill("London");
  await page.getByLabel("State").fill("England");
  await page.getByLabel("Latitude").fill("51.5");
  await page.getByLabel("Longitude").fill("-0.12");
  await page.getByLabel(/this is a place to sleep/i).check();
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.getByText("Location must be inside India.")).toBeVisible();
});
