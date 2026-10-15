import { bpsToMbps, progressFromPartial } from "./progress";
import type { SpeedProgress, SpeedResult, SpeedTestEngine } from "./types";

type Results = {
  getDownloadBandwidth(): number | undefined;
  getUploadBandwidth(): number | undefined;
  getUnloadedLatency(): number | undefined;
  getUnloadedJitter(): number | undefined;
  getPacketLoss(): number | undefined;
};

const num = (v: number | undefined | null) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function readPartial(r: Results): Partial<SpeedResult> {
  const safe = <T,>(fn: () => T): T | undefined => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  };
  const loss = num(safe(() => r.getPacketLoss()));
  return {
    downloadMbps: bpsToMbps(safe(() => r.getDownloadBandwidth())),
    uploadMbps: bpsToMbps(safe(() => r.getUploadBandwidth())),
    latencyMs: num(safe(() => r.getUnloadedLatency())),
    jitterMs: num(safe(() => r.getUnloadedJitter())),
    packetLoss: loss === undefined ? undefined : Math.round(loss * 10000) / 100,
  };
}

export function createCloudflareEngine(): SpeedTestEngine {
  return {
    async run(onProgress, signal) {
      const { default: SpeedTest } = await import("@cloudflare/speedtest");
      return new Promise<SpeedResult>((resolve, reject) => {
        if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
        let lastError: string | null = null;
        const test = new SpeedTest({
          autoStart: true,
          logAimApiUrl: null,
          measurements: [
            { type: "latency", numPackets: 1 },
            { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
            { type: "latency", numPackets: 20 },
            { type: "download", bytes: 1e5, count: 9 },
            { type: "download", bytes: 1e6, count: 8 },
            { type: "upload", bytes: 1e5, count: 8 },
            { type: "packetLoss", numPackets: 100, batchSize: 10, batchWaitTime: 10, responsesWaitTime: 3000 },
            { type: "upload", bytes: 1e6, count: 6 },
            { type: "download", bytes: 1e7, count: 6 },
            { type: "upload", bytes: 1e7, count: 4 },
            { type: "download", bytes: 2.5e7, count: 4 },
            { type: "upload", bytes: 2.5e7, count: 3 },
          ],
        });
        const emit = () => {
          const partial = readPartial(test.results as unknown as Results);
          const { phase, percent } = progressFromPartial(partial);
          onProgress({ phase, percent, partial } satisfies SpeedProgress);
        };
        signal.addEventListener("abort", () => {
          test.pause();
          reject(new DOMException("Aborted", "AbortError"));
        });
        test.onResultsChange = emit;
        test.onError = (e: string) => {
          lastError = String(e);
        };
        test.onFinish = (results) => {
          const p = readPartial(results as unknown as Results);
          if (p.downloadMbps === undefined || p.uploadMbps === undefined || p.latencyMs === undefined) {
            return reject(new Error(lastError ?? "The speed test could not measure your connection."));
          }
          resolve({
            downloadMbps: p.downloadMbps,
            uploadMbps: p.uploadMbps,
            latencyMs: Math.round(p.latencyMs * 10) / 10,
            jitterMs: Math.round((p.jitterMs ?? 0) * 10) / 10,
            packetLoss: p.packetLoss ?? 0,
          });
        };
      });
    },
  };
}

export function resolveEngine(): SpeedTestEngine {
  if (typeof window !== "undefined" && window.__wifiSpeedTestEngine) return window.__wifiSpeedTestEngine;
  return createCloudflareEngine();
}
