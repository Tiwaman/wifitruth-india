export const MAX_ACCURACY_M = 100;
export const MAX_DISTANCE_M = 150;

export interface LatLon {
  lat: number;
  lon: number;
}

export function haversineMeters(a: LatLon, b: LatLon): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type LocationStatus = "ok" | "invalid" | "low_accuracy" | "too_far";

export interface LocationResult {
  status: LocationStatus;
  distanceM: number | null;
  accuracyM: number | null;
}

export interface Fix extends LatLon {
  accuracy: number;
}

export function evaluateLocation(stay: LatLon, fix: Fix): LocationResult {
  const values = [fix.lat, fix.lon, fix.accuracy, stay.lat, stay.lon];
  const valid =
    values.every(Number.isFinite) &&
    Math.abs(fix.lat) <= 90 &&
    Math.abs(fix.lon) <= 180 &&
    fix.accuracy >= 0;
  if (!valid) return { status: "invalid", distanceM: null, accuracyM: null };
  const distanceM = Math.round(haversineMeters(stay, fix));
  const accuracyM = Math.round(fix.accuracy);
  if (fix.accuracy > MAX_ACCURACY_M) return { status: "low_accuracy", distanceM, accuracyM };
  if (distanceM > MAX_DISTANCE_M) return { status: "too_far", distanceM, accuracyM };
  return { status: "ok", distanceM, accuracyM };
}

export function validateLocationServer(stay: LatLon, body: unknown): LocationResult {
  const b = (body ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : NaN);
  return evaluateLocation(stay, { lat: num(b.lat), lon: num(b.lon), accuracy: num(b.accuracy) });
}
