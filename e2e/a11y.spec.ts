import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
import { createStay, seedReading, stubExternal } from "./helpers";

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await stubExternal(page);
});

test("home page has no detectable a11y violations", async ({ page, request }) => {
  const stay = await createStay(request);
  await seedReading(request, stay);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("stay-card").first()).toBeVisible();
  await audit(page);
});

test("log page (picker, add form and selected stay) has no detectable a11y violations", async ({ page, request }) => {
  const stay = await createStay(request);
  await page.goto("/log");
  await page.getByLabel("Search stays").fill("kasol");
  await expect(page.getByTestId("known-stays")).toBeVisible();
  await page.getByRole("button", { name: /add it/i }).click();
  await expect(page.getByLabel("Latitude")).toBeVisible();
  await audit(page);
  await page.goto(`/log?stay=${stay.id}`);
  await expect(page.getByTestId("selected-stay")).toBeVisible();
  await audit(page);
});

test("stay page (with readings) has no detectable a11y violations", async ({ page, request }) => {
  const stay = await createStay(request);
  await seedReading(request, stay);
  await seedReading(request, stay, { downloadMbps: 4, uploadMbps: 2, spot: "rooftop" });
  await page.goto(`/stays/${stay.id}`);
  await expect(page.getByTestId("sample-count")).toHaveText("2 readings");
  await expect(page.getByTestId("stay-map")).toBeVisible();
  await audit(page);
});

test("stay page without readings has no detectable a11y violations", async ({ page, request }) => {
  const stay = await createStay(request);
  await page.goto(`/stays/${stay.id}`);
  await expect(page.getByTestId("empty-summary")).toBeVisible();
  await audit(page);
});
