import type { Metadata } from "next";
import { DashboardFilters } from "@/components/DashboardFilters";
import { Hero } from "@/components/Hero";
import { StayCard } from "@/components/StayCard";
import { getStore } from "@/lib/data";
import { listStaysWithSummaries, parseSort, type StayList } from "@/lib/stay-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "WiFiTruth India - real WiFi speeds at stays" },
  alternates: { canonical: "/" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 100);
  const state = one(sp.state).slice(0, 80);
  const sort = parseSort(one(sp.sort));
  let list: StayList | null = null;
  try {
    list = await listStaysWithSummaries(getStore(), { q, state, sort });
  } catch {
    list = null;
  }
  return (
    <div className="space-y-6">
      <Hero />
      <section aria-labelledby="stays-h" className="space-y-4">
        <h2 id="stays-h" className="text-xl font-semibold">
          Tracked stays
        </h2>
        <DashboardFilters q={q} state={state} sort={sort} states={list?.states ?? []} />
        {!list ? (
          <p role="alert" className="text-sm text-red-700" data-testid="stays-error">
            Could not load stays right now. Please refresh in a moment.
          </p>
        ) : list.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-400 bg-white p-4 text-sm text-slate-700" data-testid="stays-empty">
            No stays match. Try a different search, or log a speed to add a stay.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="stay-list">
            {list.items.map((i) => (
              <StayCard key={i.stay.id} item={i} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
