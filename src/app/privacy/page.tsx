import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What WiFiTruth India stores when you submit a WiFi reading, and what it never stores.",
};

export default function Privacy() {
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Privacy</h1>
      <p>WiFiTruth India needs no account. Here is exactly what happens when you submit a reading.</p>
      <h2 className="text-lg font-semibold">Your location</h2>
      <p>
        Your browser shares your position once, only after you press the verify button. It is checked on our server
        against the stay&apos;s position and then discarded. We do not store your coordinates. We keep only the distance
        in metres (always within 150 m) as proof you were there.
      </p>
      <h2 className="text-lg font-semibold">What we store</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>The speed test numbers: download, upload, latency, jitter and packet loss.</li>
        <li>The spot you picked (room, rooftop and so on) and the date.</li>
        <li>
          A one-way salted hash of a random id kept in your browser and a one-way salted hash of your IP address. These
          only limit each device to one reading per stay per day and block abuse. They cannot be turned back into your
          IP address or identity.
        </li>
      </ul>
      <h2 className="text-lg font-semibold">What we do not do</h2>
      <p>No login, no name, no email, no advertising trackers. Your data is not sold.</p>
      <h2 className="text-lg font-semibold">Third parties</h2>
      <p>
        The speed test runs against Cloudflare&apos;s public speed test servers, and maps and place search use
        OpenStreetMap, so those services see your IP address when you use those features.
      </p>
    </article>
  );
}
