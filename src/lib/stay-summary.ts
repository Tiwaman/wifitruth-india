import type { DataStore } from "./data/store";
import { BANDS, bandFor, summarizeStay, type Band, type StaySummary } from "./scoring";
import type { Spot, Stay } from "./types";

export async function getStaySummary(store: DataStore, stayId: string, now = new Date()): Promise<StaySummary> {
  return summarizeStay(stayId, await store.listReadings({ stayId }), now);
}

export interface StayWithSummary {
  stay: Stay;
  summary: StaySummary;
}

export const TOP_MIN_READINGS = 3;

export async function getHomeLists(store: DataStore, now = new Date(), limit = 6) {
  const [stays, readings] = await Promise.all([store.listStays({ limit: 1000 }), store.listReadings()]);
  const byStay = new Map<string, typeof readings>();
  for (const r of readings) byStay.set(r.stayId, [...(byStay.get(r.stayId) ?? []), r]);
  const rated: StayWithSummary[] = stays
    .filter((s) => byStay.has(s.id))
    .map((stay) => ({ stay, summary: summarizeStay(stay.id, byStay.get(stay.id)!, now) }));

  const recent = [...rated]
    .sort((a, b) => b.summary.lastReadingAt!.localeCompare(a.summary.lastReadingAt!))
    .slice(0, limit);
  const top = rated
    .filter((x) => x.summary.readingCount >= TOP_MIN_READINGS)
    .sort(
      (a, b) =>
        BANDS.indexOf(b.summary.band!) - BANDS.indexOf(a.summary.band!) ||
        b.summary.medianDownloadMbps! - a.summary.medianDownloadMbps! ||
        b.summary.readingCount - a.summary.readingCount,
    )
    .slice(0, limit);
  return { recent, top };
}

export const STAY_SORTS = ["best", "tested", "recent"] as const;
export type StaySort = (typeof STAY_SORTS)[number];

export interface StayListOptions {
  q?: string;
  state?: string;
  sort?: StaySort;
}

export interface StayList {
  items: StayWithSummary[];
  states: string[];
}

export const parseSort = (v: unknown): StaySort => (STAY_SORTS as readonly unknown[]).includes(v) ? (v as StaySort) : "best";

/**
 * All stays with their summaries. Unrated stays always sort last. "best" ranks by band, then median download;
 * "tested" by reading count; "recent" by latest reading. Ties fall back to name.
 */
export async function listStaysWithSummaries(store: DataStore, opts: StayListOptions = {}, now = new Date()): Promise<StayList> {
  const [stays, readings] = await Promise.all([store.listStays({ limit: 5000 }), store.listReadings()]);
  const byStay = new Map<string, typeof readings>();
  for (const r of readings) byStay.set(r.stayId, [...(byStay.get(r.stayId) ?? []), r]);
  const all: StayWithSummary[] = stays.map((stay) => ({ stay, summary: summarizeStay(stay.id, byStay.get(stay.id) ?? [], now) }));
  const states = [...new Set(all.map((i) => i.stay.state).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const needle = opts.q?.trim().toLowerCase();
  const state = opts.state?.trim().toLowerCase();
  const items = all.filter(
    ({ stay }) =>
      (!state || stay.state.toLowerCase() === state) &&
      (!needle || `${stay.name} ${stay.city} ${stay.state}`.toLowerCase().includes(needle)),
  );

  const sort = opts.sort ?? "best";
  const key = (i: StayWithSummary): number => {
    const s = i.summary;
    if (s.readingCount === 0) return -Infinity;
    if (sort === "tested") return s.readingCount;
    if (sort === "recent") return new Date(s.lastReadingAt!).getTime();
    return BANDS.indexOf(s.band!) * 1e6 + (s.medianDownloadMbps ?? 0);
  };
  items.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka !== kb) return ka === -Infinity ? 1 : kb === -Infinity ? -1 : kb - ka;
    return b.summary.readingCount - a.summary.readingCount || a.stay.name.localeCompare(b.stay.name);
  });
  return { items, states };
}

/** The only fields of a reading that may leave the server. Never add device/IP hashes or distance. */
export interface PublicReading {
  spot: Spot;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  band: Band;
  createdAt: string;
}

export const MAX_RECENT = 50;

export async function getRecentReadings(store: DataStore, stayId: string, limit = 10): Promise<PublicReading[]> {
  const n = Math.min(MAX_RECENT, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 10));
  const readings = await store.listReadings({ stayId });
  return readings
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, n)
    .map((r) => ({
      spot: r.spot,
      downloadMbps: r.downloadMbps,
      uploadMbps: r.uploadMbps,
      latencyMs: r.latencyMs,
      jitterMs: r.jitterMs,
      band: bandFor(r).band,
      createdAt: r.createdAt,
    }));
}
