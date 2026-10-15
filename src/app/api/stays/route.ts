import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { validateNewStay } from "@/lib/stay-validation";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ stays: [] });
  return NextResponse.json({ stays: await getStore().listStays({ q, limit: 8 }) });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const v = validateNewStay(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const store = getStore();
  if (v.value.osmType && v.value.osmId) {
    const existing = await store.findStayByOsm(v.value.osmType, v.value.osmId);
    if (existing) return NextResponse.json({ stay: existing, created: false });
  }
  const stay = await store.createStay(v.value);
  return NextResponse.json({ stay, created: true }, { status: 201 });
}
