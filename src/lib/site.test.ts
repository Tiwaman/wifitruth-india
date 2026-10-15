import { describe, expect, it } from "vitest";
import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL origin", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://wifitruth.example/path/" }).href).toBe("https://wifitruth.example/");
  });
  it("falls back to the Vercel production URL, then localhost", () => {
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "app.vercel.app" }).href).toBe("https://app.vercel.app/");
    expect(getSiteUrl({}).href).toBe("http://localhost:3000/");
  });
  it("ignores garbage and non-http schemes", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "not a url" }).href).toBe("http://localhost:3000/");
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" }).href).toBe("http://localhost:3000/");
  });
});
