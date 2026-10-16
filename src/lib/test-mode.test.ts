import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocationCheckSkipped } from "./test-mode";

afterEach(() => vi.unstubAllEnvs());

describe("isLocationCheckSkipped", () => {
  it("is off when unset or empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SKIP_LOCATION_CHECK", "");
    expect(isLocationCheckSkipped()).toBe(false);
  });
  it("is on only for the exact string true", () => {
    vi.stubEnv("NEXT_PUBLIC_SKIP_LOCATION_CHECK", "true");
    expect(isLocationCheckSkipped()).toBe(true);
    for (const v of ["TRUE", "1", "yes", "false", " true"]) {
      vi.stubEnv("NEXT_PUBLIC_SKIP_LOCATION_CHECK", v);
      expect(isLocationCheckSkipped()).toBe(false);
    }
  });
});
