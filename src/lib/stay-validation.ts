import { inIndiaBbox } from "./india";
import { haversineMeters } from "./geo";
import { LODGING_KINDS } from "./lodging";
import type { NewStay, Stay, StayKind } from "./types";

export type StayValidation = { ok: true; value: NewStay } | { ok: false; error: string };

// Strips control and bidi/zero-width characters and collapses whitespace. HTML is not stripped here:
// React escapes text on render and the map tooltip is built with textContent.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;
const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(INVISIBLE, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

export function validateNewStay(body: unknown): StayValidation {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const name = text(b.name, 120);
  const city = text(b.city, 80);
  const state = text(b.state, 80);
  const kind = b.kind as StayKind;
  const lat = typeof b.lat === "number" ? b.lat : NaN;
  const lon = typeof b.lon === "number" ? b.lon : NaN;
  if (name.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  if (!city) return { ok: false, error: "City is required." };
  if (!state) return { ok: false, error: "State is required." };
  if (b.confirmLodging !== true) return { ok: false, error: "Please confirm this is a place to sleep." };
  const osmId = typeof b.osmId === "number" && Number.isSafeInteger(b.osmId) && b.osmId > 0 ? b.osmId : null;
  const osmType = osmId && typeof b.osmType === "string" && /^[NWR]$/.test(b.osmType) ? b.osmType : null;
  // "other" exists only for OSM camp sites and huts, which arrive with an OSM reference; manual adds must pick a lodging type.
  if (!(LODGING_KINDS as readonly string[]).includes(kind) && !(osmType !== null && kind === "other"))
    return { ok: false, error: "Choose what kind of stay this is (hotel, hostel, guesthouse, homestay or resort)." };
  if (!inIndiaBbox(lat, lon)) return { ok: false, error: "Location must be inside India." };
  return { ok: true, value: { name, kind, city, state, lat, lon, osmType, osmId: osmType ? osmId : null } };
}

const GENERIC_WORDS = new Set(["the", "hotel", "hostel", "guest", "house", "guesthouse", "homestay", "resort", "inn", "lodge", "stay", "and", "by"]);
const normalizeName = (n: string) =>
  n
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !GENERIC_WORDS.has(w))
    .join(" ");

export const DUPLICATE_RADIUS_M = 200;

/** An existing stay within 200 m whose name matches once generic words (hotel, hostel...) are ignored. */
export function findNearDuplicate(existing: Stay[], candidate: Pick<NewStay, "name" | "lat" | "lon">): Stay | null {
  const wanted = normalizeName(candidate.name) || candidate.name.toLowerCase().trim();
  for (const s of existing) {
    if (haversineMeters(s, candidate) > DUPLICATE_RADIUS_M) continue;
    const have = normalizeName(s.name) || s.name.toLowerCase().trim();
    if (have === wanted || (wanted.length >= 4 && have.length >= 4 && (have.includes(wanted) || wanted.includes(have)))) return s;
  }
  return null;
}
