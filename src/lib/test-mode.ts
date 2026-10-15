// Testing aid: when NEXT_PUBLIC_SKIP_LOCATION_CHECK=true, the GPS gate is skipped on the client and the server,
// and every submission counts as a fresh device so the one-reading-per-day rule does not block repeat tests.
// Off by default. Never enable it in a real launch: anyone could then rate a stay from anywhere.
// Must reference process.env.NEXT_PUBLIC_* literally so Next.js can inline it into the browser bundle.
export function isLocationCheckSkipped(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_LOCATION_CHECK === "true";
}
