"use client";

import { useEffect, useRef, useState } from "react";

export function StayMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet")
      .then((L) => {
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lon], 15);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        L.circleMarker([lat, lon], { radius: 9, color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 0.9, weight: 3 })
          .addTo(map)
          .bindTooltip(name);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lon, name]);

  if (failed)
    return <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">The map could not be loaded.</p>;
  return (
    <div
      ref={ref}
      role="region"
      aria-label={`Map showing the location of ${name}`}
      data-testid="stay-map"
      className="z-0 h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-72"
    />
  );
}
