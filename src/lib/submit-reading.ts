import type { DataStore } from "./data/store";
import { MAX_ACCURACY_M, MAX_DISTANCE_M, validateLocationServer } from "./geo";
import {
  clientIp,
  createRateLimiter,
  formatWait,
  getSalt,
  hashValue,
  parseReadingBody,
  readingDay,
  type RateLimiter,
} from "./readings";

export interface SubmitDeps {
  store: DataStore;
  salt: string | null;
  ipLimiter: RateLimiter;
  deviceLimiter: RateLimiter;
  now?: Date;
}

export interface SubmitResponse {
  status: number;
  body: { ok: true } | { ok: false; code: string; error: string };
  headers?: Record<string, string>;
}

const fail = (status: number, code: string, error: string, headers?: Record<string, string>): SubmitResponse => ({
  status,
  body: { ok: false, code, error },
  headers,
});

export function createDefaultLimiters() {
  const windowMs = 10 * 60 * 1000;
  return {
    ipLimiter: createRateLimiter({ max: 20, windowMs }),
    deviceLimiter: createRateLimiter({ max: 8, windowMs }),
  };
}

export async function submitReading(stayId: string, body: unknown, headers: Pick<Headers, "get">, deps: SubmitDeps): Promise<SubmitResponse> {
  if (!deps.salt) return fail(503, "server_misconfigured", "Submissions are temporarily unavailable. Please try again later.");

  const ipHash = hashValue(deps.salt, "ip", clientIp(headers));
  const ipCheck = deps.ipLimiter.check(ipHash);
  if (!ipCheck.allowed)
    return fail(
      429,
      "rate_limited",
      `You are submitting too quickly. Please wait about ${formatWait(ipCheck.retryAfterSec)} and try again.`,
      { "Retry-After": String(ipCheck.retryAfterSec) },
    );

  const parsed = parseReadingBody(body);
  if (!parsed.ok) return fail(400, "invalid", parsed.error);

  const deviceHash = hashValue(deps.salt, "device", parsed.deviceId);
  const devCheck = deps.deviceLimiter.check(deviceHash);
  if (!devCheck.allowed)
    return fail(
      429,
      "rate_limited",
      `This device has submitted too many readings recently. Please wait about ${formatWait(devCheck.retryAfterSec)}.`,
      { "Retry-After": String(devCheck.retryAfterSec) },
    );

  const stay = await deps.store.getStay(stayId);
  if (!stay) return fail(404, "stay_not_found", "We could not find that stay.");

  const loc = validateLocationServer(stay, parsed.location);
  if (loc.status === "invalid") return fail(400, "location_invalid", "We could not read your location. Please verify your location again.");
  if (loc.status === "low_accuracy")
    return fail(422, "low_accuracy", `Your GPS is not accurate enough (about ${loc.accuracyM} m, need ${MAX_ACCURACY_M} m or better). Please verify your location again.`);
  if (loc.status === "too_far")
    return fail(422, "too_far", `You appear to be about ${loc.distanceM} m from ${stay.name}. You must be within ${MAX_DISTANCE_M} m to submit a reading.`);

  const result = await deps.store.insertReading({
    stayId: stay.id,
    ...parsed.values,
    deviceHash,
    ipHash,
    distanceM: loc.distanceM!,
    readingDay: readingDay(deps.now),
  });
  if (!result.ok)
    return fail(409, "duplicate", "You have already submitted a reading for this stay today. You can submit another one tomorrow.");

  return { status: 201, body: { ok: true } };
}

export function getDefaultSalt() {
  return getSalt();
}
