import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/cleanup-non-lodging.sql", "utf8");
const live = sql
  .split("\n")
  .filter((l) => !l.trimStart().startsWith("--"))
  .join("\n");

describe("supabase/cleanup-non-lodging.sql", () => {
  it("has no live DELETE or other write statements", () => {
    expect(live).not.toMatch(/\b(delete|update|insert|drop|truncate|alter)\b/i);
    expect(live).toMatch(/\bselect\b/i);
  });
  it("keeps a commented DELETE that always excludes the seed ids", () => {
    const deletes = sql.match(/--\s*delete from[\s\S]*?;/gi) ?? [];
    expect(deletes).toHaveLength(2);
    for (const d of deletes) expect(d).toContain("00000000-0000-4000-8000-0000000000");
  });
  it("excludes seed ids from the candidate select", () => {
    expect(live).toContain("00000000-0000-4000-8000-0000000000[0-9][0-9]");
  });
});
