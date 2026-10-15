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
