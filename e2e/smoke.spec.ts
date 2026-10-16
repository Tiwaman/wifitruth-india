import { test, expect } from "@playwright/test";

test("home dashboard loads with hero, CTA, filters and stays", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log internet speed" })).toHaveAttribute("href", "/log");
  await expect(page.getByPlaceholder(/name, city or state/i)).toBeVisible();
  await expect(page.getByTestId("stay-card").first()).toBeVisible();
});
