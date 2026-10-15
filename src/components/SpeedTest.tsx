"use client";

import { useEffect, useRef, useState } from "react";
import { resolveEngine } from "@/lib/speedtest/cloudflare";
import type { SpeedProgress, SpeedResult } from "@/lib/speedtest/types";
import { SPOTS, type Spot } from "@/lib/types";
import { SPOT_LABELS } from "@/lib/spots";

const PHASE_LABEL = {
  latency: "Measuring latency",
  download: "Measuring download speed",
  upload: "Measuring upload speed",
  packetLoss: "Checking packet loss",
  done: "Finishing up",
} as const;

export function Metric({ label, value, unit }: { label: string; value: number | undefined; unit: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value === undefined ? "-" : value}
        <span className="ml-1 text-sm font-normal text-slate-600">{unit}</span>
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
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="speedtest-heading">
      <h2 id="speedtest-heading" className="text-lg font-semibold">
        2. Run the speed test
      </h2>
      {!enabled && (
        <p className="text-sm text-slate-700" data-testid="speedtest-locked">
          Confirm your location first. The speed test unlocks once you are at the stay.
        </p>
      )}
      <div>
        <label htmlFor="spot" className="block text-sm font-medium">
          Where are you testing?
        </label>
        <select
          id="spot"
          value={spot}
          onChange={(e) => onSpotChange(e.target.value as Spot)}
          disabled={!enabled || running}
          className="mt-1 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 disabled:bg-slate-100"
        >
          {SPOTS.map((s) => (
            <option key={s} value={s}>
              {SPOT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={start}
        disabled={!enabled || running}
        className="w-full rounded-lg bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {running ? "Testing..." : result ? "Run again" : "Start speed test"}
      </button>
      {running && progress && (
        <div aria-live="polite">
          <p className="text-sm text-slate-700">{PHASE_LABEL[progress.phase]}... keep this tab open.</p>
          <div
            role="progressbar"
            aria-label="Speed test progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
          >
            <div className="h-full bg-blue-700 transition-all" style={{ width: `${Math.max(progress.percent, 4)}%` }} />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded border-l-4 border-red-600 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
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
    </section>
  );
}
