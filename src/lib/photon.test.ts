import { describe, expect, it } from "vitest";
import { buildPhotonUrl, normalizePhoton, TtlCache } from "./photon";

describe("buildPhotonUrl", () => {
  it("includes India bbox and query", () => {
    const u = new URL(buildPhotonUrl("kasol hostel"));
    expect(u.searchParams.get("q")).toBe("kasol hostel");
    expect(u.searchParams.get("bbox")).toBe("68.1,6.7,97.4,35.7");
  });
});

describe("normalizePhoton", () => {
  it("maps features and drops non-India / nameless entries", () => {
    const json = {
      features: [
        {
          geometry: { coordinates: [77.31, 32.01] },
          properties: { name: "Zostel", city: "Kasol", state: "Himachal Pradesh", countrycode: "IN", osm_type: "N", osm_id: 5, osm_value: "hostel" },
        },
        { geometry: { coordinates: [-0.1, 51.5] }, properties: { name: "London Hostel", countrycode: "GB" } },
        { geometry: { coordinates: [77.3, 32] }, properties: { countrycode: "IN" } },
        { geometry: { coordinates: [77.3, 32] }, properties: { name: "Wrong country", countrycode: "NP" } },
      ],
    };
    const r = normalizePhoton(json);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: "Zostel", city: "Kasol", osmId: 5, kind: "hostel" });
  });
  it("keeps only lodging and maps the OSM value to a stay kind", () => {
    const f = (osm_key: string, osm_value: string, name = "X") => ({
      geometry: { coordinates: [77.31, 32.01] },
      properties: { name, countrycode: "IN", osm_key, osm_value },
    });
    const r = normalizePhoton({
      features: [
        f("tourism", "guest_house", "G"),
        f("leisure", "resort", "R"),
        f("tourism", "hotel", "H"),
        f("place", "city", "Kasol"),
        f("amenity", "cafe", "Cafe"),
        f("tourism", "attraction", "Fort"),
        f("shop", "supermarket", "Mart"),
      ],
    });
    expect(r.map((p) => [p.name, p.kind])).toEqual([
      ["G", "guesthouse"],
      ["R", "resort"],
      ["H", "hotel"],
    ]);
  });
  it("drops places with no osm value", () => {
    expect(normalizePhoton({ features: [{ geometry: { coordinates: [77.3, 32] }, properties: { name: "Mystery", countrycode: "IN" } }] })).toEqual([]);
  });
  it("tolerates junk", () => {
    expect(normalizePhoton(null)).toEqual([]);
    expect(normalizePhoton({})).toEqual([]);
  });
});

describe("TtlCache", () => {
  it("expires entries and evicts oldest at capacity", () => {
    let t = 0;
    const c = new TtlCache<number>(100, 2, () => t);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    t = 101;
    expect(c.get("b")).toBeUndefined();
  });
});
