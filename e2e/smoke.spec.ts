import { test, expect } from "@playwright/test";

test("home page loads with search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "WiFiTruth India" })).toBeVisible();
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});
