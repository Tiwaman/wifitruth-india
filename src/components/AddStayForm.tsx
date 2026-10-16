"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrosshairIcon } from "@/components/icons";
import { Button, inputClass, Notice } from "@/components/ui";
import { KIND_LABEL, LODGING_KINDS } from "@/lib/lodging";
import type { Stay } from "@/lib/types";

export function AddStayForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Stay | null>(null);
  const [busy, setBusy] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) return setError("Your browser cannot share its location. Enter the coordinates by hand.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Allow location access or enter the coordinates by hand.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setExisting(null);
    const res = await fetch("/api/stays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"),
        kind: f.get("kind"),
        city: f.get("city"),
        state: f.get("state"),
        lat: lat === "" ? null : Number(lat),
        lon: lon === "" ? null : Number(lon),
        confirmLodging: f.get("confirmLodging") === "on",
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409 && json.existing) setExisting(json.existing);
    if (!res.ok) return setError(json.error ?? "Could not add stay.");
    router.push(`/log?stay=${json.stay.id}`);
  }

  const input = inputClass;
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-dashed border-ocean-300 bg-ocean-50/50 p-4 sm:p-5">
      <h3 className="font-display text-lg font-semibold">Add a missing stay</h3>
      <p className="text-sm text-ink-soft">Only places to sleep can be added: hotels, hostels, guesthouses, homestays and resorts.</p>
      <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
        Name
        <input name="name" required defaultValue={initialName} className={input} />
      </label>
      <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
        Type
        <select name="kind" required defaultValue="" className={input}>
          <option value="" disabled>
            Choose a type
          </option>
          {LODGING_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
          City
          <input name="city" required className={input} />
        </label>
        <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
          State
          <input name="state" required className={input} />
        </label>
        <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
          Latitude
          <input name="lat" type="number" step="any" required value={lat} onChange={(e) => setLat(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-semibold text-ink [&>input]:mt-1 [&>select]:mt-1 [&>input]:font-normal [&>select]:font-normal">
          Longitude
          <input name="lon" type="number" step="any" required value={lon} onChange={(e) => setLon(e.target.value)} className={input} />
        </label>
      </div>
      <div className="space-y-1">
        <Button variant="outline" onClick={useMyLocation} disabled={locating}>
          <CrosshairIcon className="h-4 w-4" />
          {locating ? "Finding you..." : "Use my current location"}
        </Button>
        <p className="text-xs text-ink-soft">Best used while you are at the stay. Or right-click the place in a maps app to copy its coordinates.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input name="confirmLodging" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-ocean-700" />
        <span>This is a place to sleep (hotel, hostel, guesthouse, homestay or resort).</span>
      </label>
      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {existing && (
        <p className="text-sm">
          <Link href={`/log?stay=${existing.id}`} className="font-semibold text-ocean-800 underline underline-offset-4">
            Use {existing.name} ({existing.city}) instead
          </Link>
        </p>
      )}
      <Button type="submit" disabled={busy} variant="dark">
        {busy ? "Adding..." : "Add stay"}
      </Button>
    </form>
  );
}
