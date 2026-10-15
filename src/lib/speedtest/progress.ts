import type { SpeedPhase, SpeedResult } from "./types";

const ORDER: SpeedPhase[] = ["latency", "download", "upload", "packetLoss"];

export function progressFromPartial(partial: Partial<SpeedResult>): { phase: SpeedPhase; percent: number } {
  const have = [
    partial.latencyMs !== undefined && partial.jitterMs !== undefined,
    partial.downloadMbps !== undefined,
    partial.uploadMbps !== undefined,
    partial.packetLoss !== undefined,
  ];
  const doneCount = have.filter(Boolean).length;
  if (doneCount === ORDER.length) return { phase: "done", percent: 100 };
  const next = have.findIndex((h) => !h);
  return { phase: ORDER[next], percent: Math.round((doneCount / ORDER.length) * 100) };
}

export function bpsToMbps(bps: number | undefined | null): number | undefined {
  if (typeof bps !== "number" || !Number.isFinite(bps) || bps < 0) return undefined;
  return Math.round((bps / 1e6) * 100) / 100;
}
