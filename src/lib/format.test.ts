import { describe, expect, it } from "vitest";
import { formatAgo, formatMbps } from "./format";

describe("format", () => {
  it("formats Mbps", () => {
    expect(formatMbps(null)).toBe("-");
    expect(formatMbps(12.345)).toBe("12.3");
    expect(formatMbps(250.6)).toBe("251");
  });
  it("formats recency", () => {
    expect(formatAgo(null)).toBe("never");
    expect(formatAgo(0)).toBe("today");
    expect(formatAgo(1)).toBe("yesterday");
    expect(formatAgo(12)).toBe("12 days ago");
    expect(formatAgo(90)).toBe("3 months ago");
    expect(formatAgo(400)).toBe("over a year ago");
  });
});
