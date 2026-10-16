import { ButtonLink } from "@/components/ui";

// Placeholder hero; the travel-themed artwork arrives in milestone 3.
export function Hero() {
  return (
    <section aria-labelledby="hero-h" data-testid="hero" className="space-y-4 rounded-2xl bg-slate-100 p-6">
      <div className="space-y-2">
        <h1 id="hero-h" className="text-3xl font-bold tracking-tight">
          Is the WiFi really that good?
        </h1>
        <p className="text-slate-700">Real speeds at hotels, hostels and homestays across India, measured on the spot by travellers.</p>
      </div>
      <ButtonLink href="/log" data-testid="log-cta">
        Log internet speed
      </ButtonLink>
    </section>
  );
}
