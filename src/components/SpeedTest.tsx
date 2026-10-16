"use client";

import { useEffect, useRef, useState } from "react";
import { SpeedGauge } from "@/components/SpeedGauge";
import { SpotPicker } from "@/components/SpotPicker";
import { Button, Notice } from "@/components/ui";
import { resolveEngine } from "@/lib/speedtest/cloudflare";
import type { SpeedProgress, SpeedResult } from "@/lib/speedtest/types";
import type { Spot } from "@/lib/types";

const PHASE_LABEL = {
  latency: "Measuring latency",
  download: "Measuring download speed",
  upload: "Measuring upload speed",
  packetLoss: "Checking packet loss",
  done: "Finishing up",
} as const;

export function Metric({ label, value, unit }: { label: string; value: number | undefined; unit: string }) {
  return (
    <div className="rounded-2xl bg-ocean-50 p-3">
      <dt className="text-xs font-bold uppercase tracking-wider text-ocean-800">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-ink" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value === undefined ? "-" : value}
        <span className="ml-1 text-sm font-medium text-ink-soft">{unit}</span>
      </dd>
    </div>
  );
}

export function SpeedTest({
  enabled,
  spot,
  onSpotChange,
  onComplete,
  onReset,
}: {
  enabled: boolean;
  spot: Spot;
  onSpotChange: (s: Spot) => void;
  onComplete: (r: SpeedResult) => void;
  onReset?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<SpeedProgress | null>(null);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function start() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    setError(null);
    setResult(null);
    setProgress({ phase: "latency", percent: 0, partial: {} });
    onReset?.();
    try {
      const r = await resolveEngine().run((p) => !ctrl.signal.aborted && setProgress(p), ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResult(r);
      onComplete(r);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(
        "The speed test could not finish. Check that you are connected to the stay's WiFi (not mobile data) and try again.",
      );
    } finally {
      if (!ctrl.signal.aborted) setRunning(false);
    }
  }

  const shown = result ?? progress?.partial ?? {};
  const caption = running && progress ? `${PHASE_LABEL[progress.phase]}...` : result ? "Download speed" : "Ready when you are";
  return (
    <div className="space-y-5">
      {!enabled && (
        <Notice tone="info" data-testid="speedtest-locked">
          Confirm your location first. The speed test unlocks once you are at the stay.
        </Notice>
      )}
      <SpotPicker value={spot} onChange={onSpotChange} disabled={!enabled || running} />
      <div className="rounded-3xl bg-gradient-to-b from-ocean-50 to-sand-50 px-3 py-5 ring-1 ring-ocean-100">
        <SpeedGauge value={shown.downloadMbps} running={running} percent={progress?.percent ?? 0} caption={caption} />
        <div aria-live="polite" className="mt-3 text-center text-sm text-ink-soft">
          {running && progress ? `${PHASE_LABEL[progress.phase]}... keep this tab open.` : null}
        </div>
      </div>
      <Button onClick={start} disabled={!enabled || running} size="lg" className="w-full sm:w-auto">
        {running ? "Testing..." : result ? "Run again" : "Start speed test"}
      </Button>
      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {(running || result) && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5" data-testid="speed-metrics">
          <Metric label="Download" value={shown.downloadMbps} unit="Mbps" />
          <Metric label="Upload" value={shown.uploadMbps} unit="Mbps" />
          <Metric label="Latency" value={shown.latencyMs === undefined ? undefined : Math.round(shown.latencyMs)} unit="ms" />
          <Metric label="Jitter" value={shown.jitterMs === undefined ? undefined : Math.round(shown.jitterMs * 10) / 10} unit="ms" />
          <Metric label="Packet loss" value={shown.packetLoss} unit="%" />
        </dl>
      )}
    </div>
  );
}
