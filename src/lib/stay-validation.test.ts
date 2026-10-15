import { describe, expect, it } from "vitest";
import { validateNewStay } from "./stay-validation";

const good = { name: " Test Stay ", city: "Kasol", state: "Himachal Pradesh", kind: "hostel", lat: 32.01, lon: 77.31 };

describe("validateNewStay", () => {
  it("accepts and trims a valid stay", () => {
    const r = validateNewStay(good);
    expect(r.ok && r.value.name).toBe("Test Stay");
  });
  it("defaults kind to other", () => {
    const r = validateNewStay({ ...good, kind: undefined });
    expect(r.ok && r.value.kind).toBe("other");
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
