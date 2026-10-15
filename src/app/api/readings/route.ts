import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { isUuid, readJson } from "@/lib/http";
import { createDefaultLimiters, getDefaultSalt, submitReading } from "@/lib/submit-reading";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __wifiLimiters?: ReturnType<typeof createDefaultLimiters> };

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if (!parsed.ok)
    return NextResponse.json(
      { ok: false, code: "invalid", error: parsed.status === 413 ? "Request too large." : "Invalid request." },
      { status: parsed.status },
    );
  const body = parsed.body;
  const stayId = (body as { stayId?: unknown } | null)?.stayId;
  if (!isUuid(stayId)) return NextResponse.json({ ok: false, code: "invalid", error: "Missing stay." }, { status: 400 });
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
