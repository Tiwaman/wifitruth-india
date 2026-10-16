import { BandBadge } from "@/components/BandBar";
import { formatMbps, formatTimeAgo } from "@/lib/format";
import { SPOT_LABELS } from "@/lib/spots";
import type { PublicReading } from "@/lib/stay-summary";

export function RecentTrail({ readings }: { readings: PublicReading[] }) {
  return (
    <section aria-labelledby="trail-h" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" data-testid="trail">
      <h2 id="trail-h" className="text-lg font-semibold">
        Latest tests
      </h2>
      {readings.length === 0 ? (
        <p className="text-sm text-slate-700" data-testid="trail-empty">
          No tests logged yet.
        </p>
      ) : (
        <ol className="divide-y divide-slate-200">
          {readings.map((r, i) => (
            <li key={`${r.createdAt}-${i}`} data-testid="trail-entry" className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">
                  {SPOT_LABELS[r.spot]} <span className="text-sm font-normal text-slate-700">· {formatTimeAgo(r.createdAt)}</span>
                </p>
                <p className="text-sm text-slate-700">
                  <span className="tabular-nums">{formatMbps(r.downloadMbps)}</span> Mbps down ·{" "}
                  <span className="tabular-nums">{formatMbps(r.uploadMbps)}</span> Mbps up ·{" "}
                  <span className="tabular-nums">{formatMbps(r.latencyMs)}</span> ms
                </p>
              </div>
              <BandBadge band={r.band} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
