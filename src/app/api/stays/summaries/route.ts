import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { listStaysWithSummaries, parseSort } from "@/lib/stay-summary";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const { items, states } = await listStaysWithSummaries(getStore(), {
      q: (p.get("q") ?? "").slice(0, 100),
      state: (p.get("state") ?? "").slice(0, 80),
      sort: parseSort(p.get("sort")),
    });
    return NextResponse.json({ stays: items, states });
  } catch {
    return NextResponse.json({ error: "Could not load stays. Please try again." }, { status: 500 });
  }
}
