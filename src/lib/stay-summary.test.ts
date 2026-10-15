import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./data/memory";
import { SEED_STAYS } from "./data/seed";
import { getHomeLists, getStaySummary } from "./stay-summary";

async function add(store: ReturnType<typeof createMemoryStore>, stayId: string, n: number, down: number, day0 = 1) {
  for (let i = 0; i < n; i++) {
    await store.insertReading({
      stayId,
      spot: "room",
      downloadMbps: down,
      uploadMbps: down,
      latencyMs: 30,
      jitterMs: 1,
      packetLoss: 0,
      deviceHash: `d${stayId}${i}`,
      ipHash: "ip",
      distanceM: 10,
      readingDay: `2026-10-0${day0}`,
    });
  }
}

describe("stay summary service", () => {
  it("summarises a stay from the store", async () => {
    const store = createMemoryStore();
    await add(store, SEED_STAYS[0].id, 3, 30);
    const s = await getStaySummary(store, SEED_STAYS[0].id);
    expect(s).toMatchObject({ readingCount: 3, band: "good", confidence: "medium" });
    expect(s.spots).toHaveLength(1);
  });
  it("home lists: top needs 3 readings and ranks by band then speed; recent includes any", async () => {
    const store = createMemoryStore();
    await add(store, SEED_STAYS[0].id, 3, 30);
    await add(store, SEED_STAYS[1].id, 3, 80);
    await add(store, SEED_STAYS[2].id, 3, 5);
    await add(store, SEED_STAYS[3].id, 1, 200);
    const { top, recent } = await getHomeLists(store);
    expect(top.map((t) => t.stay.id)).toEqual([SEED_STAYS[1].id, SEED_STAYS[0].id, SEED_STAYS[2].id]);
    expect(recent.map((t) => t.stay.id)).toContain(SEED_STAYS[3].id);
  });
  it("empty store gives empty lists", async () => {
    expect(await getHomeLists(createMemoryStore())).toEqual({ recent: [], top: [] });
  });
});
