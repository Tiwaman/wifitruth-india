import { BAND_LABEL } from "@/lib/format";
import { BANDS, type Band } from "@/lib/scoring";

const FILL: Record<Band, string> = { poor: "bg-red-600", moderate: "bg-yellow-400", good: "bg-green-600" };

export function BandBar({
  percentages,
  count,
  compact = false,
}: {
  percentages: Record<Band, number>;
  count: number;
  compact?: boolean;
}) {
  if (count === 0) return null;
  const label = BANDS.map((b) => `${percentages[b]}% ${BAND_LABEL[b]}`).join(", ");
  return (
    <div>
      <div
        role="img"
        aria-label={`Share of readings: ${label}`}
        data-testid="band-bar"
        className={`flex w-full overflow-hidden rounded-full bg-slate-200 ${compact ? "h-2" : "h-4"}`}
      >
        {BANDS.map((b) =>
          percentages[b] > 0 ? (
            <div key={b} data-band={b} className={FILL[b]} style={{ width: `${percentages[b]}%` }} />
          ) : null,
        )}
      </div>
      {!compact && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-800" data-testid="band-legend">
          {BANDS.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span aria-hidden className={`inline-block h-3 w-3 rounded-full ${FILL[b]}`} />
              <span data-band={b}>
                {BAND_LABEL[b]} <strong className="tabular-nums">{percentages[b]}%</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const BADGE: Record<Band, string> = {
  poor: "bg-red-100 text-red-900 ring-red-300",
  moderate: "bg-yellow-100 text-yellow-900 ring-yellow-400",
  good: "bg-green-100 text-green-900 ring-green-300",
};

export function BandBadge({ band, excellent }: { band: Band | null; excellent?: boolean }) {
  if (!band)
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-700 ring-1 ring-slate-300">
        Not rated yet
      </span>
    );
  return (
    <span
      data-testid="band-badge"
      data-band={band}
      className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ${BADGE[band]}`}
    >
      {excellent ? "Excellent" : BAND_LABEL[band]}
    </span>
  );
}
