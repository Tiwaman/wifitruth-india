import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

const description =
  "Real WiFi speeds at hostels, hotels and homestays across India, measured on the spot by travellers and verified by GPS.";

export const metadata: Metadata = {
  title: { default: "WiFiTruth India - real WiFi speeds at stays", template: "%s | WiFiTruth India" },
  description,
  applicationName: "WiFiTruth India",
  openGraph: { title: "WiFiTruth India", description, type: "website", locale: "en_IN", siteName: "WiFiTruth India" },
  twitter: { card: "summary", title: "WiFiTruth India", description },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d4ed8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-800"
        >
          Skip to content
        </a>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-blue-800">
              WiFiTruth India
            </Link>
            <Link href="/privacy" className="text-sm text-slate-700 underline">
              Privacy
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-3xl px-4 py-6">
          {children}
        </main>
        <footer className="mx-auto max-w-3xl px-4 pb-10 text-xs text-slate-600">
          <p>
            Readings are anonymous. We never store your exact location, only whether you were within range of the stay.{" "}
            <Link href="/privacy" className="underline">
              Privacy details
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
