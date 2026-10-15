import { describe, expect, it } from "vitest";
import {
  bandFor,
  confidenceFor,
  recencyWeight,
  summarize,
  summarizeStay,
  toPercentages,
  weightedMedian,
} from "./scoring";

const NOW = new Date("2026-10-15T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const rd = (down: number, up = down, lat = 30, ago = 1, spot: "room" | "rooftop" | "dorm" = "room") => ({
  downloadMbps: down,
  uploadMbps: up,
  latencyMs: lat,
  createdAt: daysAgo(ago),
  spot,
});

describe("bandFor", () => {
  it.each([
    [0, "poor"],
    [9.99, "poor"],
    [10, "moderate"],
    [24.99, "moderate"],
    [25, "good"],
    [49.99, "good"],
    [500, "good"],
  ])("download %s -> %s", (d, band) => {
    expect(bandFor({ downloadMbps: d, uploadMbps: d, latencyMs: 20 }).band).toBe(band);
  });

  it("labels excellent from 50 Mbps", () => {
    expect(bandFor({ downloadMbps: 50, uploadMbps: 50, latencyMs: 20 })).toMatchObject({ band: "good", excellent: true });
    expect(bandFor({ downloadMbps: 49.9, uploadMbps: 50, latencyMs: 20 }).excellent).toBe(false);
  });

  it("downgrades good to moderate when upload < 6.25 (25% of 25)", () => {
    expect(bandFor({ downloadMbps: 100, uploadMbps: 6.24, latencyMs: 20 })).toEqual({
      band: "moderate",
      excellent: false,
      downgrades: ["upload"],
    });
    expect(bandFor({ downloadMbps: 100, uploadMbps: 6.25, latencyMs: 20 }).band).toBe("good");
  });

  it("downgrades moderate to poor when upload < 2.5", () => {
    expect(bandFor({ downloadMbps: 20, uploadMbps: 2.49, latencyMs: 20 }).band).toBe("poor");
    expect(bandFor({ downloadMbps: 20, uploadMbps: 2.5, latencyMs: 20 }).band).toBe("moderate");
  });

  it("downgrades one band when latency > 150 ms (not at exactly 150)", () => {
    expect(bandFor({ downloadMbps: 60, uploadMbps: 30, latencyMs: 150 }).band).toBe("good");
    expect(bandFor({ downloadMbps: 60, uploadMbps: 30, latencyMs: 150.1 })).toMatchObject({
      band: "moderate",
      excellent: false,
      downgrades: ["latency"],
    });
  });

  it("applies both downgrades but never below poor", () => {
    expect(bandFor({ downloadMbps: 100, uploadMbps: 1, latencyMs: 400 })).toMatchObject({
      band: "poor",
      downgrades: ["upload", "latency"],
    });
    expect(bandFor({ downloadMbps: 15, uploadMbps: 0, latencyMs: 400 }).band).toBe("poor");
    expect(bandFor({ downloadMbps: 1, uploadMbps: 0, latencyMs: 900 })).toMatchObject({ band: "poor", downgrades: [] });
  });
});

describe("confidenceFor", () => {
  it.each([
    [0, "low"],
    [2, "low"],
    [3, "medium"],
    [9, "medium"],
    [10, "high"],
    [200, "high"],
  ])("%s readings -> %s", (n, c) => expect(confidenceFor(n)).toBe(c));
});

describe("recencyWeight", () => {
  it("full within 90 days, half after", () => {
    expect(recencyWeight(daysAgo(0), NOW)).toBe(1);
    expect(recencyWeight(daysAgo(90), NOW)).toBe(1);
    expect(recencyWeight(daysAgo(91), NOW)).toBe(0.5);
  });
});

describe("weightedMedian", () => {
  it("returns null for empty", () => expect(weightedMedian([])).toBeNull());
  it("single value", () => expect(weightedMedian([{ value: 7, weight: 1 }])).toBe(7));
  it("plain median odd and even", () => {
    const w = (xs: number[]) => xs.map((value) => ({ value, weight: 1 }));
    expect(weightedMedian(w([5, 1, 3]))).toBe(3);
    expect(weightedMedian(w([4, 1, 3, 2]))).toBe(2.5);
  });
  it("heavier recent values pull the median", () => {
    expect(
      weightedMedian([
        { value: 1, weight: 0.5 },
        { value: 2, weight: 0.5 },
        { value: 100, weight: 1 },
      ]),
    ).toBe(51);
    expect(
      weightedMedian([
        { value: 1, weight: 0.5 },
        { value: 50, weight: 1 },
        { value: 100, weight: 1 },
      ]),
    ).toBe(50);
  });
  it("ignores zero weights and non-finite values", () => {
    expect(
      weightedMedian([
        { value: 999, weight: 0 },
        { value: NaN, weight: 1 },
        { value: 4, weight: 1 },
      ]),
    ).toBe(4);
  });
});

