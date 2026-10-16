import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const display = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap", adjustFontFallback: true });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap", adjustFontFallback: true });

const description =
  "Real WiFi speeds at hostels, hotels and homestays across India, measured on the spot by travellers and verified by GPS.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "WiFiTruth India - real WiFi speeds at stays", template: "%s | WiFiTruth India" },
  description,
  applicationName: "WiFiTruth India",
  openGraph: { title: "WiFiTruth India", description, type: "website", locale: "en_IN", siteName: "WiFiTruth India" },
  twitter: { card: "summary", title: "WiFiTruth India", description },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#073b46" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-sand-100 font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-sand-50 focus:px-4 focus:py-2 focus:font-semibold focus:text-ocean-900 focus:shadow-lift"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
