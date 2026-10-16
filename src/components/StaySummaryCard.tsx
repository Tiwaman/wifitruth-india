import { BandBadge, BandBar } from "@/components/BandBar";
import { CONFIDENCE_LABEL, formatAgo, formatMbps } from "@/lib/format";
import { SPOT_LABELS } from "@/lib/spots";
import type { StaySummary } from "@/lib/scoring";

function Stat({ label, value, unit, testId }: { label: string; value: string; unit: string; testId: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums" data-testid={testId}>
        {value}
        <span className="ml-1 text-sm font-normal text-slate-600">{unit}</span>
      </dd>
    </div>
  );
}

export function StaySummaryCard({ summary }: { summary: StaySummary }) {
  if (summary.readingCount === 0) {
    return (
      <section
        className="rounded-xl border border-dashed border-slate-400 bg-white p-6 text-center"
        data-testid="empty-summary"
        aria-labelledby="summary-h"
      >
        <h2 id="summary-h" className="text-lg font-semibold">
          No readings yet
        </h2>
        <p className="mt-1 text-slate-700">
          Be the first to test the WiFi here. Use the Log speed here button to verify your location and run a speed test.
        </p>
      </section>
    );
  }
  return (
    <section
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      aria-labelledby="summary-h"
      data-testid="summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="summary-h" className="text-lg font-semibold">
          WiFi quality
        </h2>
        <BandBadge band={summary.band} excellent={summary.excellent} />
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Download" value={formatMbps(summary.medianDownloadMbps)} unit="Mbps" testId="stat-download" />
        <Stat label="Upload" value={formatMbps(summary.medianUploadMbps)} unit="Mbps" testId="stat-upload" />
        <Stat label="Latency" value={formatMbps(summary.medianLatencyMs)} unit="ms" testId="stat-latency" />
      </dl>
      <BandBar percentages={summary.bandPercentages} count={summary.readingCount} />
      <p className="text-sm text-slate-700" data-testid="summary-meta">
        <span data-testid="sample-count">
          {summary.readingCount} {summary.readingCount === 1 ? "reading" : "readings"}
        </span>
        {" · "}last tested {formatAgo(summary.daysSinceLast)}
        {" · "}confidence <strong data-testid="confidence">{CONFIDENCE_LABEL[summary.confidence]}</strong>
      </p>
      <p className="text-xs text-slate-600">
        Medians of crowd-submitted tests. Readings from the last 90 days count fully, older ones count half.
      </p>

      {summary.spots.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">By spot</h3>
          <ul className="divide-y divide-slate-200" data-testid="spot-breakdown">
            {summary.spots.map((s) => (
              <li key={s.spot} className="space-y-1.5 py-3" data-spot={s.spot}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{SPOT_LABELS[s.spot]}</span>
                  <BandBadge band={s.band} excellent={s.excellent} />
                </div>
                <p className="text-sm text-slate-700">
                  <span className="tabular-nums">{formatMbps(s.medianDownloadMbps)}</span> Mbps down ·{" "}
                  <span className="tabular-nums">{formatMbps(s.medianUploadMbps)}</span> Mbps up ·{" "}
                  <span className="tabular-nums">{formatMbps(s.medianLatencyMs)}</span> ms · {s.readingCount}{" "}
                  {s.readingCount === 1 ? "reading" : "readings"} · {CONFIDENCE_LABEL[s.confidence]} confidence
                </p>
                <BandBar percentages={s.bandPercentages} count={s.readingCount} compact />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
