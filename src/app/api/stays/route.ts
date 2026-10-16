import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { readJson } from "@/lib/http";
import { clientIp, createRateLimiter, formatWait, getSalt, hashValue, type RateLimiter } from "@/lib/readings";
import { findNearDuplicate, validateNewStay } from "@/lib/stay-validation";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __wifiStayLimiter?: RateLimiter };
const limiter = () =>
  (g.__wifiStayLimiter ??= createRateLimiter({ max: Number(process.env.RATE_LIMIT_STAY_MAX) || 10, windowMs: 10 * 60 * 1000 }));

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ stays: [] });
  try {
    return NextResponse.json({ stays: await getStore().listStays({ q, limit: 8 }) });
  } catch {
    return NextResponse.json({ error: "Search is unavailable right now." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const salt = getSalt();
  if (!salt) return NextResponse.json({ error: "Adding stays is temporarily unavailable." }, { status: 503 });
  const check = limiter().check(hashValue(salt, "ip", clientIp(req.headers)));
  if (!check.allowed)
    return NextResponse.json(
      { error: `You are adding stays too quickly. Please wait about ${formatWait(check.retryAfterSec)}.` },
      { status: 429, headers: { "Retry-After": String(check.retryAfterSec) } },
    );

  const parsed = await readJson(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.status === 413 ? "Request too large." : "Invalid JSON." }, { status: parsed.status });
  const v = validateNewStay(parsed.body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  try {
    const store = getStore();
    if (v.value.osmType && v.value.osmId) {
      const existing = await store.findStayByOsm(v.value.osmType, v.value.osmId);
      if (existing) return NextResponse.json({ stay: existing, created: false });
    }
    const near = findNearDuplicate(await store.listStays({ limit: 5000 }), v.value);
    if (near)
      return NextResponse.json(
        { error: `"${near.name}" is already listed nearby. Use that stay instead of adding it again.`, code: "duplicate", existing: near },
        { status: 409 },
      );
    const stay = await store.createStay(v.value);
    return NextResponse.json({ stay, created: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the stay. Please try again." }, { status: 500 });
  }
}
