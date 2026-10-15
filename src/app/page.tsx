import type { Metadata } from "next";
import { StaySearch } from "@/components/StaySearch";
import { StayCard } from "@/components/StayCard";
import { getStore } from "@/lib/data";
import { getHomeLists, type StayWithSummary } from "@/lib/stay-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "WiFiTruth India - real WiFi speeds at stays" },
  alternates: { canonical: "/" },
};

function Section({ title, hint, items, testId }: { title: string; hint: string; items: StayWithSummary[]; testId: string }) {
  return (
    <section aria-labelledby={`${testId}-h`} className="space-y-3">
      <div>
        <h2 id={`${testId}-h`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-slate-700">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-400 bg-white p-4 text-sm text-slate-700" data-testid={`${testId}-empty`}>
          Nothing here yet. Search for a stay above and run the first test.
        </p>
      ) : (
        <ul className="space-y-3" data-testid={testId}>
          {items.map((i) => (
            <StayCard key={i.stay.id} item={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function Home() {
  let lists: Awaited<ReturnType<typeof getHomeLists>> | null = null;
  try {
    lists = await getHomeLists(getStore());
  } catch {
    lists = null;
  }
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Is the WiFi really that good?</h1>
        <p className="text-slate-700">Real speeds at stays across India, measured on the spot by travellers.</p>
      </header>
      <StaySearch />
      {lists ? (
        <>
          <Section title="Top stays" hint="Best measured WiFi, with at least 3 readings." items={lists.top} testId="top-stays" />
          <Section title="Recently tested" hint="Latest readings from travellers." items={lists.recent} testId="recent-stays" />
        </>
      ) : (
        <p role="alert" className="rounded border-l-4 border-red-600 bg-red-50 p-3 text-sm text-red-900">
          We could not load stay rankings right now. Search still works; please try again later.
        </p>
      )}
    </div>
  );
}
