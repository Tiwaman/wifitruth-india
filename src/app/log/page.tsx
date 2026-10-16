import type { Metadata } from "next";
import { LogFlow } from "@/components/LogFlow";
import { SceneryBanner } from "@/components/Scenery";
import { Container } from "@/components/ui";
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
    <div>
      <header className="on-dark relative isolate overflow-hidden bg-[linear-gradient(135deg,#04242c_0%,#0a4f5c_60%,#1b7d86_100%)] text-white">
        <div className="bg-waves absolute inset-0 -z-10" aria-hidden="true" />
        <SceneryBanner className="pointer-events-none absolute bottom-0 right-0 -z-10 h-full w-full opacity-40 sm:opacity-100" />
        <Container className="space-y-2 pb-16 pt-8 sm:pb-20 sm:pt-12">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Log internet speed</h1>
          <p className="max-w-xl text-base text-ocean-100 sm:text-lg">
            Four quick steps to help the next traveller. Pick your stay, confirm you are there, run the test and share it.
          </p>
        </Container>
      </header>
      <div className="bg-topo pb-6">
        <Container className="relative -mt-8 sm:-mt-10">
          <div className="mx-auto max-w-3xl">
            <LogFlow stay={stay} notice={notice} />
          </div>
        </Container>
      </div>
    </div>
  );
}
