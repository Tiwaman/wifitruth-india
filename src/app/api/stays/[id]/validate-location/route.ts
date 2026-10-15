import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { validateLocationServer } from "@/lib/geo";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const stay = await getStore().getStay(id);
  if (!stay) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const result = validateLocationServer(stay, body);
  return NextResponse.json(result, { status: result.status === "invalid" ? 400 : 200 });
}
