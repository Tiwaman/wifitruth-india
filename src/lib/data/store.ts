import type { NewReading, NewStay, Reading, Stay, StayAggregate } from "../types";

export type InsertReadingResult = { ok: true; reading: Reading } | { ok: false; reason: "duplicate" };

export interface DataStore {
  listStays(opts?: { q?: string; limit?: number }): Promise<Stay[]>;
  getStay(id: string): Promise<Stay | null>;
  findStayByOsm(osmType: string, osmId: number): Promise<Stay | null>;
  createStay(input: NewStay): Promise<Stay>;
  insertReading(input: NewReading): Promise<InsertReadingResult>;
  getAggregate(stayId: string): Promise<StayAggregate>;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
