import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMemoryStore } from "./memory";
import { SEED_STAYS } from "./seed";
import type { NewReading } from "../types";

const reading: NewReading = {
  stayId: SEED_STAYS[0].id,
  spot: "room",
  downloadMbps: 20,
  uploadMbps: 8,
  latencyMs: 40,
  jitterMs: 5,
  packetLoss: 0,
  deviceHash: "d1",
  ipHash: "i1",
  distanceM: 30,
  readingDay: "2026-10-15",
};

describe("seed", () => {
  it("has ~15 stays with unique ids incl. key destinations", () => {
    expect(SEED_STAYS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(SEED_STAYS.map((s) => s.id)).size).toBe(SEED_STAYS.length);
    const cities = SEED_STAYS.map((s) => s.city);
    for (const c of ["Kasol", "Manali", "Rishikesh", "Bengaluru"]) expect(cities).toContain(c);
    expect(SEED_STAYS.some((s) => s.state === "Goa")).toBe(true);
  });
});

describe("memory store", () => {
  it("searches case-insensitively over name and city", async () => {
    const s = createMemoryStore();
    expect((await s.listStays({ q: "kasol" })).length).toBeGreaterThanOrEqual(2);
    expect(await s.listStays({ q: "zzzz" })).toEqual([]);
  });

  it("creates and finds stays by osm id", async () => {
    const s = createMemoryStore();
    const stay = await s.createStay({ name: "X", kind: "hostel", city: "C", state: "S", lat: 20, lon: 78, osmType: "N", osmId: 42 });
    expect((await s.getStay(stay.id))?.name).toBe("X");
    expect((await s.findStayByOsm("N", 42))?.id).toBe(stay.id);
    expect(await s.findStayByOsm("N", 43)).toBeNull();
  });

  it("enforces one reading per device per stay per day and aggregates medians", async () => {
    const s = createMemoryStore();
    expect((await s.insertReading(reading)).ok).toBe(true);
    expect(await s.insertReading(reading)).toEqual({ ok: false, reason: "duplicate" });
    expect((await s.insertReading({ ...reading, deviceHash: "d2", downloadMbps: 40 })).ok).toBe(true);
    expect((await s.insertReading({ ...reading, readingDay: "2026-10-16", downloadMbps: 30 })).ok).toBe(true);
    const agg = await s.getAggregate(reading.stayId);
    expect(agg.readingCount).toBe(3);
    expect(agg.medianDownloadMbps).toBe(30);
  });

  it("persists to a JSON file", async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wifi-")), "db.json");
    const a = createMemoryStore({ filePath: file });
    await a.createStay({ name: "Persisted", kind: "other", city: "C", state: "S", lat: 20, lon: 78 });
    const b = createMemoryStore({ filePath: file });
    expect((await b.listStays({ q: "persisted" })).length).toBe(1);
  });
});
