import { INDIA_BBOX, inIndiaBbox } from "./india";
import { kindForOsm } from "./lodging";
import type { StayKind } from "./types";

export interface Place {
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  osmType: string | null;
  osmId: number | null;
  kind: StayKind;
}

export function buildPhotonUrl(q: string, limit = 8): string {
  const { minLon, minLat, maxLon, maxLat } = INDIA_BBOX;
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: "en",
    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
  });
  const base = process.env.PHOTON_BASE_URL || "https://photon.komoot.io";
  return `${base}/api/?${params}`;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function normalizePhoton(json: unknown): Place[] {
  const features = ((json as { features?: PhotonFeature[] })?.features ?? []) as PhotonFeature[];
  const out: Place[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const [lon, lat] = f.geometry?.coordinates ?? [NaN, NaN];
    const name = str(p.name);
    const kind = kindForOsm(p.osm_key, p.osm_value);
    if (!name || !kind || !inIndiaBbox(lat, lon)) continue;
    if (p.countrycode && str(p.countrycode).toUpperCase() !== "IN") continue;
    out.push({
      name,
      city: str(p.city) || str(p.district) || str(p.county) || str(p.locality),
      state: str(p.state),
      lat,
      lon,
      osmType: str(p.osm_type) || null,
      osmId: typeof p.osm_id === "number" ? p.osm_id : null,
      kind,
    });
  }
  return out;
}

export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();
  constructor(
    private ttlMs: number,
    private maxEntries: number,
    private now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expires <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: V): void {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: this.now() + this.ttlMs });
  }
}
