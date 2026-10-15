import { describe, expect, it } from "vitest";
import { bpsToMbps, progressFromPartial } from "./progress";

describe("progressFromPartial", () => {
  it("starts at latency", () => {
    expect(progressFromPartial({})).toEqual({ phase: "latency", percent: 0 });
  });
  it("moves through phases", () => {
    expect(progressFromPartial({ latencyMs: 10, jitterMs: 1 })).toEqual({ phase: "download", percent: 25 });
    expect(progressFromPartial({ latencyMs: 10, jitterMs: 1, downloadMbps: 5 })).toEqual({ phase: "upload", percent: 50 });
    expect(progressFromPartial({ latencyMs: 10, jitterMs: 1, downloadMbps: 5, uploadMbps: 2 }).phase).toBe("packetLoss");
  });
  it("is done when everything is present", () => {
    expect(progressFromPartial({ latencyMs: 1, jitterMs: 1, downloadMbps: 1, uploadMbps: 1, packetLoss: 0 })).toEqual({ phase: "done", percent: 100 });
  });
});

describe("bpsToMbps", () => {
  it("converts and rounds", () => {
    expect(bpsToMbps(12_345_678)).toBe(12.35);
  });
  it("rejects bad input", () => {
    expect(bpsToMbps(undefined)).toBeUndefined();
    expect(bpsToMbps(NaN)).toBeUndefined();
    expect(bpsToMbps(-1)).toBeUndefined();
  });
});
