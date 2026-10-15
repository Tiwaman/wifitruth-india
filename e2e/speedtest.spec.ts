import { test, expect } from "@playwright/test";
import { KASOL, mockSpeedEngine } from "./helpers";

test.use({ permissions: ["geolocation"] });

test("speed test is locked until location is verified, then runs with mocked engine", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 32.0101, longitude: 77.3153, accuracy: 20 });
  await mockSpeedEngine(page);
  await page.goto(`/stays/${KASOL}`);
  await expect(page.getByTestId("speedtest-locked")).toBeVisible();
  await expect(page.getByRole("button", { name: /start speed test/i })).toBeDisabled();
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "ok");
  await page.getByLabel(/where are you testing/i).selectOption("rooftop");
  await page.getByRole("button", { name: /start speed test/i }).click();
  await expect(page.getByTestId("metric-download")).toContainText("42.5");
  await expect(page.getByTestId("metric-packet-loss")).toContainText("0.5");
});

test("speed test stays locked when too far", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 32.05, longitude: 77.3153, accuracy: 20 });
  await mockSpeedEngine(page);
  await page.goto(`/stays/${KASOL}`);
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByTestId("location-message")).toHaveAttribute("data-status", "too_far");
  await expect(page.getByRole("button", { name: /start speed test/i })).toBeDisabled();
});
