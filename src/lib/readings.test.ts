import { describe, expect, it } from "vitest";
import {
  clientIp,
  createRateLimiter,
  formatWait,
  getSalt,
  hashValue,
  parseReadingBody,
  readingDay,
} from "./readings";

const good = {
  deviceId: "11111111-2222-4333-8444-555555555555",
  spot: "room",
  downloadMbps: 30.123,
  uploadMbps: 12,
  latencyMs: 40.26,
  jitterMs: 3,
  packetLoss: 0,
  location: { lat: 1, lon: 2, accuracy: 3 },
};

describe("parseReadingBody", () => {
  it("accepts and rounds a good body", () => {
    const r = parseReadingBody(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.values.downloadMbps).toBe(30.12);
      expect(r.values.latencyMs).toBe(40.3);
    }
  });
  it("rejects non-objects", () => {
    expect(parseReadingBody(null).ok).toBe(false);
    expect(parseReadingBody("x").ok).toBe(false);
  });
  it("rejects bad device id and spot", () => {
    expect(parseReadingBody({ ...good, deviceId: "short" }).ok).toBe(false);
    expect(parseReadingBody({ ...good, deviceId: undefined }).ok).toBe(false);
    expect(parseReadingBody({ ...good, spot: "kitchen" }).ok).toBe(false);
  });
  it("rejects missing or non-finite numbers", () => {
    expect(parseReadingBody({ ...good, uploadMbps: undefined }).ok).toBe(false);
    expect(parseReadingBody({ ...good, latencyMs: NaN }).ok).toBe(false);
    expect(parseReadingBody({ ...good, jitterMs: "3" }).ok).toBe(false);
  });
  it.each([
    ["downloadMbps", 0],
    ["downloadMbps", 10001],
    ["uploadMbps", -1],
    ["uploadMbps", 10001],
    ["latencyMs", -1],
    ["latencyMs", 5001],
    ["jitterMs", 5001],
    ["packetLoss", 100.1],
    ["packetLoss", -0.1],
  ])("rejects %s=%s", (k, v) => {
    expect(parseReadingBody({ ...good, [k]: v }).ok).toBe(false);
  });
  it("accepts boundary values", () => {
    expect(
      parseReadingBody({ ...good, uploadMbps: 0, latencyMs: 0, packetLoss: 100, downloadMbps: 10000 }).ok,
    ).toBe(true);
  });
});

describe("hashing", () => {
  it("is deterministic, salted and kind-separated", () => {
    expect(hashValue("a", "ip", "1.2.3.4")).toBe(hashValue("a", "ip", "1.2.3.4"));
    expect(hashValue("a", "ip", "1.2.3.4")).not.toBe(hashValue("b", "ip", "1.2.3.4"));
    expect(hashValue("a", "ip", "x")).not.toBe(hashValue("a", "device", "x"));
    expect(hashValue("a", "ip", "1.2.3.4")).not.toContain("1.2.3.4");
  });
  it("salt: env wins, dev fallback, none in production", () => {
    expect(getSalt({ HASH_SALT: "s", NODE_ENV: "production" })).toBe("s");
    expect(getSalt({ NODE_ENV: "development" })).toBeTruthy();
    expect(getSalt({ NODE_ENV: "production" })).toBeNull();
  });
});

describe("clientIp", () => {
  it("uses first forwarded entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("readingDay", () => {
  it("uses IST calendar day", () => {
    expect(readingDay(new Date("2026-10-15T18:29:00Z"))).toBe("2026-10-15");
    expect(readingDay(new Date("2026-10-15T18:30:00Z"))).toBe("2026-10-16");
  });
});

describe("rate limiter", () => {
  it("blocks after max and recovers after window", () => {
    const rl = createRateLimiter({ max: 2, windowMs: 1000 });
    expect(rl.check("k", 0).allowed).toBe(true);
    expect(rl.check("k", 100).allowed).toBe(true);
    const blocked = rl.check("k", 200);
    expect(blocked).toEqual({ allowed: false, retryAfterSec: 1 });
    expect(rl.check("other", 200).allowed).toBe(true);
    expect(rl.check("k", 1001).allowed).toBe(true);
  });
  it("formats wait", () => {
    expect(formatWait(30)).toBe("30 seconds");
    expect(formatWait(600)).toBe("10 minutes");
  });
});
