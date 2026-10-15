import { describe, expect, it } from "vitest";
import { isUuid, MAX_BODY_BYTES, readJson } from "./http";

const post = (body: string, headers: Record<string, string> = {}) => new Request("http://x/api", { method: "POST", body, headers });

describe("isUuid", () => {
  it("accepts seed-style and random uuids, rejects junk", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid(crypto.randomUUID())).toBe(true);
    for (const bad of ["", "abc", "1; drop table stays", "00000000-0000-4000-8000-00000000000g", "../etc/passwd", 5, null, undefined])
      expect(isUuid(bad)).toBe(false);
  });
});

describe("readJson", () => {
  it("parses valid json", async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ ok: true, body: { a: 1 } });
  });
  it("rejects invalid json with 400", async () => {
    expect(await readJson(post("{nope"))).toEqual({ ok: false, status: 400 });
  });
  it("rejects oversized bodies with 413", async () => {
    expect(await readJson(post(JSON.stringify({ a: "x".repeat(MAX_BODY_BYTES + 10) })))).toEqual({ ok: false, status: 413 });
    expect(await readJson(post("{}", { "content-length": String(MAX_BODY_BYTES + 1) }))).toEqual({ ok: false, status: 413 });
  });
});
