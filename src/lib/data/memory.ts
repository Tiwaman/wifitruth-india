import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NewReading, NewStay, Reading, Stay } from "../types";
import { SEED_STAYS } from "./seed";
import { median, type DataStore, type InsertReadingResult } from "./store";

interface Snapshot {
  stays: Stay[];
  readings: Reading[];
}

export function createMemoryStore(opts: { filePath?: string; seed?: Stay[] } = {}): DataStore {
  const { filePath } = opts;
  let data: Snapshot = { stays: [...(opts.seed ?? SEED_STAYS)], readings: [] };

  if (filePath && fs.existsSync(/* turbopackIgnore: true */ filePath)) {
    try {
      data = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ filePath, "utf8")) as Snapshot;
    } catch {
      // corrupt file: start from seed
    }
  }

  const persist = () => {
    if (!filePath) return;
    fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(filePath), { recursive: true });
    fs.writeFileSync(/* turbopackIgnore: true */ filePath, JSON.stringify(data, null, 2));
  };

  return {
    async listStays({ q, limit = 20 } = {}) {
      const needle = q?.trim().toLowerCase();
      const rows = needle
        ? data.stays.filter((s) => `${s.name} ${s.city} ${s.state}`.toLowerCase().includes(needle))
        : data.stays;
      return rows.slice(0, limit);
    },
    async getStay(id) {
      return data.stays.find((s) => s.id === id) ?? null;
    },
    async findStayByOsm(osmType, osmId) {
      return data.stays.find((s) => s.osmType === osmType && s.osmId === osmId) ?? null;
    },
    async createStay(input: NewStay) {
      const stay: Stay = {
        id: randomUUID(),
        name: input.name,
        kind: input.kind,
        city: input.city,
        state: input.state,
        lat: input.lat,
        lon: input.lon,
        osmType: input.osmType ?? null,
        osmId: input.osmId ?? null,
        createdAt: new Date().toISOString(),
      };
      data.stays.push(stay);
      persist();
      return stay;
    },
    async insertReading(input: NewReading): Promise<InsertReadingResult> {
      const dup = data.readings.some(
        (r) => r.stayId === input.stayId && r.deviceHash === input.deviceHash && r.readingDay === input.readingDay,
      );
      if (dup) return { ok: false, reason: "duplicate" };
      const reading: Reading = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
      data.readings.push(reading);
      persist();
      return { ok: true, reading };
    },
    async getAggregate(stayId) {
      const rs = data.readings.filter((r) => r.stayId === stayId);
      return {
        stayId,
        readingCount: rs.length,
        medianDownloadMbps: median(rs.map((r) => r.downloadMbps)),
        medianUploadMbps: median(rs.map((r) => r.uploadMbps)),
        medianLatencyMs: median(rs.map((r) => r.latencyMs)),
        lastReadingAt: rs.length ? rs.map((r) => r.createdAt).sort().at(-1)! : null,
      };
    },
  };
}
