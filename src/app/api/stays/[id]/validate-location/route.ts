import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { validateLocationServer } from "@/lib/geo";
import { isUuid, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  const parsed = await readJson(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.status === 413 ? "Request too large." : "Invalid JSON." }, { status: parsed.status });
  try {
    const stay = await getStore().getStay(id);
    if (!stay) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
    const result = validateLocationServer(stay, parsed.body);
    return NextResponse.json(result, { status: result.status === "invalid" ? 400 : 200 });
  } catch {
    return NextResponse.json({ error: "Could not check your location. Please try again." }, { status: 500 });
  }
}
