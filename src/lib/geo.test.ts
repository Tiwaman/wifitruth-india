import { describe, expect, it } from "vitest";
import { evaluateLocation, haversineMeters, validateLocationServer } from "./geo";

const kasol = { lat: 32.0098, lon: 77.3149 };

describe("haversineMeters", () => {
  it("is zero for the same point", () => {
    expect(haversineMeters(kasol, kasol)).toBe(0);
  });
  it("matches known distance Delhi-Mumbai (~1150 km)", () => {
    const d = haversineMeters({ lat: 28.6139, lon: 77.209 }, { lat: 19.076, lon: 72.8777 });
    expect(d / 1000).toBeGreaterThan(1140);
    expect(d / 1000).toBeLessThan(1160);
  });
  it("one degree latitude is ~111 km", () => {
    const d = haversineMeters({ lat: 10, lon: 77 }, { lat: 11, lon: 77 });
    expect(Math.round(d / 1000)).toBe(111);
  });
});

describe("evaluateLocation", () => {
  it("ok when accurate and near", () => {
    const r = evaluateLocation(kasol, { ...kasol, lat: kasol.lat + 0.0005, accuracy: 20 });
    expect(r.status).toBe("ok");
  });
  it("low accuracy above 100 m, boundary 100 ok", () => {
    expect(evaluateLocation(kasol, { ...kasol, accuracy: 101 }).status).toBe("low_accuracy");
    expect(evaluateLocation(kasol, { ...kasol, accuracy: 100 }).status).toBe("ok");
  });
  it("too far above 150 m", () => {
    const r = evaluateLocation(kasol, { lat: kasol.lat + 0.002, lon: kasol.lon, accuracy: 10 });
    expect(r.status).toBe("too_far");
    expect(r.distanceM).toBeGreaterThan(150);
  });
  it("low accuracy takes precedence over distance", () => {
    const r = evaluateLocation(kasol, { lat: kasol.lat + 1, lon: kasol.lon, accuracy: 500 });
    expect(r.status).toBe("low_accuracy");
  });
  it("invalid for NaN or out-of-range input", () => {
    expect(evaluateLocation(kasol, { lat: NaN, lon: 1, accuracy: 5 }).status).toBe("invalid");
    expect(evaluateLocation(kasol, { lat: 91, lon: 1, accuracy: 5 }).status).toBe("invalid");
    expect(evaluateLocation(kasol, { ...kasol, accuracy: -1 }).status).toBe("invalid");
  });
});

describe("validateLocationServer", () => {
  it("rejects garbage bodies", () => {
    expect(validateLocationServer(kasol, null).status).toBe("invalid");
    expect(validateLocationServer(kasol, { lat: "1", lon: "2", accuracy: "3" }).status).toBe("invalid");
  });
  it("accepts a valid body", () => {
    expect(validateLocationServer(kasol, { ...kasol, accuracy: 15 }).status).toBe("ok");
  });
});
