import path from "node:path";
import { createMemoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { DataStore } from "./store";

export type { DataStore } from "./store";

const g = globalThis as unknown as { __wifiStore?: DataStore };

export function getStore(): DataStore {
  if (!g.__wifiStore) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    g.__wifiStore =
      url && key
        ? createSupabaseStore(url, key)
        : createMemoryStore({ filePath: path.join(process.cwd(), ".data", "db.json") });
  }
  return g.__wifiStore;
}
