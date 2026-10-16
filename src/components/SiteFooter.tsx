import Link from "next/link";
import { EyeOffIcon, SatelliteIcon, UsersIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="on-dark relative mt-16 overflow-hidden bg-ocean-950 text-ocean-100">
      <div className="bg-waves absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-sm text-sm leading-relaxed text-ocean-100">
            Honest WiFi speeds for hotels, hostels and homestays across India. Measured on the spot by travellers like you, so you can
            book with confidence and work from anywhere.
          </p>
        </div>
        <nav aria-label="Footer" className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-300">Explore</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#stays" className="hover:text-white hover:underline">
                Browse stays
              </Link>
            </li>
            <li>
              <Link href="/log" className="hover:text-white hover:underline">
                Log a speed
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white hover:underline">
                Privacy details
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-300">Our promise</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-ocean-300" /> Crowd-measured by real guests
            </li>
            <li className="flex items-center gap-2">
              <SatelliteIcon className="h-4 w-4 text-ocean-300" /> GPS-verified at the stay
            </li>
            <li className="flex items-center gap-2">
              <EyeOffIcon className="h-4 w-4 text-ocean-300" /> Anonymous, no exact location stored
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ocean-100 sm:px-6">
          Readings are anonymous. We never store your exact location, only whether you were within range of the stay. Free and
          community-powered. Map data from OpenStreetMap contributors.
        </p>
      </div>
    </footer>
  );
}
