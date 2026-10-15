export const INDIA_BBOX = { minLon: 68.1, minLat: 6.7, maxLon: 97.4, maxLat: 35.7 } as const;

export function inIndiaBbox(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= INDIA_BBOX.minLat &&
    lat <= INDIA_BBOX.maxLat &&
    lon >= INDIA_BBOX.minLon &&
    lon <= INDIA_BBOX.maxLon
  );
}
