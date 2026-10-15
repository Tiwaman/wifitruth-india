export const MAX_BODY_BYTES = 8 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export type JsonResult = { ok: true; body: unknown } | { ok: false; status: 400 | 413 };

export async function readJson(req: Request): Promise<JsonResult> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { ok: false, status: 413 };
  const text = await req.text().catch(() => null);
  if (text === null) return { ok: false, status: 400 };
  if (text.length > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}