describe("toPercentages", () => {
  it("sums to 100 with largest remainder", () => {
    const p = toPercentages({ poor: 1, moderate: 1, good: 1 });
    expect(p.poor + p.moderate + p.good).toBe(100);
    expect(Object.values(p).sort()).toEqual([33, 33, 34]);
  });
  it("handles zero and single band", () => {
    expect(toPercentages({ poor: 0, moderate: 0, good: 0 })).toEqual({ poor: 0, moderate: 0, good: 0 });
    expect(toPercentages({ poor: 0, moderate: 0, good: 2.5 })).toEqual({ poor: 0, moderate: 0, good: 100 });
  });
  it("respects fractional weights", () => {
    expect(toPercentages({ poor: 0.5, moderate: 0, good: 1.5 })).toEqual({ poor: 25, moderate: 0, good: 75 });
  });
});

describe("summarize", () => {
  it("empty input", () => {
    const s = summarize([], NOW);
    expect(s).toMatchObject({ readingCount: 0, confidence: "low", band: null, medianDownloadMbps: null, lastReadingAt: null });
    expect(s.bandPercentages).toEqual({ poor: 0, moderate: 0, good: 0 });
  });

  it("single reading", () => {
    const s = summarize([rd(30, 10, 40, 3)], NOW);
    expect(s).toMatchObject({
      readingCount: 1,
      confidence: "low",
      band: "good",
      medianDownloadMbps: 30,
      medianUploadMbps: 10,
      medianLatencyMs: 40,
      daysSinceLast: 3,
    });
    expect(s.bandPercentages).toEqual({ poor: 0, moderate: 0, good: 100 });
  });

  it("median is robust to a single outlier", () => {
    const s = summarize([rd(5), rd(6), rd(7), rd(8), rd(1000)], NOW);
    expect(s.medianDownloadMbps).toBe(7);
    expect(s.band).toBe("poor");
    expect(s.bandPercentages).toEqual({ poor: 80, moderate: 0, good: 20 });
  });

  it("stay band is computed from medians, with downgrades", () => {
    const s = summarize([rd(80, 2), rd(90, 3), rd(70, 1)], NOW);
    expect(s.medianUploadMbps).toBe(2);
    expect(s.band).toBe("moderate");
    expect(s.excellent).toBe(false);
  });

  it("per-reading band uses that reading's upload and latency", () => {
    const s = summarize([rd(100, 1), rd(100, 50, 20), rd(100, 50, 200), rd(12, 5, 20)], NOW);
    expect(s.bandPercentages).toEqual({ poor: 0, moderate: 75, good: 25 });
  });

  it("old readings count half in medians and percentages", () => {
    const s = summarize([rd(5, 5, 30, 200), rd(30, 30, 30, 1)], NOW);
    expect(s.bandPercentages).toEqual({ poor: 33, moderate: 0, good: 67 });
    expect(s.medianDownloadMbps).toBe(30);
    expect(s.readingCount).toBe(2);
  });

  it("confidence uses raw counts, last reading is the newest", () => {
    const rows = Array.from({ length: 10 }, (_, i) => rd(30, 30, 30, 100 + i));
    const s = summarize(rows, NOW);
    expect(s.confidence).toBe("high");
    expect(s.daysSinceLast).toBe(100);
  });
});

describe("summarizeStay", () => {
  it("builds per-spot breakdown, ordered by count, skipping empty spots", () => {
    const s = summarizeStay(
      "s1",
      [rd(50, 20, 20, 1, "rooftop"), rd(5, 5, 20, 1, "room"), rd(6, 5, 20, 2, "room"), rd(7, 5, 20, 3, "room")],
      NOW,
    );
    expect(s.stayId).toBe("s1");
    expect(s.readingCount).toBe(4);
    expect(s.spots.map((x) => x.spot)).toEqual(["room", "rooftop"]);
    expect(s.spots[0]).toMatchObject({ readingCount: 3, confidence: "medium", band: "poor", medianDownloadMbps: 6 });
    expect(s.spots[1]).toMatchObject({ readingCount: 1, band: "good", excellent: true });
  });
  it("no readings gives empty spots", () => {
    expect(summarizeStay("x", [], NOW).spots).toEqual([]);
  });
});
