import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseStore } from "./supabase";

const STAY_ROW = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Zostel Kasol",
  kind: "hostel",
  city: "Kasol",
  state: "Himachal Pradesh",
  lat: 32.0101,
  lon: 77.3153,
  osm_type: null,
  osm_id: null,
  created_at: "2026-10-15T00:00:00Z",
};
const NEW_READING = {
  stayId: STAY_ROW.id,
  spot: "room" as const,
  downloadMbps: 40,
  uploadMbps: 20,
  latencyMs: 30,
  jitterMs: 3,
  packetLoss: 0,
  deviceHash: "d",
  ipHash: "i",
  distanceM: 12,
  readingDay: "2026-10-15",
};

function mockFetch(...responses: Response[]) {
  const fn = vi.fn();
  for (const r of responses) fn.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fn);
  return fn;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const store = () => createSupabaseStore("https://x.supabase.co/", "service-key");

afterEach(() => vi.unstubAllGlobals());

describe("supabase adapter", () => {
  it("sends the service key and maps snake_case rows", async () => {
    const fn = mockFetch(json([STAY_ROW]));
    const stay = await store().getStay(STAY_ROW.id);
    expect(stay).toMatchObject({ id: STAY_ROW.id, name: "Zostel Kasol", osmType: null, createdAt: STAY_ROW.created_at });
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe(`https://x.supabase.co/rest/v1/stays?select=*&id=eq.${STAY_ROW.id}&limit=1`);
    expect(init.headers.Authorization).toBe("Bearer service-key");
  });

  it("search strips filter-syntax characters and matches name, city and state", async () => {
    const fn = mockFetch(json([]));
    await store().listStays({ q: "ka),name.eq.x,(*sol%", limit: 5 });
    const url = decodeURIComponent(fn.mock.calls[0][0] as string);
    expect(url).toContain("or=(name.ilike.*ka name eq x sol*,city.ilike.*ka name eq x sol*,state.ilike.*ka name eq x sol*)");
    expect(url).not.toContain("),name.eq");
  });

  it("insertReading writes snake_case columns and never raw coordinates", async () => {
    const fn = mockFetch(json([{ ...NEW_READING, id: "r1", stay_id: STAY_ROW.id, download_mbps: 40, upload_mbps: 20, latency_ms: 30, jitter_ms: 3, packet_loss: 0, device_hash: "d", ip_hash: "i", distance_m: 12, reading_day: "2026-10-15", created_at: "2026-10-15T00:00:00Z" }], 201));
    const res = await store().insertReading(NEW_READING);
    expect(res.ok).toBe(true);
    const sent = JSON.parse(fn.mock.calls[0][1].body);
    expect(Object.keys(sent).sort()).toEqual(
      ["device_hash", "distance_m", "download_mbps", "ip_hash", "jitter_ms", "latency_ms", "packet_loss", "reading_day", "spot", "stay_id", "upload_mbps"],
    );
  });

  it("maps unique violation (23505) to duplicate but other 409s throw", async () => {
    mockFetch(json({ code: "23505", message: "duplicate key" }, 409));
    expect(await store().insertReading(NEW_READING)).toEqual({ ok: false, reason: "duplicate" });
    mockFetch(json({ code: "23503", message: "fk" }, 409));
    await expect(store().insertReading(NEW_READING)).rejects.toThrow("Supabase error 409");
  });

  it("createStay returns the existing stay when the OSM unique index races", async () => {
    mockFetch(json({ code: "23505" }, 409), json([{ ...STAY_ROW, osm_type: "N", osm_id: 5 }]));
    const s = await store().createStay({ name: "A", kind: "other", city: "c", state: "s", lat: 20, lon: 80, osmType: "N", osmId: 5 });
    expect(s.osmId).toBe(5);
  });

  it("errors do not leak response bodies", async () => {
    mockFetch(json({ message: "secret internal detail" }, 500));
    await expect(store().getStay(STAY_ROW.id)).rejects.toThrow(/^Supabase error 500$/);
  });
});
