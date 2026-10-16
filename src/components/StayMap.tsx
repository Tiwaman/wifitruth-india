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
        // Leaflet treats string tooltip content as HTML, so pass a text node (stay names are user-supplied).
        const label = document.createElement("span");
        label.textContent = name;
        L.circleMarker([lat, lon], { radius: 9, color: "#073b46", fillColor: "#ff6b4a", fillOpacity: 0.9, weight: 3 })
          .addTo(map)
          .bindTooltip(label);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lon, name]);

  if (failed)
    return <p className="rounded-2xl bg-sand-200 p-3 text-sm text-ink-soft">The map could not be loaded.</p>;
  return (
    <div
      ref={ref}
      role="region"
      aria-label={`Map showing the location of ${name}`}
      data-testid="stay-map"
      className="z-0 h-64 w-full overflow-hidden rounded-2xl border border-sand-300 bg-ocean-50 sm:h-80 lg:h-72"
    />
  );
}
