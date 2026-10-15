import type { MetadataRoute } from "next";
import { getStore } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().origin;
  const stays = await getStore().listStays({ limit: 1000 }).catch(() => []);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...stays.map((s) => ({ url: `${base}/stays/${s.id}`, lastModified: s.createdAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
