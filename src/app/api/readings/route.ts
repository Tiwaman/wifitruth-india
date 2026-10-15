import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { createDefaultLimiters, getDefaultSalt, submitReading } from "@/lib/submit-reading";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __wifiLimiters?: ReturnType<typeof createDefaultLimiters> };

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid", error: "Invalid request." }, { status: 400 });
  }
  const stayId = typeof (body as { stayId?: unknown } | null)?.stayId === "string" ? (body as { stayId: string }).stayId : "";
  if (!stayId) return NextResponse.json({ ok: false, code: "invalid", error: "Missing stay." }, { status: 400 });
  g.__wifiLimiters ??= createDefaultLimiters();
  try {
    const res = await submitReading(stayId, body, req.headers, { store: getStore(), salt: getDefaultSalt(), ...g.__wifiLimiters });
    return NextResponse.json(res.body, { status: res.status, headers: res.headers });
  } catch {
    return NextResponse.json(
      { ok: false, code: "server_error", error: "Something went wrong on our side. Please try again in a moment." },
      { status: 500 },
    );
  }
}
