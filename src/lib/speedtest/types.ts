export interface SpeedResult {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLoss: number;
}

export type SpeedPhase = "latency" | "download" | "upload" | "packetLoss" | "done";

export interface SpeedProgress {
  phase: SpeedPhase;
  percent: number;
  partial: Partial<SpeedResult>;
}

export interface SpeedTestEngine {
  run(onProgress: (p: SpeedProgress) => void, signal: AbortSignal): Promise<SpeedResult>;
}

declare global {
  interface Window {
    __wifiSpeedTestEngine?: SpeedTestEngine;
  }
}
