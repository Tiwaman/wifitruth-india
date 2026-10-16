import type { StayKind } from "./types";

// OSM tags (tourism=* or leisure=resort) that count as a place to sleep, mapped to our stay kind.
// camp_site and the huts have no better match in the stay_kind enum, so they map to "other".
const LODGING_KIND: Record<string, StayKind> = {
  hotel: "hotel",
  motel: "hotel",
  hostel: "hostel",
  guest_house: "guesthouse",
  apartment: "homestay",
  chalet: "homestay",
  resort: "resort",
  camp_site: "other",
  alpine_hut: "other",
  wilderness_hut: "other",
};

const LODGING_KEYS = new Set(["tourism", "leisure"]);

/** Stay kind for an OSM key/value pair, or null when it is not lodging. A missing key is tolerated. */
export function kindForOsm(key: unknown, value: unknown): StayKind | null {
  if (typeof value !== "string" || !Object.hasOwn(LODGING_KIND, value)) return null;
  if (typeof key === "string" && key && !LODGING_KEYS.has(key)) return null;
  return LODGING_KIND[value];
}

/** Kinds a user may pick when adding a stay by hand (no "other place"). */
export const LODGING_KINDS = ["hotel", "hostel", "guesthouse", "homestay", "resort"] as const satisfies readonly StayKind[];

export const KIND_LABEL: Record<StayKind, string> = {
  hotel: "Hotel",
  hostel: "Hostel",
  guesthouse: "Guesthouse",
  homestay: "Homestay",
  resort: "Resort",
  other: "Camp or hut",
};
