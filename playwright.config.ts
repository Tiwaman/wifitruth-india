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
  webServer: [
    {
      // Stand-in for Photon and Nominatim so e2e never needs the network.
      command: "node e2e/stub-upstream.mjs",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: false,
    },
    {
      command: `node e2e/reset-data.mjs && npx next dev -p ${PORT}`,
      env: {
        // Blank Supabase vars so tests always use the local JSON file, never a real database from .env.local.
        NEXT_PUBLIC_SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        DATA_FILE: ".data/e2e.json",
        PHOTON_BASE_URL: "http://127.0.0.1:3101/photon",
        NOMINATIM_BASE_URL: "http://127.0.0.1:3101/nominatim",
        NEXT_PUBLIC_SKIP_LOCATION_CHECK: "",
        RATE_LIMIT_IP_MAX: "1000",
        RATE_LIMIT_DEVICE_MAX: "1000",
        RATE_LIMIT_STAY_MAX: "1000",
      },
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
