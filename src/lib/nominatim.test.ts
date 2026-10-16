import { describe, expect, it } from "vitest";
import { buildNominatimUrl, normalizeNominatim } from "./nominatim";

describe("nominatim", () => {
  it("builds an India-restricted URL", () => {
    const url = buildNominatimUrl("kasol");
    expect(url).toContain("countrycodes=in");
    expect(url).toContain("bounded=1");
    expect(url).toContain("q=kasol");
  });

  it("normalises results and drops non-India or unnamed items", () => {
    const places = normalizeNominatim([
      { lat: "32.01", lon: "77.31", name: "Zostel Kasol", osm_type: "node", osm_id: 42, type: "hostel", address: { village: "Kasol", state: "Himachal Pradesh", country_code: "in" } },
      { lat: "27.7", lon: "85.3", name: "Kathmandu Guesthouse", osm_type: "node", osm_id: 7, address: { country_code: "np" } },
      { lat: "19.07", lon: "72.87", name: "", osm_type: "way", osm_id: 9, address: { country_code: "in" } },
    ]);
    expect(places).toEqual([
      { name: "Zostel Kasol", city: "Kasol", state: "Himachal Pradesh", lat: 32.01, lon: 77.31, osmType: "N", osmId: 42, kind: "hostel" },
    ]);
  });

  it("keeps only lodging and maps the type to a stay kind", () => {
    const item = (name: string, category: string, type: string) => ({
      lat: "15.5", lon: "73.8", name, osm_type: "way", osm_id: 1, category, type, address: { country_code: "in", state: "Goa" },
    });
    const places = normalizeNominatim([
      item("Beach Hut", "tourism", "chalet"),
      item("Camp", "tourism", "camp_site"),
      item("Goa", "boundary", "administrative"),
      item("Cafe Mondegar", "amenity", "cafe"),
      item("Old Fort", "tourism", "attraction"),
      item("Bad key", "amenity", "hotel"),
    ]);
    expect(places.map((p) => [p.name, p.kind])).toEqual([
      ["Beach Hut", "homestay"],
      ["Camp", "other"],
    ]);
  });

  it("returns an empty list for unexpected payloads", () => {
    expect(normalizeNominatim({ error: "x" })).toEqual([]);
    expect(normalizeNominatim(null)).toEqual([]);
  });
});
