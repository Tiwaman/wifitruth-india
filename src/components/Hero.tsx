import { SearchIcon, WifiIcon } from "@/components/icons";
import { Scenery } from "@/components/Scenery";
import { buttonClass } from "@/components/ui";
import Link from "next/link";

export function Hero({ q = "" }: { q?: string }) {
  return (
    <section
      aria-labelledby="hero-h"
      data-testid="hero"
      className="on-dark relative isolate overflow-hidden bg-[linear-gradient(180deg,#04242c_0%,#0a4f5c_46%,#1b7d86_70%,#e4875e_92%,#ffc65c_100%)] text-white"
    >
      <div className="bg-waves absolute inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[300px] sm:h-full">
        <Scenery className="h-full w-full" />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-[190px] pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
        <div className="max-w-xl space-y-5 sm:space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-white/25 backdrop-blur">
            <WifiIcon className="h-4 w-4" />
            Crowd-measured WiFi for travellers
          </p>
          <h1 id="hero-h" className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl">
            Know the WiFi <span className="text-amber-300">before you book</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-ocean-100 sm:text-lg">
            Real speeds at hotels, hostels and homestays across India, tested on the spot by guests and verified by GPS. Work from
            the hills, the beach, anywhere.
          </p>
          <form action="/#stays" method="get" role="search" aria-label="Find your next stay" className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-lift focus-within:ring-4 focus-within:ring-amber-300/80">
            <SearchIcon className="h-5 w-5 shrink-0 text-ocean-700" />
            <label htmlFor="hero-q" className="sr-only">
              Where are you heading?
            </label>
            <input
              id="hero-q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Try Manali, Goa or a hostel name"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink placeholder:text-ink-soft/80 focus:outline-none"
            />
            <button className={buttonClass("dark", "md", "shrink-0")}>Search</button>
          </form>
          <div className="flex flex-wrap gap-3">
            <Link href="/log" data-testid="log-cta" className={buttonClass("primary", "lg")}>
              Log internet speed
            </Link>
            <Link href="#stays" className={buttonClass("glass", "lg")}>
              Browse stays
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
