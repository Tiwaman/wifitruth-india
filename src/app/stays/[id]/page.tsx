import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, MapIcon, PinIcon, PlaneIcon } from "@/components/icons";
import { BandBadge } from "@/components/BandBar";
import { KindIcon } from "@/components/SpotIcon";
import { SceneryBanner } from "@/components/Scenery";
import { getStore } from "@/lib/data";
import { isUuid } from "@/lib/http";
import { getRecentReadings, getStaySummary } from "@/lib/stay-summary";
import { BAND_LABEL, formatMbps } from "@/lib/format";
import { RecentTrail } from "@/components/RecentTrail";
import { buttonClass, Chip, Container } from "@/components/ui";
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
    <div className="pb-28 sm:pb-0">
      <header className="on-dark relative z-10 overflow-hidden bg-[linear-gradient(135deg,#04242c_0%,#0a4f5c_60%,#1b7d86_100%)] text-white">
        <div className="bg-waves absolute inset-0 -z-10" aria-hidden="true" />
        <SceneryBanner className="pointer-events-none absolute bottom-0 right-0 -z-10 h-full w-full opacity-40 sm:opacity-100" />
        <Container className="space-y-5 pb-12 pt-6 sm:pb-16 sm:pt-8">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/20">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to all stays
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-ink">
              <KindIcon kind={stay.kind} className="h-4 w-4" />
              {KIND_LABEL[stay.kind]}
            </span>
            <BandBadge band={summary.readingCount > 0 ? summary.band : null} excellent={summary.excellent} />
          </div>
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-5xl">{stay.name}</h1>
            <p className="flex items-center gap-1.5 text-lg text-ocean-100">
              <PinIcon className="h-5 w-5 shrink-0 text-amber-300" />
              {stay.city}, {stay.state}
            </p>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-300/70 bg-sand-50/95 p-3 shadow-lift backdrop-blur sm:static sm:inset-auto sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
            <Link href={`/log?stay=${stay.id}`} data-testid="log-here" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
              <PlaneIcon className="h-5 w-5" />
              Log speed here
            </Link>
          </div>
        </Container>
      </header>
      <Container className="bg-topo grid gap-6 py-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <StaySummaryCard summary={summary} />
          <RecentTrail readings={recent} />
        </div>
        <aside aria-label="Location" className="space-y-3 rounded-3xl border border-sand-300/70 bg-sand-50 p-4 shadow-card lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <MapIcon className="h-5 w-5 text-ocean-700" />
            Where it is
          </h2>
          <StayMap lat={stay.lat} lon={stay.lon} name={stay.name} />
          <p className="text-sm text-ink-soft">
            <Chip>{KIND_LABEL[stay.kind]}</Chip> {stay.city}, {stay.state}
          </p>
        </aside>
      </Container>
    </div>
  );
}
