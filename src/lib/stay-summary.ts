import type { DataStore } from "./data/store";
import { BANDS, summarizeStay, type StaySummary } from "./scoring";
import type { Stay } from "./types";

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
