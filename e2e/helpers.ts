import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

export const KASOL = "00000000-0000-4000-8000-000000000001";
export const BASE = "http://localhost:3100";

export const DEFAULT_SPEED = { downloadMbps: 42.5, uploadMbps: 18.2, latencyMs: 35, jitterMs: 4.1, packetLoss: 0.5 };

export async function mockSpeedEngine(page: Page, result = DEFAULT_SPEED) {
  await page.addInitScript((r) => {
    window.__wifiSpeedTestEngine = {
      async run(onProgress) {
        onProgress({ phase: "download", percent: 25, partial: { latencyMs: r.latencyMs, jitterMs: r.jitterMs } });
        await new Promise((res) => setTimeout(res, 150));
        onProgress({ phase: "upload", percent: 50, partial: { latencyMs: r.latencyMs, jitterMs: r.jitterMs, downloadMbps: r.downloadMbps } });
        await new Promise((res) => setTimeout(res, 150));
        return r;
      },
    };
  }, result);
}

/** No live network: OSM tiles and Photon search are stubbed so tests are deterministic. */
export async function stubExternal(page: Page, places: unknown[] = []) {
  await page.route("**/tile.openstreetmap.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.alloc(0) }),
  );
  await page.route("**/api/search?**", (route) => route.fulfill({ json: { places, placesError: false } }));
}

let counter = 0;
export const uniq = (prefix: string) => `${prefix} ${process.pid}-${Date.now().toString(36)}-${counter++}`;

export interface TestStay {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export async function createStay(request: APIRequestContext, over: Record<string, unknown> = {}): Promise<TestStay> {
  const lat = 12 + Math.random() * 10;
  const lon = 74 + Math.random() * 10;
  const name = uniq("E2E Stay");
  const res = await request.post("/api/stays", {
    data: { name, kind: "hostel", city: "Testville", state: "Goa", lat, lon, ...over },
  });
  if (res.status() !== 201) throw new Error(`createStay failed: ${res.status()} ${await res.text()}`);
  const { stay } = await res.json();
  return { id: stay.id, name: stay.name, lat: stay.lat, lon: stay.lon };
}

export async function seedReading(request: APIRequestContext, s: TestStay, over: Record<string, unknown> = {}) {
  const res = await request.post("/api/readings", {
    data: {
      stayId: s.id,
      deviceId: `seed-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      spot: "room",
      downloadMbps: 60,
      uploadMbps: 30,
      latencyMs: 20,
      jitterMs: 2,
      packetLoss: 0,
      location: { lat: s.lat, lon: s.lon, accuracy: 10 },
      ...over,
    },
  });
  if (res.status() !== 201) throw new Error(`seedReading failed: ${res.status()} ${await res.text()}`);
}

export const placeAt = (context: BrowserContext, s: { lat: number; lon: number }, accuracy = 20) =>
  context.setGeolocation({ latitude: s.lat, longitude: s.lon, accuracy });
