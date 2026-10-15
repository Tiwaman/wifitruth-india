import type { Page } from "@playwright/test";

export const KASOL = "00000000-0000-4000-8000-000000000001";

export async function mockSpeedEngine(
  page: Page,
  result = { downloadMbps: 42.5, uploadMbps: 18.2, latencyMs: 35, jitterMs: 4.1, packetLoss: 0.5 },
) {
  await page.addInitScript((r) => {
    window.__wifiSpeedTestEngine = {
      async run(onProgress) {
        onProgress({ phase: "download", percent: 25, partial: { latencyMs: r.latencyMs, jitterMs: r.jitterMs } });
        await new Promise((res) => setTimeout(res, 150));
        onProgress({ phase: "upload", percent: 50, partial: { latencyMs: r.latencyMs, jitterMs: r.jitterMs, downloadMbps: r.downloadMbps } });
        await new Promise((res) => setTimeout(res, 150));
        return r;
      },
    };
  }, result);
}
