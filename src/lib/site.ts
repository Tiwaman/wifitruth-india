export function getSiteUrl(env: Record<string, string | undefined> = process.env): URL {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return new URL(u.origin);
  } catch {}
  return new URL("http://localhost:3000");
}
