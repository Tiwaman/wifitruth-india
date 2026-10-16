import { BandBadge, BandBar } from "@/components/BandBar";
import { DownloadIcon, PulseIcon, UploadIcon } from "@/components/icons";
import { SpotIcon } from "@/components/SpotIcon";
import { Chip } from "@/components/ui";
import { CONFIDENCE_LABEL, formatAgo, formatMbps } from "@/lib/format";
import { SPOT_LABELS } from "@/lib/spots";
import type { StaySummary } from "@/lib/scoring";

function Stat({
  label,
  value,
  unit,
  testId,
  icon: Icon,
  big = false,
  className = "",
}: {
  label: string;
  value: string;
  unit: string;
  testId: string;
  icon: typeof DownloadIcon;
  big?: boolean;
  className?: string;
}) {
  return (
    <div className={`${className} rounded-2xl p-4 ${big ? "bg-gradient-to-br from-ocean-800 to-ocean-950 text-white" : "bg-ocean-50 text-ink"}`}>
      <dt className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${big ? "text-amber-300" : "text-ocean-800"}`}>
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd className="mt-2 leading-none" data-testid={testId}>
        <span className={`font-display font-bold tabular-nums ${big ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>{value}</span>
        <span className={`ml-1 text-sm font-semibold ${big ? "text-ocean-100" : "text-ink-soft"}`}>{unit}</span>
      </dd>
    </div>
  );
}

export function StaySummaryCard({ summary }: { summary: StaySummary }) {
  if (summary.readingCount === 0) {
    return (
      <section
        className="rounded-3xl border-2 border-dashed border-ocean-300 bg-ocean-50/60 p-8 text-center"
        data-testid="empty-summary"
        aria-labelledby="summary-h"
      >
        <h2 id="summary-h" className="font-display text-2xl font-semibold">
          No readings yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Be the first to test the WiFi here. Use the Log speed here button to verify your location and run a speed test.
        </p>
      </section>
    );
  }
  return (
    <section
      className="space-y-6 rounded-3xl border border-sand-300/70 bg-sand-50 p-5 shadow-card sm:p-6"
      aria-labelledby="summary-h"
      data-testid="summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="summary-h" className="font-display text-2xl font-semibold">
          WiFi quality
        </h2>
        <BandBadge band={summary.band} excellent={summary.excellent} />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat big className="col-span-2 sm:col-span-1" label="Download" value={formatMbps(summary.medianDownloadMbps)} unit="Mbps" testId="stat-download" icon={DownloadIcon} />
        <Stat label="Upload" value={formatMbps(summary.medianUploadMbps)} unit="Mbps" testId="stat-upload" icon={UploadIcon} />
        <Stat label="Latency" value={formatMbps(summary.medianLatencyMs)} unit="ms" testId="stat-latency" icon={PulseIcon} />
      </dl>
      <BandBar percentages={summary.bandPercentages} count={summary.readingCount} />
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-ink-soft" data-testid="summary-meta">
        <span data-testid="sample-count" className="font-semibold text-ink">
          {summary.readingCount} {summary.readingCount === 1 ? "reading" : "readings"}
        </span>
        <span aria-hidden>·</span>
        <span>last tested {formatAgo(summary.daysSinceLast)}</span>
        <span aria-hidden>·</span>
        <Chip>
          confidence <strong data-testid="confidence">{CONFIDENCE_LABEL[summary.confidence]}</strong>
        </Chip>
      </p>
      <p className="text-xs text-ink-soft">Medians of crowd-submitted tests. Readings from the last 90 days count fully, older ones count half.</p>

      {summary.spots.length > 0 && (
        <div>
          <h3 className="mb-1 font-display text-lg font-semibold">By spot</h3>
          <ul className="divide-y divide-sand-300/70" data-testid="spot-breakdown">
            {summary.spots.map((s) => (
              <li key={s.spot} className="space-y-2.5 py-4" data-spot={s.spot}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700 ring-1 ring-ocean-100">
                      <SpotIcon spot={s.spot} />
                    </span>
                    {SPOT_LABELS[s.spot]}
                  </span>
                  <BandBadge band={s.band} excellent={s.excellent} />
                </div>
                <p className="text-sm text-ink-soft">
                  <strong className="tabular-nums text-ink">{formatMbps(s.medianDownloadMbps)}</strong> Mbps down ·{" "}
                  <strong className="tabular-nums text-ink">{formatMbps(s.medianUploadMbps)}</strong> Mbps up ·{" "}
                  <strong className="tabular-nums text-ink">{formatMbps(s.medianLatencyMs)}</strong> ms · {s.readingCount}{" "}
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
