import { NextResponse } from "next/server";
import { buildPhotonUrl, normalizePhoton, TtlCache, type Place } from "@/lib/photon";

const cache = new TtlCache<Place[]>(10 * 60 * 1000, 200);

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ places: [], placesError: false });

  const key = q.toLowerCase();
  let places = cache.get(key);
  let placesError = false;
  if (!places) {
    try {
      const res = await fetch(buildPhotonUrl(q), {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "wifitruth-india/0.1" },
      });
      if (!res.ok) throw new Error(`Photon ${res.status}`);
      places = normalizePhoton(await res.json());
      cache.set(key, places);
    } catch {
      places = [];
      placesError = true;
    }
  }

  return NextResponse.json({ places, placesError });
}
