// Visual review helper (not part of the test suite): `node e2e/shots.mjs` writes screenshots to .shots/.
// Starts the stub upstream (3101) and `next dev` on 3200 with the e2e data setup. Do not run alongside the e2e suite.
import { spawn, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const PORT = 3200;
const BASE = `http://localhost:${PORT}`;
const KASOL = "00000000-0000-4000-8000-000000000001";
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  DATA_FILE: ".data/e2e.json",
  PHOTON_BASE_URL: "http://127.0.0.1:3101/photon",
  NOMINATIM_BASE_URL: "http://127.0.0.1:3101/nominatim",
  NEXT_PUBLIC_SKIP_LOCATION_CHECK: "",
  RATE_LIMIT_IP_MAX: "1000",
  RATE_LIMIT_DEVICE_MAX: "1000",
  RATE_LIMIT_STAY_MAX: "1000",
};
execSync("node e2e/reset-data.mjs", { stdio: "inherit", env });
const stub = spawn("node", ["e2e/stub-upstream.mjs"], { env, stdio: "inherit" });
const dev = spawn(`npx next dev -p ${PORT}`, { env, stdio: "inherit", shell: true });
const kill = () => {
  for (const c of [dev, stub]) {
    try {
      execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: "ignore" });
    } catch {}
  }
};

async function waitUp() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server did not start");
}

async function post(path, data) {
  const res = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return res.json();
}

async function seed() {
  const stays = [
    ["Himalayan Haven Hostel", "hostel", "Manali", "Himachal Pradesh", 32.24, 77.18, [[88, 40, 18, "common_area"], [72, 31, 22, "room"], [95, 52, 15, "rooftop"], [18, 6, 60, "dorm"]]],
    ["Palm Cove Resort", "resort", "Candolim", "Goa", 15.52, 73.76, [[140, 90, 12, "room"], [120, 70, 14, "reception"], [65, 30, 25, "rooftop"]]],
    ["Backwater Homestay", "homestay", "Alleppey", "Kerala", 9.49, 76.33, [[6, 2, 80, "room"], [9, 3, 70, "common_area"]]],
    ["Pink City Guesthouse", "guesthouse", "Jaipur", "Rajasthan", 26.92, 75.8, []],
    ["Skyline Business Hotel", "hotel", "Bengaluru", "Karnataka", 12.97, 77.59, [[210, 120, 8, "room"], [180, 100, 9, "reception"], [34, 15, 30, "dorm"], [160, 90, 10, "room"], [22, 8, 40, "other"]]],
  ];
  const ids = [];
  for (const [name, kind, city, state, lat, lon, readings] of stays) {
    const r = await post("/api/stays", { name, kind, city, state, lat, lon, confirmLodging: true });
    const id = r.stay?.id;
    ids.push(id);
    for (const [d, u, l, spot] of readings)
      await post("/api/readings", {
        stayId: id,
        deviceId: `shots-${Math.random().toString(36).slice(2)}`,
        spot,
        downloadMbps: d,
        uploadMbps: u,
        latencyMs: l,
        jitterMs: 3,
        packetLoss: 0,
        location: { lat, lon, accuracy: 10 },
      });
  }
  return ids;
}

const SPEED = { downloadMbps: 86.4, uploadMbps: 41.2, latencyMs: 24, jitterMs: 3.1, packetLoss: 0 };

try {
  mkdirSync(".shots", { recursive: true });
  await waitUp();
  const ids = await seed();
  const browser = await chromium.launch();
  const sizes = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };
  const overflow = [];
  for (const [label, viewport] of Object.entries(sizes)) {
    const ctx = await browser.newContext({
      viewport,
      isMobile: label === "mobile",
      hasTouch: label === "mobile",
      permissions: ["geolocation"],
      geolocation: { latitude: 32.0101, longitude: 77.3153, accuracy: 20 },
      deviceScaleFactor: 1,
    });
    await ctx.route("**/tile.openstreetmap.org/**", (r) => r.fulfill({ status: 200, contentType: "image/png", body: Buffer.alloc(0) }));
    await ctx.addInitScript((r) => {
      window.__wifiSpeedTestEngine = {
        async run(onProgress) {
          onProgress({ phase: "download", percent: 40, partial: { latencyMs: r.latencyMs, jitterMs: r.jitterMs, downloadMbps: 64 } });
          await new Promise((res) => setTimeout(res, 600));
          return r;
        },
      };
    }, SPEED);
    const page = await ctx.newPage();
    const shot = async (name) => {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `.shots/${label}-${name}.png`, fullPage: true });
      await page.screenshot({ path: `.shots/${label}-${name}-fold.png` });
      const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      if (w[0] > w[1]) overflow.push(`${label}-${name}: scrollWidth ${w[0]} > ${w[1]}`);
    };
    await page.goto(BASE + "/");
    await shot("home");
    await page.goto(BASE + "/?q=zzzz-nothing");
    await shot("home-empty");
    await page.goto(`${BASE}/stays/${ids[0]}`);
    await shot("stay");
    await page.goto(`${BASE}/stays/${ids[3]}`);
    await shot("stay-empty");
    await page.goto(BASE + "/log");
    await shot("log-choose");
    await page.goto(`${BASE}/log?stay=${KASOL}`);
    await shot("log-locked");
    await page.getByRole("button", { name: /verify/i }).click();
    await page.getByTestId("location-message").waitFor();
    await page.getByRole("radio", { name: "Rooftop" }).check();
    await shot("log-verified");
    await page.getByRole("button", { name: /start speed test/i }).click();
    await page.getByTestId("metric-download").waitFor();
    await page.waitForTimeout(900);
    await shot("log-tested");
    await page.getByRole("button", { name: /submit reading/i }).click();
    await page.getByTestId("see-results").waitFor();
    await shot("log-done");
    if (label === "mobile") {
      await page.goto(BASE + "/");
      await page.getByRole("button", { name: /open menu/i }).click();
      await page.screenshot({ path: ".shots/mobile-menu.png" });
    }
    await ctx.close();
  }
  await browser.close();
  console.log(overflow.length ? "OVERFLOW:\n" + overflow.join("\n") : "no horizontal overflow detected");
} finally {
  kill();
}
