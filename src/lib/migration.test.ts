import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_ACCURACY_M, MAX_DISTANCE_M } from "./geo";
import { SPOTS, STAY_KINDS } from "./types";

const sql = readFileSync("supabase/migrations/20261015000001_init.sql", "utf8");

describe("supabase migration (static review checks)", () => {
  it("enums match the app", () => {
    const enumValues = (name: string) =>
      [...(sql.match(new RegExp(`create type public\.${name} as enum \(([^)]*)\)`))?.[1] ?? "").matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(enumValues("spot")).toEqual([...SPOTS]);
    expect(enumValues("stay_kind")).toEqual([...STAY_KINDS]);
  });
  it("distance check matches the app limit", () => {
    expect(sql).toContain(`distance_m <= ${MAX_DISTANCE_M}`);
    expect(MAX_ACCURACY_M).toBe(100);
  });
  it("one reading per stay, device and day", () => {
    expect(sql).toContain("unique (stay_id, device_hash, reading_day)");
  });
  it("RLS on, readings have no policy, anon cannot read readings", () => {
    expect(sql).toContain("alter table public.readings enable row level security");
    expect(sql).not.toMatch(/create policy[^;]*on public\.readings/);
    expect(sql).toMatch(/revoke all on [^;]*public\.readings[^;]* from anon, authenticated/);
    expect(sql).not.toMatch(/^grant [^;]*public.readings/m);
  });
  it("views run as owner so anon sees aggregates only", () => {
    expect(sql).toContain("security_invoker = false");
  });
  it("day default matches the app's IST day", () => {
    expect(sql).toContain("Asia/Kolkata");
  });
});
