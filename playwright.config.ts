import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 2,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node e2e/reset-data.mjs && npx next dev -p ${PORT}`,
    env: {
      DATA_FILE: ".data/e2e.json",
      RATE_LIMIT_IP_MAX: "1000",
      RATE_LIMIT_DEVICE_MAX: "1000",
      RATE_LIMIT_STAY_MAX: "1000",
    },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
