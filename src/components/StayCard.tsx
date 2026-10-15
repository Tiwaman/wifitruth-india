import Link from "next/link";
import { BandBadge, BandBar } from "@/components/BandBar";
import { CONFIDENCE_LABEL, formatAgo, formatMbps } from "@/lib/format";
import type { StayWithSummary } from "@/lib/stay-summary";

export function StayCard({ item }: { item: StayWithSummary }) {
  const { stay, summary } = item;
  return (
    <li>
      <Link
        href={`/stays/${stay.id}`}
        className="block space-y-2 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{stay.name}</p>
            <p className="text-sm text-slate-700">
              {stay.city}, {stay.state}
            </p>
          </div>
          <BandBadge band={summary.band} excellent={summary.excellent} />
        </div>
        <BandBar percentages={summary.bandPercentages} count={summary.readingCount} compact />
        <p className="text-sm text-slate-700">
          <span className="tabular-nums">{formatMbps(summary.medianDownloadMbps)}</span> Mbps down ·{" "}
          {summary.readingCount} {summary.readingCount === 1 ? "reading" : "readings"} ·{" "}
          {formatAgo(summary.daysSinceLast)} · {CONFIDENCE_LABEL[summary.confidence]} confidence
        </p>
      </Link>
    </li>
  );
}
