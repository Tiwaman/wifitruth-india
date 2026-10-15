import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiFiTruth India",
  description: "Crowd-measured WiFi quality for stays in India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-2xl p-4">{children}</main>
      </body>
    </html>
  );
}
