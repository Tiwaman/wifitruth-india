import { test, expect } from "@playwright/test";

const KASOL = "00000000-0000-4000-8000-000000000001";

test.use({ permissions: ["geolocation"] });

test("confirms location when at the stay", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 32.0101, longitude: 77.3153, accuracy: 20 });
  await page.goto(`/stays/${KASOL}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
});

test("flags too far", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 32.05, longitude: 77.3153, accuracy: 20 });
  await page.goto(`/stays/${KASOL}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "too_far");
});

test("flags low accuracy", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 32.0101, longitude: 77.3153, accuracy: 500 });
  await page.goto(`/stays/${KASOL}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "low_accuracy");
});

test.describe("denied", () => {
  test.use({ permissions: [] });
  test("shows denied message", async ({ page }) => {
    await page.goto(`/stays/${KASOL}`);
    await page.getByRole("button", { name: /verify/i }).click();
    await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "denied");
  });
});
