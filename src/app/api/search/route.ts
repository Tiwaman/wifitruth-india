import { NextResponse } from "next/server";
import { buildPhotonUrl, normalizePhoton, TtlCache, type Place } from "@/lib/photon";
import { buildNominatimUrl, normalizeNominatim } from "@/lib/nominatim";

const cache = new TtlCache<Place[]>(10 * 60 * 1000, 200);
const UA = "wifitruth-india/0.1";

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

// Photon first (built for search-as-you-type); Nominatim as fallback when Photon is down or unreachable.
async function lookup(q: string): Promise<Place[]> {
  try {
    return normalizePhoton(await fetchJson(buildPhotonUrl(q), 3000));
  } catch {
    return normalizeNominatim(await fetchJson(buildNominatimUrl(q), 6000));
  }
}

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ places: [], placesError: false });

  const key = q.toLowerCase();
  let places = cache.get(key);
  let placesError = false;
  if (!places) {
    try {
      places = await lookup(q);
      cache.set(key, places);
    } catch {
      places = [];
      placesError = true;
    }
  }

  return NextResponse.json({ places, placesError });
}
