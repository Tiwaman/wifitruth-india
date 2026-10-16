import { BAND_LABEL } from "@/lib/format";
import { BANDS, type Band } from "@/lib/scoring";

const FILL: Record<Band, string> = { poor: "bg-red-600", moderate: "bg-yellow-400", good: "bg-green-600" };
const DOT: Record<Band, string> = { poor: "bg-red-600", moderate: "bg-yellow-400", good: "bg-green-600" };
const SHORT: Record<Band, string> = { poor: "Poor", moderate: "Mod.", good: "Good" };

/**
 * Segmented red/yellow/green bar with rounded ends and gaps between segments.
 * Colour is never the only signal: every band is also printed as text with its percentage.
 */
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
        className={`flex w-full gap-1 ${compact ? "h-2.5" : "h-4"}`}
      >
        {BANDS.map((b) =>
          percentages[b] > 0 ? (
            <div
              key={b}
              data-band={b}
              className={`${FILL[b]} min-w-1.5 rounded-full transition-[width] duration-700`}
              style={{ width: `${percentages[b]}%` }}
            />
          ) : null,
        )}
      </div>
      {compact ? (
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft" aria-hidden="true">
          {BANDS.map((b) => (
            <span key={b} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${DOT[b]}`} />
              {SHORT[b]} <span className="font-semibold tabular-nums text-ink">{percentages[b]}%</span>
            </span>
          ))}
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink" data-testid="band-legend">
          {BANDS.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span aria-hidden className={`inline-block h-3 w-3 rounded-full ${DOT[b]}`} />
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
  poor: "bg-red-50 text-red-900 ring-red-300",
  moderate: "bg-yellow-50 text-yellow-900 ring-yellow-400",
  good: "bg-green-50 text-green-900 ring-green-300",
};

export function BandBadge({ band, excellent }: { band: Band | null; excellent?: boolean }) {
  if (!band)
    return (
      <span className="inline-flex items-center rounded-full bg-sand-200 px-2.5 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-sand-300">
        Not rated yet
      </span>
    );
  return (
    <span
      data-testid="band-badge"
      data-band={band}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${BADGE[band]}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[band]}`} />
      {excellent ? "Excellent" : BAND_LABEL[band]}
    </span>
  );
}
