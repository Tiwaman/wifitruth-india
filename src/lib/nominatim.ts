import { INDIA_BBOX, inIndiaBbox } from "./india";
import type { Place } from "./photon";

export function buildNominatimUrl(q: string, limit = 8): string {
  const { minLon, minLat, maxLon, maxLat } = INDIA_BBOX;
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(limit),
    countrycodes: "in",
    "accept-language": "en",
    viewbox: `${minLon},${maxLat},${maxLon},${minLat}`,
    bounded: "1",
  });
  return `https://nominatim.openstreetmap.org/search?${params}`;
}

interface NominatimItem {
  lat?: string;
  lon?: string;
  name?: string;
  osm_type?: string;
  osm_id?: number;
  type?: string;
  address?: Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const OSM_TYPES: Record<string, string> = { node: "N", way: "W", relation: "R" };

export function normalizeNominatim(json: unknown): Place[] {
  if (!Array.isArray(json)) return [];
  const out: Place[] = [];
  for (const item of json as NominatimItem[]) {
    const a = item.address ?? {};
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    const name = str(item.name);
    if (!name || !inIndiaBbox(lat, lon)) continue;
    if (a.country_code && str(a.country_code).toLowerCase() !== "in") continue;
    out.push({
      name,
      city: str(a.city) || str(a.town) || str(a.village) || str(a.suburb) || str(a.county) || str(a.state_district),
      state: str(a.state),
      lat,
      lon,
      osmType: OSM_TYPES[str(item.osm_type)] ?? null,
      osmId: typeof item.osm_id === "number" ? item.osm_id : null,
      kind: str(item.type) || null,
    });
  }
  return out;
}
