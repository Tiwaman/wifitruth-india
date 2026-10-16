import { BandBadge } from "@/components/BandBar";
import { SpotIcon } from "@/components/SpotIcon";
import { formatMbps, formatTimeAgo } from "@/lib/format";
import { SPOT_LABELS } from "@/lib/spots";
import type { PublicReading } from "@/lib/stay-summary";

/** "Latest tests" as a vertical timeline: newest first, one node per test. */
export function RecentTrail({ readings }: { readings: PublicReading[] }) {
  return (
    <section
      aria-labelledby="trail-h"
      className="space-y-4 rounded-3xl border border-sand-300/70 bg-sand-50 p-5 shadow-card sm:p-6"
      data-testid="trail"
    >
      <h2 id="trail-h" className="font-display text-2xl font-semibold">
        Latest tests
      </h2>
      {readings.length === 0 ? (
        <p className="rounded-2xl bg-ocean-50/70 p-4 text-sm text-ink-soft" data-testid="trail-empty">
          No tests logged yet.
        </p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-3 before:left-[1.2rem] before:top-3 before:w-0.5 before:rounded-full before:bg-ocean-100">
          {readings.map((r, i) => (
            <li key={`${r.createdAt}-${i}`} data-testid="trail-entry" className="relative flex gap-4">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-700 text-white ring-4 ring-sand-50">
                <SpotIcon spot={r.spot} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl bg-sand-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="font-semibold text-ink">
                    {SPOT_LABELS[r.spot]} <span className="text-sm font-normal text-ink-soft">· {formatTimeAgo(r.createdAt)}</span>
                  </p>
                  <BandBadge band={r.band} />
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  <strong className="font-display text-lg tabular-nums text-ink">{formatMbps(r.downloadMbps)}</strong> Mbps down ·{" "}
                  <strong className="tabular-nums text-ink">{formatMbps(r.uploadMbps)}</strong> Mbps up ·{" "}
                  <strong className="tabular-nums text-ink">{formatMbps(r.latencyMs)}</strong> ms
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
