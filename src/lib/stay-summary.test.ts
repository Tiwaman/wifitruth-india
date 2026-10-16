import { describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "./data/memory";
import { SEED_STAYS } from "./data/seed";
import { getHomeLists, getRecentReadings, getStaySummary, listStaysWithSummaries, parseSort } from "./stay-summary";

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

describe("listStaysWithSummaries", () => {
  async function setup() {
    const store = createMemoryStore();
    const [a, b, c, d] = SEED_STAYS;
    await add(store, a.id, 5, 30);
    await add(store, b.id, 2, 90);
    await add(store, c.id, 3, 5);
    return { store, a, b, c, d };
  }
  it("includes every stay, unrated last, and sorts by best speed", async () => {
    const { store, a, b, c } = await setup();
    const { items } = await listStaysWithSummaries(store, { sort: "best" });
    expect(items).toHaveLength(SEED_STAYS.length);
    expect(items.slice(0, 3).map((i) => i.stay.id)).toEqual([b.id, a.id, c.id]);
    expect(items.slice(3).every((i) => i.summary.readingCount === 0)).toBe(true);
  });
  it("sorts by most tested", async () => {
    const { store, a, b, c } = await setup();
    const { items } = await listStaysWithSummaries(store, { sort: "tested" });
    expect(items.slice(0, 3).map((i) => i.stay.id)).toEqual([a.id, c.id, b.id]);
  });
  it("sorts by recently tested", async () => {
    vi.useFakeTimers();
    try {
      const store = createMemoryStore();
      const [a, b, c] = SEED_STAYS;
      for (const [s, day] of [[a, 1], [b, 3], [c, 2]] as const) {
        vi.setSystemTime(new Date(`2026-10-0${day}T10:00:00Z`));
        await add(store, s.id, 1, 30, day);
      }
      const { items } = await listStaysWithSummaries(store, { sort: "recent" }, new Date("2026-10-05T00:00:00Z"));
      expect(items.slice(0, 3).map((i) => i.stay.id)).toEqual([b.id, c.id, a.id]);
    } finally {
      vi.useRealTimers();
    }
  });
  it("filters by search text and state (case-insensitive) and lists available states", async () => {
    const { store } = await setup();
    const all = await listStaysWithSummaries(store);
    const target = SEED_STAYS[0];
    const byQ = await listStaysWithSummaries(store, { q: ` ${target.name.toUpperCase()} ` });
    expect(byQ.items.map((i) => i.stay.id)).toContain(target.id);
    expect(byQ.items.length).toBeLessThan(all.items.length);
    const byState = await listStaysWithSummaries(store, { state: target.state.toLowerCase() });
    expect(byState.items.length).toBeGreaterThan(0);
    expect(byState.items.every((i) => i.stay.state === target.state)).toBe(true);
    expect(byState.states).toEqual(all.states);
    expect(all.states).toContain(target.state);
    expect((await listStaysWithSummaries(store, { q: "zzz-nothing" })).items).toEqual([]);
  });
  it("parseSort falls back to best", () => {
    expect(parseSort("tested")).toBe("tested");
    expect(parseSort("nope")).toBe("best");
    expect(parseSort(undefined)).toBe("best");
  });
});

describe("getRecentReadings", () => {
  it("returns newest first, capped, with only public fields", async () => {
    vi.useFakeTimers();
    try {
      const store = createMemoryStore();
      const id = SEED_STAYS[0].id;
      for (let i = 1; i <= 4; i++) {
        vi.setSystemTime(new Date(`2026-10-0${i}T10:00:00Z`));
        await add(store, id, 1, i * 10, i);
      }
      const r = await getRecentReadings(store, id, 3);
      expect(r).toHaveLength(3);
      expect(r.map((x) => x.downloadMbps)).toEqual([40, 30, 20]);
      for (const x of r) {
        expect(Object.keys(x).sort()).toEqual(["band", "createdAt", "downloadMbps", "jitterMs", "latencyMs", "spot", "uploadMbps"]);
      }
      expect(r[0].band).toBe("good");
      expect(r[2].band).toBe("moderate");
      const text = JSON.stringify(r);
      expect(text).not.toMatch(/deviceHash|ipHash|distance|packetLoss|stayId|"id"/);
    } finally {
      vi.useRealTimers();
    }
  });
  it("clamps the limit and handles stays with no readings", async () => {
    const store = createMemoryStore();
    expect(await getRecentReadings(store, SEED_STAYS[0].id)).toEqual([]);
    await add(store, SEED_STAYS[0].id, 3, 30);
    expect(await getRecentReadings(store, SEED_STAYS[0].id, 0)).toHaveLength(1);
    expect(await getRecentReadings(store, SEED_STAYS[0].id, NaN)).toHaveLength(3);
    expect(await getRecentReadings(store, SEED_STAYS[0].id, 9999)).toHaveLength(3);
  });
  it("only returns readings of the requested stay", async () => {
    const store = createMemoryStore();
    await add(store, SEED_STAYS[0].id, 2, 30);
    await add(store, SEED_STAYS[1].id, 2, 30);
    expect(await getRecentReadings(store, SEED_STAYS[1].id)).toHaveLength(2);
  });
});
