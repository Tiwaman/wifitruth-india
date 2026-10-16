import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { isUuid } from "@/lib/http";
import { getRecentReadings } from "@/lib/stay-summary";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 10);
  const store = getStore();
  try {
    if (!(await store.getStay(id))) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
    return NextResponse.json({ readings: await getRecentReadings(store, id, limit) });
  } catch {
    return NextResponse.json({ error: "Could not load readings. Please try again." }, { status: 500 });
  }
}
