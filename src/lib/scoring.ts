import { SPOTS, type Reading, type Spot } from "./types";

export const BANDS = ["poor", "moderate", "good"] as const;
export type Band = (typeof BANDS)[number];
export type Confidence = "low" | "medium" | "high";

export const BAND_THRESHOLDS = { moderate: 10, good: 25, excellent: 50 } as const;
export const UPLOAD_MIN_RATIO = 0.25;
export const LATENCY_DOWNGRADE_MS = 150;
export const RECENT_DAYS = 90;
export const OLD_WEIGHT = 0.5;
const DAY_MS = 86_400_000;

export interface Metrics {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
}

export interface BandResult {
  band: Band;
  excellent: boolean;
  downgrades: ("upload" | "latency")[];
}

function baseBand(downloadMbps: number): Band {
  if (downloadMbps >= BAND_THRESHOLDS.good) return "good";
  if (downloadMbps >= BAND_THRESHOLDS.moderate) return "moderate";
  return "poor";
}

/**
 * Band from download speed, then one downgrade each for weak upload (less than
 * 25% of the download threshold of the band reached) and high latency (> 150 ms).
 * Both can apply, so the result can drop two bands; it never goes below poor.
 * "Excellent" is a label for an undowngraded good band with download >= 50 Mbps.
 */
export function bandFor(m: Metrics): BandResult {
  let idx = BANDS.indexOf(baseBand(m.downloadMbps));
  const downgrades: BandResult["downgrades"] = [];
  const threshold = idx === 2 ? BAND_THRESHOLDS.good : idx === 1 ? BAND_THRESHOLDS.moderate : 0;
  if (idx > 0 && m.uploadMbps < threshold * UPLOAD_MIN_RATIO) {
    idx -= 1;
    downgrades.push("upload");
  }
  if (idx > 0 && m.latencyMs > LATENCY_DOWNGRADE_MS) {
    idx -= 1;
    downgrades.push("latency");
  }
  const band = BANDS[idx];
  return { band, excellent: band === "good" && downgrades.length === 0 && m.downloadMbps >= BAND_THRESHOLDS.excellent, downgrades };
}

export function confidenceFor(count: number): Confidence {
  if (count >= 10) return "high";
  if (count >= 3) return "medium";
  return "low";
}

export function recencyWeight(createdAt: string, now: Date): number {
  const age = now.getTime() - new Date(createdAt).getTime();
  return age <= RECENT_DAYS * DAY_MS ? 1 : OLD_WEIGHT;
}

export function weightedMedian(items: { value: number; weight: number }[]): number | null {
  const xs = items.filter((i) => i.weight > 0 && Number.isFinite(i.value)).sort((a, b) => a.value - b.value);
  if (xs.length === 0) return null;
  const total = xs.reduce((s, i) => s + i.weight, 0);
  const half = total / 2;
  let cum = 0;
  for (let i = 0; i < xs.length; i++) {
    cum += xs[i].weight;
    if (Math.abs(cum - half) < 1e-9) return i + 1 < xs.length ? (xs[i].value + xs[i + 1].value) / 2 : xs[i].value;
    if (cum > half) return xs[i].value;
  }
  return xs[xs.length - 1].value;
}

/** Whole-number percentages that always sum to 100 (largest remainder). */
export function toPercentages(weights: Record<Band, number>): Record<Band, number> {
  const total = BANDS.reduce((s, b) => s + weights[b], 0);
  if (total <= 0) return { poor: 0, moderate: 0, good: 0 };
  const raw = BANDS.map((b) => ({ b, exact: (weights[b] / total) * 100 }));
  const out: Record<Band, number> = { poor: 0, moderate: 0, good: 0 };
  let used = 0;
  for (const r of raw) {
    out[r.b] = Math.floor(r.exact);
    used += out[r.b];
  }
  const order = [...raw].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
  for (let i = 0; i < 100 - used; i++) out[order[i % order.length].b] += 1;
  return out;
}

const r1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

export interface GroupSummary {
  readingCount: number;
  confidence: Confidence;
  band: Band | null;
  excellent: boolean;
  medianDownloadMbps: number | null;
  medianUploadMbps: number | null;
  medianLatencyMs: number | null;
  bandPercentages: Record<Band, number>;
  lastReadingAt: string | null;
  daysSinceLast: number | null;
}

export type ScoredReading = Pick<Reading, "downloadMbps" | "uploadMbps" | "latencyMs" | "createdAt">;

export function summarize(readings: ScoredReading[], now: Date = new Date()): GroupSummary {
  if (readings.length === 0) {
    return {
      readingCount: 0,
      confidence: "low",
      band: null,
      excellent: false,
      medianDownloadMbps: null,
      medianUploadMbps: null,
      medianLatencyMs: null,
      bandPercentages: { poor: 0, moderate: 0, good: 0 },
      lastReadingAt: null,
      daysSinceLast: null,
    };
  }
  const weighted = readings.map((r) => ({ r, w: recencyWeight(r.createdAt, now) }));
  const med = (pick: (r: ScoredReading) => number) => weightedMedian(weighted.map(({ r, w }) => ({ value: pick(r), weight: w })));
  const download = med((r) => r.downloadMbps)!;
  const upload = med((r) => r.uploadMbps)!;
  const latency = med((r) => r.latencyMs)!;
  const overall = bandFor({ downloadMbps: download, uploadMbps: upload, latencyMs: latency });

  const weights: Record<Band, number> = { poor: 0, moderate: 0, good: 0 };
  for (const { r, w } of weighted) weights[bandFor(r).band] += w;

  const last = readings.map((r) => r.createdAt).reduce((a, b) => (new Date(a) >= new Date(b) ? a : b));
  return {
    readingCount: readings.length,
    confidence: confidenceFor(readings.length),
    band: overall.band,
    excellent: overall.excellent,
    medianDownloadMbps: r1(download),
    medianUploadMbps: r1(upload),
    medianLatencyMs: r1(latency),
    bandPercentages: toPercentages(weights),
    lastReadingAt: last,
    daysSinceLast: Math.max(0, Math.floor((now.getTime() - new Date(last).getTime()) / DAY_MS)),
  };
}

export interface SpotSummary extends GroupSummary {
  spot: Spot;
}

export interface StaySummary extends GroupSummary {
  stayId: string;
  spots: SpotSummary[];
}

export function summarizeStay(stayId: string, readings: (ScoredReading & { spot: Spot })[], now: Date = new Date()): StaySummary {
  const spots = SPOTS.map((spot) => ({ spot, ...summarize(readings.filter((r) => r.spot === spot), now) }))
    .filter((s) => s.readingCount > 0)
    .sort((a, b) => b.readingCount - a.readingCount || SPOTS.indexOf(a.spot) - SPOTS.indexOf(b.spot));
  return { stayId, ...summarize(readings, now), spots };
}
