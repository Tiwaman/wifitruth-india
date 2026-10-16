"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const input = "w-full rounded border border-slate-400 p-2 bg-white";
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Add a missing stay</h2>
      <p className="text-sm text-slate-700">Only places to sleep can be added: hotels, hostels, guesthouses, homestays and resorts.</p>
      <label className="block text-sm">
        Name
        <input name="name" required defaultValue={initialName} className={input} />
      </label>
      <label className="block text-sm">
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
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          City
          <input name="city" required className={input} />
        </label>
        <label className="block text-sm">
          State
          <input name="state" required className={input} />
        </label>
        <label className="block text-sm">
          Latitude
          <input name="lat" type="number" step="any" required value={lat} onChange={(e) => setLat(e.target.value)} className={input} />
        </label>
        <label className="block text-sm">
          Longitude
          <input name="lon" type="number" step="any" required value={lon} onChange={(e) => setLon(e.target.value)} className={input} />
        </label>
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          {locating ? "Finding you..." : "Use my current location"}
        </button>
        <p className="text-xs text-slate-700">Best used while you are at the stay. Or right-click the place in a maps app to copy its coordinates.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input name="confirmLodging" type="checkbox" required className="mt-1" />
        <span>This is a place to sleep (hotel, hostel, guesthouse, homestay or resort).</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {existing && (
        <p className="text-sm">
          <Link href={`/log?stay=${existing.id}`} className="text-blue-800 underline">
            Use {existing.name} ({existing.city}) instead
          </Link>
        </p>
      )}
      <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {busy ? "Adding..." : "Add stay"}
      </button>
    </form>
  );
}
