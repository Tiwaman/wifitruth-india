import type { Metadata } from "next";
import { DashboardFilters } from "@/components/DashboardFilters";
import { EmptyState } from "@/components/EmptyState";
import { Hero } from "@/components/Hero";
import { HowItWorks, TrustStrip } from "@/components/HomeSections";
import { StayCard } from "@/components/StayCard";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";
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
    <>
      <Hero q={q} />
      <TrustStrip />
      <section id="stays" aria-labelledby="stays-h" className="bg-topo py-12 sm:py-14">
        <Container className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <Eyebrow>The leaderboard</Eyebrow>
              <h2 id="stays-h" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Tracked stays
              </h2>
            </div>
            {list && (
              <p className="text-sm font-medium text-ink-soft" aria-live="polite">
                {list.items.length} {list.items.length === 1 ? "stay" : "stays"}
              </p>
            )}
          </div>
          <DashboardFilters q={q} state={state} sort={sort} states={list?.states ?? []} />
          {!list ? (
            <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-300" data-testid="stays-error">
              Could not load stays right now. Please refresh in a moment.
            </p>
          ) : list.items.length === 0 ? (
            <EmptyState
              testId="stays-empty"
              title="No stays match"
              text="Try a different search, or log a speed to add a stay."
              cta={{ href: "/log", label: "Log a speed" }}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="stay-list">
              {list.items.map((i) => (
                <StayCard key={i.stay.id} item={i} />
              ))}
            </ul>
          )}
        </Container>
      </section>
      <HowItWorks />
      <section aria-labelledby="cta-h" className="pb-4">
        <Container>
          <div className="on-dark relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 px-6 py-10 text-white sm:px-10">
            <div className="bg-waves absolute inset-0" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="max-w-lg">
                <h2 id="cta-h" className="font-display text-2xl font-bold sm:text-3xl">
                  Staying somewhere right now?
                </h2>
                <p className="mt-1 text-ocean-100">Thirty seconds of your time saves the next traveller a lot of buffering.</p>
              </div>
              <ButtonLink href="/log" size="lg" className="shrink-0">
                Test this WiFi
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
