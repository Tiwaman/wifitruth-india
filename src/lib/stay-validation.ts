import { inIndiaBbox } from "./india";
import { NewStay, STAY_KINDS, StayKind } from "./types";

export type StayValidation = { ok: true; value: NewStay } | { ok: false; error: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateNewStay(body: unknown): StayValidation {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = text(b.name, 120);
  const city = text(b.city, 80);
  const state = text(b.state, 80);
  const kind = (b.kind ?? "other") as StayKind;
  const lat = typeof b.lat === "number" ? b.lat : NaN;
  const lon = typeof b.lon === "number" ? b.lon : NaN;
  if (name.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  if (!city) return { ok: false, error: "City is required." };
  if (!state) return { ok: false, error: "State is required." };
  if (!STAY_KINDS.includes(kind)) return { ok: false, error: "Unknown stay type." };
  if (!inIndiaBbox(lat, lon)) return { ok: false, error: "Location must be inside India." };
  const osmType = typeof b.osmType === "string" ? text(b.osmType, 1) : null;
  const osmId = typeof b.osmId === "number" && Number.isInteger(b.osmId) ? b.osmId : null;
  return { ok: true, value: { name, kind, city, state, lat, lon, osmType: osmId ? osmType : null, osmId } };
}
