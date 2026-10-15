import type { NewReading, NewStay, Reading, Stay, StayAggregate } from "../types";
import type { DataStore, InsertReadingResult } from "./store";

type Row = Record<string, unknown>;

const toStay = (r: Row): Stay => ({
  id: r.id as string,
  name: r.name as string,
  kind: r.kind as Stay["kind"],
  city: r.city as string,
  state: r.state as string,
  lat: Number(r.lat),
  lon: Number(r.lon),
  osmType: (r.osm_type as string | null) ?? null,
  osmId: r.osm_id == null ? null : Number(r.osm_id),
  createdAt: r.created_at as string,
});

const toReading = (r: Row): Reading => ({
  id: r.id as string,
  stayId: r.stay_id as string,
  spot: r.spot as Reading["spot"],
  downloadMbps: Number(r.download_mbps),
  uploadMbps: Number(r.upload_mbps),
  latencyMs: Number(r.latency_ms),
  jitterMs: Number(r.jitter_ms),
  packetLoss: Number(r.packet_loss),
  deviceHash: r.device_hash as string,
  ipHash: r.ip_hash as string,
  distanceM: Number(r.distance_m),
  readingDay: r.reading_day as string,
  createdAt: r.created_at as string,
});

export function createSupabaseStore(url: string, serviceKey: string): DataStore {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  async function call(pathAndQuery: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${base}/${pathAndQuery}`, { ...init, headers: { ...headers, ...init.headers }, cache: "no-store" });
  }
  async function rows(pathAndQuery: string): Promise<Row[]> {
    const res = await call(pathAndQuery);
    if (!res.ok) throw new Error(`Supabase error ${res.status}`);
    return (await res.json()) as Row[];
  }

  return {
    async listStays({ q, limit = 20 } = {}) {
      const clean = q?.replace(/[^\p{L}\p{N} '-]/gu, " ").replace(/\s+/g, " ").trim();
      const pattern = `*${clean}*`;
      const filter = clean
        ? `&or=${encodeURIComponent(`(name.ilike.${pattern},city.ilike.${pattern},state.ilike.${pattern})`)}`
        : "";
      return (await rows(`stays?select=*&order=name&limit=${limit}${filter}`)).map(toStay);
    },
    async getStay(id) {
      const r = await rows(`stays?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
      return r[0] ? toStay(r[0]) : null;
    },
    async findStayByOsm(osmType, osmId) {
      const r = await rows(
        `stays?select=*&osm_type=eq.${encodeURIComponent(osmType)}&osm_id=eq.${osmId}&limit=1`,
      );
      return r[0] ? toStay(r[0]) : null;
    },
    async createStay(input: NewStay) {
      const res = await call("stays", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          name: input.name,
          kind: input.kind,
          city: input.city,
          state: input.state,
          lat: input.lat,
          lon: input.lon,
          osm_type: input.osmType ?? null,
          osm_id: input.osmId ?? null,
        }),
      });
      if (res.status === 409 && input.osmType && input.osmId) {
        const r = await rows(
          `stays?select=*&osm_type=eq.${encodeURIComponent(input.osmType)}&osm_id=eq.${input.osmId}&limit=1`,
        );
        if (r[0]) return toStay(r[0]);
      }
      if (!res.ok) throw new Error(`Supabase error ${res.status}`);
      return toStay(((await res.json()) as Row[])[0]);
    },
    async insertReading(input: NewReading): Promise<InsertReadingResult> {
      const res = await call("readings", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          stay_id: input.stayId,
          spot: input.spot,
          download_mbps: input.downloadMbps,
          upload_mbps: input.uploadMbps,
          latency_ms: input.latencyMs,
          jitter_ms: input.jitterMs,
          packet_loss: input.packetLoss,
          device_hash: input.deviceHash,
          ip_hash: input.ipHash,
          distance_m: input.distanceM,
          reading_day: input.readingDay,
        }),
      });
      if (res.status === 409) {
        const err = (await res.json().catch(() => null)) as { code?: string } | null;
        if (err?.code === "23505") return { ok: false, reason: "duplicate" };
      }
      if (!res.ok) throw new Error(`Supabase error ${res.status}`);
      return { ok: true, reading: toReading(((await res.json()) as Row[])[0]) };
    },
    async listReadings({ stayId } = {}) {
      const filter = stayId ? `&stay_id=eq.${encodeURIComponent(stayId)}` : "";
      return (await rows(`readings?select=*&order=created_at.desc&limit=5000${filter}`)).map(toReading);
    },
    async getAggregate(stayId): Promise<StayAggregate> {
      const r = (await rows(`stay_aggregates?select=*&stay_id=eq.${encodeURIComponent(stayId)}&limit=1`))[0];
      const n = (v: unknown) => (v == null ? null : Number(v));
      return {
        stayId,
        readingCount: r ? Number(r.reading_count) : 0,
        medianDownloadMbps: n(r?.median_download_mbps),
        medianUploadMbps: n(r?.median_upload_mbps),
        medianLatencyMs: n(r?.median_latency_ms),
        lastReadingAt: (r?.last_reading_at as string | null) ?? null,
      };
    },
  };
}
