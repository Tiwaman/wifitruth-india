import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { isUuid } from "@/lib/http";
import { getStaySummary } from "@/lib/stay-summary";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  const store = getStore();
  try {
    const stay = await store.getStay(id);
    if (!stay) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
    return NextResponse.json({ stay, summary: await getStaySummary(store, id) });
  } catch {
    return NextResponse.json({ error: "Could not load the summary. Please try again." }, { status: 500 });
  }
}
