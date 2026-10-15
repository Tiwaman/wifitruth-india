import { createHash } from "node:crypto";
import { SPOTS, type Spot } from "./types";

export const LIMITS = {
  maxMbps: 10000,
  minDownloadMbps: 0.05,
  maxLatencyMs: 5000,
  maxJitterMs: 5000,
  maxPacketLossPct: 100,
} as const;

export interface ReadingValues {
  spot: Spot;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLoss: number;
}

export type ParseResult =
  | { ok: true; deviceId: string; values: ReadingValues; location: unknown }
  | { ok: false; error: string };

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function parseReadingBody(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;

  if (typeof b.deviceId !== "string" || !/^[A-Za-z0-9-]{16,64}$/.test(b.deviceId))
    return { ok: false, error: "We could not identify your device. Reload the page and try again." };
  if (typeof b.spot !== "string" || !(SPOTS as readonly string[]).includes(b.spot))
    return { ok: false, error: "Please choose where in the stay you tested." };

  const num = (k: string) => (typeof b[k] === "number" && Number.isFinite(b[k]) ? (b[k] as number) : null);
  const download = num("downloadMbps");
  const upload = num("uploadMbps");
  const latency = num("latencyMs");
  const jitter = num("jitterMs");
  const loss = num("packetLoss");
  if (download === null || upload === null || latency === null || jitter === null || loss === null)
    return { ok: false, error: "The speed test result is incomplete. Please run the test again." };

  const bad =
    download < LIMITS.minDownloadMbps ||
    download > LIMITS.maxMbps ||
    upload < 0 ||
    upload > LIMITS.maxMbps ||
    latency < 0 ||
    latency > LIMITS.maxLatencyMs ||
    jitter < 0 ||
    jitter > LIMITS.maxJitterMs ||
    loss < 0 ||
    loss > LIMITS.maxPacketLossPct;
  if (bad)
    return {
      ok: false,
      error: "That speed test result looks implausible, so we did not save it. Please run the test again.",
    };

  return {
    ok: true,
    deviceId: b.deviceId,
    location: b.location,
    values: {
      spot: b.spot as Spot,
      downloadMbps: round(download),
      uploadMbps: round(upload),
      latencyMs: round(latency, 1),
      jitterMs: round(jitter, 1),
      packetLoss: round(loss),
    },
  };
}

export function hashValue(salt: string, kind: "device" | "ip", value: string): string {
  return createHash("sha256").update(`${salt}:${kind}:${value}`).digest("hex");
}

export function getSalt(env: Record<string, string | undefined> = process.env): string | null {
  if (env.HASH_SALT) return env.HASH_SALT;
  if (env.NODE_ENV === "production") return null;
  return "dev-only-salt-not-secret";
}

export function clientIp(headers: Pick<Headers, "get">): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip")?.trim() || "unknown";
}

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
export function readingDay(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export interface RateLimiter {
  check(key: string, now?: number): { allowed: true } | { allowed: false; retryAfterSec: number };
}

export function createRateLimiter(opts: { max: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const fresh = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs);
      if (fresh.length >= opts.max) {
        hits.set(key, fresh);
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((fresh[0] + opts.windowMs - now) / 1000)) };
      }
      fresh.push(now);
      hits.set(key, fresh);
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.every((t) => now - t >= opts.windowMs)) hits.delete(k);
      }
      return { allowed: true };
    },
  };
}

export function formatWait(sec: number): string {
  return sec < 90 ? `${sec} seconds` : `${Math.ceil(sec / 60)} minutes`;
}
