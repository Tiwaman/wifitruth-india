import { describe, expect, it } from "vitest";
import { formatAgo, formatMbps, formatTimeAgo } from "./format";

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

describe("formatTimeAgo", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  it("formats minutes, hours and days", () => {
    expect(formatTimeAgo(ago(10_000), now)).toBe("just now");
    expect(formatTimeAgo(ago(5 * 60_000), now)).toBe("5 min ago");
    expect(formatTimeAgo(ago(60 * 60_000), now)).toBe("1 hour ago");
    expect(formatTimeAgo(ago(3 * 3_600_000), now)).toBe("3 hours ago");
    expect(formatTimeAgo(ago(30 * 3_600_000), now)).toBe("yesterday");
    expect(formatTimeAgo(ago(5 * 86_400_000), now)).toBe("5 days ago");
  });
  it("treats future or invalid times as just now", () => {
    expect(formatTimeAgo(ago(-60_000), now)).toBe("just now");
    expect(formatTimeAgo("garbage", now)).toBe("just now");
  });
});
