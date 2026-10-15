import { test, expect } from "@playwright/test";

test("search finds seeded stay and opens it", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search stays").fill("kasol");
  await expect(page.getByTestId("known-stays").getByText("Zostel Kasol")).toBeVisible();
  await page.getByText("Zostel Kasol").click();
  await expect(page.getByRole("heading", { name: "Zostel Kasol" })).toBeVisible();
});

test("add missing stay form creates and navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Name").fill("E2E Test Hostel");
  await page.getByLabel("City").fill("Manali");
  await page.getByLabel("State").fill("Himachal Pradesh");
  await page.getByLabel("Latitude").fill("32.24");
  await page.getByLabel("Longitude").fill("77.18");
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.getByRole("heading", { name: "E2E Test Hostel" })).toBeVisible();
});

test("rejects a location outside India", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /add it/i }).click();
  await page.getByLabel("Name").fill("London Hostel");
  await page.getByLabel("City").fill("London");
  await page.getByLabel("State").fill("England");
  await page.getByLabel("Latitude").fill("51.5");
  await page.getByLabel("Longitude").fill("-0.12");
  await page.getByRole("button", { name: "Add stay" }).click();
  await expect(page.getByText("Location must be inside India.")).toBeVisible();
});
