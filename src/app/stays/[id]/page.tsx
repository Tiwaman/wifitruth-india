import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { isUuid } from "@/lib/http";
import { getRecentReadings, getStaySummary } from "@/lib/stay-summary";
import { BAND_LABEL, formatMbps } from "@/lib/format";
import { RecentTrail } from "@/components/RecentTrail";
import { ButtonLink } from "@/components/ui";
import { KIND_LABEL } from "@/lib/lodging";
import { StaySummaryCard } from "@/components/StaySummaryCard";
import { StayMap } from "@/components/StayMap";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Stay not found" };
  const store = getStore();
  const stay = await store.getStay(id).catch(() => null);
  if (!stay) return { title: "Stay not found" };
  const summary = await getStaySummary(store, id).catch(() => null);
  const where = `${stay.city}, ${stay.state}`;
  const description =
    summary && summary.readingCount > 0 && summary.band
      ? `WiFi at ${stay.name}, ${where}: ${BAND_LABEL[summary.band]}, about ${formatMbps(summary.medianDownloadMbps)} Mbps download from ${summary.readingCount} traveller readings.`
      : `Be the first to test the WiFi at ${stay.name}, ${where}.`;
  return {
    title: `${stay.name} WiFi speed, ${stay.city}`,
    description,
    alternates: { canonical: `/stays/${id}` },
    openGraph: { title: `${stay.name} WiFi speed`, description, type: "website" },
  };
}

export default async function StayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const store = getStore();
  const stay = await store.getStay(id);
  if (!stay) notFound();
  const [summary, recent] = await Promise.all([getStaySummary(store, id), getRecentReadings(store, id, 10)]);
  return (
    <div className="space-y-5">
      <Link href="/" className="inline-block text-sm text-blue-800 underline">
        Back to all stays
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{stay.name}</h1>
        <p className="text-slate-700">
          {KIND_LABEL[stay.kind]} · {stay.city}, {stay.state}
        </p>
      </header>
      <ButtonLink href={`/log?stay=${stay.id}`} data-testid="log-here">
        Log speed here
      </ButtonLink>
      <StaySummaryCard summary={summary} />
      <RecentTrail readings={recent} />
      <StayMap lat={stay.lat} lon={stay.lon} name={stay.name} />
    </div>
  );
}
