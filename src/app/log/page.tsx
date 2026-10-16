import type { Metadata } from "next";
import { LogFlow } from "@/components/LogFlow";
import { getStore } from "@/lib/data";
import { isUuid } from "@/lib/http";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log internet speed",
  description: "Test the WiFi at your hotel, hostel or homestay and share the result anonymously.",
  alternates: { canonical: "/log" },
};

export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.stay) ? sp.stay[0] : sp.stay;
  let stay = null;
  let notice: string | undefined;
  if (raw) {
    stay = isUuid(raw) ? await getStore().getStay(raw).catch(() => null) : null;
    if (!stay) notice = "We could not find that stay. Search for it below.";
  }
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Log internet speed</h1>
        <p className="text-slate-700">Pick your stay, confirm you are there, then run a speed test. Only places to sleep can be added.</p>
      </header>
      <LogFlow stay={stay} notice={notice} />
    </div>
  );
}
