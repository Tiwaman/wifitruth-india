import { describe, expect, it } from "vitest";
import type { Stay } from "./types";
import { findNearDuplicate, validateNewStay } from "./stay-validation";

const good = { name: " Test Stay ", city: "Kasol", state: "Himachal Pradesh", kind: "hostel", lat: 32.01, lon: 77.31, confirmLodging: true };

describe("validateNewStay", () => {
  it("accepts and trims a valid stay", () => {
    const r = validateNewStay(good);
    expect(r.ok && r.value.name).toBe("Test Stay");
  });
  it("rejects bad input", () => {
    expect(validateNewStay(null).ok).toBe(false);
    expect(validateNewStay({ ...good, name: "A" }).ok).toBe(false);
    expect(validateNewStay({ ...good, city: "" }).ok).toBe(false);
    expect(validateNewStay({ ...good, kind: "castle" }).ok).toBe(false);
    expect(validateNewStay({ ...good, lat: 51.5, lon: -0.1 }).ok).toBe(false);
    expect(validateNewStay({ ...good, lat: "32" }).ok).toBe(false);
  });
});

describe("validateNewStay hardening", () => {
  it("strips control characters and collapses whitespace", () => {
    const r = validateNewStay({ ...good, name: "A\u0000B\n\n  C‮D" });
    expect(r.ok && r.value.name).toBe("A B C D");
  });
  it("keeps html as inert text (escaped on render)", () => {
    const r = validateNewStay({ ...good, name: "<img src=x onerror=alert(1)>" });
    expect(r.ok && r.value.name).toBe("<img src=x onerror=alert(1)>");
  });
  it("caps lengths", () => {
    const r = validateNewStay({ ...good, name: "x".repeat(500), city: "y".repeat(500) });
    expect(r.ok && r.value.name.length).toBe(120);
    expect(r.ok && r.value.city.length).toBe(80);
  });
  it("only accepts N/W/R osm types with a positive integer id", () => {
    const ok = validateNewStay({ ...good, osmType: "N", osmId: 42 });
    expect(ok.ok && [ok.value.osmType, ok.value.osmId]).toEqual(["N", 42]);
    for (const extra of [{ osmType: "X", osmId: 42 }, { osmType: "N", osmId: -1 }, { osmType: "N", osmId: 1.5 }, { osmType: "N" }, { osmId: 42 }]) {
      const r = validateNewStay({ ...good, ...extra });
      expect(r.ok && [r.value.osmType, r.value.osmId]).toEqual([null, null]);
    }
  });
  it("rejects NaN-ish and out-of-range coordinates and non-object bodies", () => {
    expect(validateNewStay({ ...good, lat: Infinity }).ok).toBe(false);
    expect(validateNewStay({ ...good, lon: null }).ok).toBe(false);
    expect(validateNewStay("string").ok).toBe(false);
    expect(validateNewStay([]).ok).toBe(false);
  });
});

describe("validateNewStay lodging rules", () => {
  const ok = { ...good, confirmLodging: true };
  it("accepts every lodging type", () => {
    for (const kind of ["hotel", "hostel", "guesthouse", "homestay", "resort"]) expect(validateNewStay({ ...ok, kind }).ok).toBe(true);
  });
  it("requires a lodging type: missing, unknown and 'other' are rejected", () => {
    expect(validateNewStay({ ...ok, kind: undefined }).ok).toBe(false);
    expect(validateNewStay({ ...ok, kind: "other" }).ok).toBe(false);
    expect(validateNewStay({ ...ok, kind: "cafe" }).ok).toBe(false);
  });
  it("allows 'other' only together with an OSM reference (camp sites, huts)", () => {
    expect(validateNewStay({ ...ok, kind: "other", osmType: "N", osmId: 9 }).ok).toBe(true);
    expect(validateNewStay({ ...ok, kind: "other", osmId: 9 }).ok).toBe(false);
  });
  it("requires the explicit place-to-sleep confirmation", () => {
    for (const confirmLodging of [undefined, false, "true", 1]) {
      const r = validateNewStay({ ...good, confirmLodging });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toMatch(/place to sleep/);
    }
  });
  it("still enforces the India check and required fields", () => {
    const r = validateNewStay({ ...ok, lat: 51.5, lon: -0.1 });
    expect(!r.ok && r.error).toBe("Location must be inside India.");
    expect(validateNewStay({ ...ok, lat: undefined }).ok).toBe(false);
    expect(validateNewStay({ ...ok, name: "" }).ok).toBe(false);
  });
});

describe("findNearDuplicate", () => {
  const mk = (name: string, lat: number, lon: number): Stay => ({
    id: name, name, kind: "hostel", city: "Kasol", state: "HP", lat, lon, osmType: null, osmId: null, createdAt: "",
  });
  const existing = [mk("Zostel Kasol", 32.01, 77.31)];
  it("matches the same name nearby, ignoring case, punctuation and generic words", () => {
    expect(findNearDuplicate(existing, { name: "zostel  KASOL!", lat: 32.0105, lon: 77.31 })?.id).toBe("Zostel Kasol");
    expect(findNearDuplicate(existing, { name: "Zostel Kasol Hostel", lat: 32.01, lon: 77.31 })?.id).toBe("Zostel Kasol");
  });
  it("does not match a different name, or the same name far away", () => {
    expect(findNearDuplicate(existing, { name: "Moustache Kasol", lat: 32.01, lon: 77.31 })).toBeNull();
    expect(findNearDuplicate(existing, { name: "Zostel Kasol", lat: 32.02, lon: 77.31 })).toBeNull();
  });
  it("does not treat names made only of generic words as a wildcard", () => {
    expect(findNearDuplicate([mk("Hotel Sunrise", 32.01, 77.31)], { name: "Hotel", lat: 32.01, lon: 77.31 })).toBeNull();
  });
});
