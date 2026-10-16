import Link from "next/link";
import { BandBadge, BandBar } from "@/components/BandBar";
import { ClockIcon, PlaneIcon } from "@/components/icons";
import { KindIcon } from "@/components/SpotIcon";
import { Chip } from "@/components/ui";
import { CONFIDENCE_LABEL, formatAgo, formatMbps } from "@/lib/format";
import { KIND_LABEL } from "@/lib/lodging";
import type { StayWithSummary } from "@/lib/stay-summary";

export function StayCard({ item }: { item: StayWithSummary }) {
  const { stay, summary } = item;
  const tested = summary.readingCount > 0;
  return (
    <li data-testid="stay-card" className="h-full">
      <Link
        href={`/stays/${stay.id}`}
        className="group flex h-full flex-col gap-4 rounded-3xl border border-sand-300/70 bg-sand-50 p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-ocean-300 hover:shadow-lift"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ocean-50 text-ocean-700 ring-1 ring-ocean-100 transition group-hover:bg-ocean-700 group-hover:text-white">
            <KindIcon kind={stay.kind} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{stay.name}</p>
            <p className="text-sm text-ink-soft">
              {KIND_LABEL[stay.kind]} · {stay.city}, {stay.state}
            </p>
          </div>
        </div>
        {tested ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="leading-none">
                <span className="font-display text-4xl font-bold tabular-nums text-ocean-900" data-testid="card-median">
                  {formatMbps(summary.medianDownloadMbps)}
                </span>
                <span className="ml-1.5 text-sm font-semibold text-ink-soft">Mbps</span>
                <span className="mt-1 block text-xs font-medium text-ink-soft">median download</span>
              </p>
              <BandBadge band={summary.band} excellent={summary.excellent} />
            </div>
            <BandBar percentages={summary.bandPercentages} count={summary.readingCount} compact />
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-sand-300/70 pt-3 text-xs text-ink-soft">
              <span data-testid="card-count" className="font-semibold text-ink">
                {summary.readingCount} {summary.readingCount === 1 ? "test" : "tests"}
              </span>
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                last tested {formatAgo(summary.daysSinceLast)}
              </span>
              <Chip>{CONFIDENCE_LABEL[summary.confidence]} confidence</Chip>
            </div>
          </>
        ) : (
          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-dashed border-ocean-300 bg-ocean-50/60 p-3">
            <PlaneIcon className="h-5 w-5 shrink-0 text-ocean-700" />
            <p className="text-sm text-ink-soft" data-testid="card-untested">
              Not tested yet. Be the first to log a speed.
            </p>
          </div>
        )}
      </Link>
    </li>
  );
}
