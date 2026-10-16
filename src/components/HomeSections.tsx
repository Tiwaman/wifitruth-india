import { ArrowRightIcon, EyeOffIcon, PinIcon, SatelliteIcon, SearchIcon, UsersIcon, WifiIcon } from "@/components/icons";
import { Container, Eyebrow } from "@/components/ui";

const TRUST = [
  { icon: UsersIcon, title: "Crowd-measured", text: "Real tests from real guests, not brochures." },
  { icon: SatelliteIcon, title: "GPS-verified", text: "Readings only count from inside the stay." },
  { icon: EyeOffIcon, title: "Anonymous", text: "No accounts, no exact location kept." },
];

export function TrustStrip() {
  return (
    <Container className="relative z-10 -mt-8 sm:-mt-10">
      <ul className="grid gap-px overflow-hidden rounded-3xl bg-sand-300/60 shadow-lift sm:grid-cols-3" aria-label="Why trust these numbers">
        {TRUST.map((t) => (
          <li key={t.title} className="flex items-center gap-3 bg-sand-50 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ocean-50 text-ocean-700 ring-1 ring-ocean-100">
              <t.icon className="h-5 w-5" />
            </span>
            <p className="text-sm leading-snug text-ink-soft">
              <strong className="block font-display text-base font-semibold text-ink">{t.title}</strong>
              {t.text}
            </p>
          </li>
        ))}
      </ul>
    </Container>
  );
}

const STEPS = [
  { icon: SearchIcon, title: "Find a stay", text: "Search the hotel, hostel or homestay you are curious about." },
  { icon: PinIcon, title: "Verify you are there", text: "A quick GPS check proves you are at the property." },
  { icon: WifiIcon, title: "Test and share", text: "Run a 30 second speed test and help the next traveller." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-h" className="bg-topo py-14 sm:py-16">
      <Container className="space-y-8">
        <div className="max-w-xl space-y-2">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-h" className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Three steps to a better trip
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 rounded-3xl border border-sand-300/70 bg-sand-50 p-5 shadow-card md:flex-col">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-700 to-ocean-900 text-white">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-coral-600">Step {i + 1}</p>
                <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRightIcon className="absolute -right-3.5 top-1/2 hidden h-7 w-7 -translate-y-1/2 rounded-full bg-sand-100 p-1 text-ocean-700 md:block" />
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
