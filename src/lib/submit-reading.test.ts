import { describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "./data/memory";
import { SEED_STAYS } from "./data/seed";
import { createDefaultLimiters, submitReading } from "./submit-reading";

const stay = SEED_STAYS[0];
const fix = { lat: stay.lat, lon: stay.lon, accuracy: 20 };
const bodyFor = (over: Record<string, unknown> = {}) => ({
  stayId: stay.id,
  deviceId: "dev-aaaaaaaaaaaaaaaa",
  spot: "room",
  downloadMbps: 30,
  uploadMbps: 10,
  latencyMs: 40,
  jitterMs: 2,
  packetLoss: 0,
  location: fix,
  ...over,
});
const h = (ip = "9.9.9.9") => new Headers({ "x-forwarded-for": ip });
const mk = () => {
  const store = createMemoryStore();
  return { store, salt: "test-salt", ...createDefaultLimiters() };
};

describe("submitReading", () => {
  it("stores a reading with hashes and no raw coordinates", async () => {
    const deps = mk();
    const res = await submitReading(stay.id, bodyFor(), h(), deps);
    expect(res.status).toBe(201);
    const rows = await deps.store.listReadings({ stayId: stay.id });
    expect(rows).toHaveLength(1);
    const json = JSON.stringify(rows[0]);
    expect(json).not.toContain("9.9.9.9");
    expect(json).not.toContain("dev-aaaaaaaaaaaaaaaa");
    expect(json).not.toContain(String(stay.lat));
    expect(rows[0].distanceM).toBeLessThanOrEqual(150);
  });
  it("rejects second reading from same device same stay same day", async () => {
    const deps = mk();
    await submitReading(stay.id, bodyFor(), h(), deps);
    const res = await submitReading(stay.id, bodyFor(), h(), deps);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ code: "duplicate" });
  });
  it("allows the same device next day", async () => {
    const deps = mk();
    await submitReading(stay.id, bodyFor(), h(), { ...deps, now: new Date("2026-10-15T06:00:00Z") });
    const res = await submitReading(stay.id, bodyFor(), h(), { ...deps, now: new Date("2026-10-16T06:00:00Z") });
    expect(res.status).toBe(201);
  });
  it("re-validates location server-side", async () => {
    const deps = mk();
    expect((await submitReading(stay.id, bodyFor({ location: { ...fix, lat: fix.lat + 0.05 } }), h(), deps)).body).toMatchObject({ code: "too_far" });
    expect((await submitReading(stay.id, bodyFor({ location: { ...fix, accuracy: 500 } }), h(), deps)).body).toMatchObject({ code: "low_accuracy" });
    expect((await submitReading(stay.id, bodyFor({ location: undefined }), h(), deps)).body).toMatchObject({ code: "location_invalid" });
    expect(await deps.store.listReadings({ stayId: stay.id })).toHaveLength(0);
  });
  it("rejects implausible values and unknown stays", async () => {
    const deps = mk();
    expect((await submitReading(stay.id, bodyFor({ downloadMbps: 99999 }), h(), deps)).status).toBe(400);
    expect((await submitReading("nope", bodyFor(), h(), deps)).status).toBe(404);
  });
  it("rate limits by IP and by device with Retry-After", async () => {
    const deps = mk();
    let last = await submitReading(stay.id, bodyFor(), h("1.1.1.1"), deps);
    for (let i = 0; i < 8; i++) last = await submitReading(stay.id, bodyFor(), h("1.1.1.1"), deps);
    expect(last.status).toBe(429);
    expect(last.headers?.["Retry-After"]).toBeTruthy();
    expect((last.body as { error: string }).error).toMatch(/too many|wait/i);
    const ipDeps = mk();
    let r = await submitReading(stay.id, bodyFor({ downloadMbps: 0 }), h("2.2.2.2"), ipDeps);
    for (let i = 0; i < 20; i++) r = await submitReading(stay.id, bodyFor({ deviceId: `dev-${i}`.padEnd(20, "x"), downloadMbps: 0 }), h("2.2.2.2"), ipDeps);
    expect(r.status).toBe(429);
  });
  it("refuses without a salt", async () => {
    const res = await submitReading(stay.id, bodyFor(), h(), { ...mk(), salt: null });
    expect(res.status).toBe(503);
  });
});

describe("submitReading with the location check skipped (test mode)", () => {
  it("accepts a reading from far away or without a location, storing distance 0", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKIP_LOCATION_CHECK", "true");
    try {
      const deps = mk();
      const far = await submitReading(stay.id, bodyFor({ location: { lat: 28.6, lon: 77.2, accuracy: 20 } }), h("1.1.1.1"), deps);
      expect(far.status).toBe(201);
      const none = await submitReading(stay.id, bodyFor({ deviceId: "dev-bbbbbbbbbbbbbbbb", location: null }), h("1.1.1.2"), deps);
      expect(none.status).toBe(201);
      const rows = await deps.store.listReadings({ stayId: stay.id });
      expect(rows.map((r) => r.distanceM)).toEqual([0, 0]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("still rejects far readings when the flag is off or not exactly true", async () => {
    vi.stubEnv("NEXT_PUBLIC_SKIP_LOCATION_CHECK", "yes");
    try {
      const res = await submitReading(stay.id, bodyFor({ location: { lat: 28.6, lon: 77.2, accuracy: 20 } }), h(), mk());
      expect(res.status).toBe(422);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
