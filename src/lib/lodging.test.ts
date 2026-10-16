import { describe, expect, it } from "vitest";
import { kindForOsm, LODGING_KINDS } from "./lodging";

describe("kindForOsm", () => {
  it.each([
    ["hotel", "hotel"],
    ["motel", "hotel"],
    ["hostel", "hostel"],
    ["guest_house", "guesthouse"],
    ["apartment", "homestay"],
    ["chalet", "homestay"],
    ["resort", "resort"],
    ["camp_site", "other"],
    ["alpine_hut", "other"],
    ["wilderness_hut", "other"],
  ])("maps %s to %s", (value, kind) => {
    expect(kindForOsm("tourism", value)).toBe(kind);
  });
  it("accepts leisure=resort and a missing key", () => {
    expect(kindForOsm("leisure", "resort")).toBe("resort");
    expect(kindForOsm(undefined, "hostel")).toBe("hostel");
  });
  it.each(["city", "cafe", "restaurant", "museum", "attraction", "station", "toString", "constructor", ""])("rejects %s", (value) => {
    expect(kindForOsm("tourism", value)).toBeNull();
  });
  it("rejects lodging words under the wrong key and non-strings", () => {
    expect(kindForOsm("amenity", "hotel")).toBeNull();
    expect(kindForOsm("tourism", 5)).toBeNull();
    expect(kindForOsm("tourism", null)).toBeNull();
  });
  it("manual lodging kinds exclude other", () => {
    expect(LODGING_KINDS).not.toContain("other");
  });
});
