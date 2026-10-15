import type { Band, Confidence } from "./scoring";

export const BAND_LABEL: Record<Band, string> = { poor: "Poor", moderate: "Moderate", good: "Good" };
export const CONFIDENCE_LABEL: Record<Confidence, string> = { low: "Low", medium: "Medium", high: "High" };

export function formatMbps(n: number | null): string {
  if (n === null) return "-";
  return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
}

export function formatAgo(days: number | null): string {
  if (days === null) return "never";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 60) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return "over a year ago";
}
