"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AddStayForm } from "@/components/AddStayForm";
import type { Stay } from "@/lib/types";
import type { Place } from "@/lib/photon";

interface Results {
  query: string;
  stays: Stay[] | null;
  places: Place[] | null;
  placesError: boolean;
}

export function StayPicker() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebouncedValue(q.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) return;
    const ctrl = new AbortController();
    const update = (patch: Partial<Results>) =>
      setResults((prev) => ({
        ...(prev?.query === debounced ? prev : { query: debounced, stays: null, places: null, placesError: false }),
        ...patch,
      }));
    const get = (url: string) => fetch(url, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))));
    const enc = encodeURIComponent(debounced);
    get(`/api/stays?q=${enc}`)
      .then((j) => update({ stays: j.stays }))
      .catch((e) => {
        if (e.name !== "AbortError") setFailedFor(debounced);
      });
    get(`/api/search?q=${enc}`)
      .then((j) => update({ places: j.places, placesError: j.placesError }))
      .catch((e) => {
        if (e.name !== "AbortError") update({ places: [], placesError: true });
      });
    return () => ctrl.abort();
  }, [debounced]);

  const failed = failedFor === debounced;
  const active = debounced.length >= 2 && results?.query === debounced ? results : null;
  const loading = debounced.length >= 2 && !failed && (!active || active.stays === null || active.places === null);
  const stays = active?.stays ?? [];
  const places = active?.places ?? [];

  async function pickPlace(p: Place) {
    setError(null);
    const res = await fetch("/api/stays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, confirmLodging: true }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 409 && json.existing) return router.push(`/log?stay=${json.existing.id}`);
    if (!res.ok) return setError(json.error ?? "Could not add this place. Try the manual form.");
    router.push(`/log?stay=${json.stay.id}`);
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a hotel, hostel, guesthouse or homestay in India"
        aria-label="Search stays"
        className="w-full rounded-lg border border-slate-400 bg-white p-3"
      />
      {loading && <p className="text-sm text-slate-700">Searching...</p>}
      {failed && (
        <p role="alert" className="text-sm text-red-700">
          Search failed. Please try again.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {active && (
        <div className="space-y-4">
          {stays.length > 0 && (
            <ul data-testid="known-stays" className="divide-y rounded border bg-white">
              {stays.map((s) => (
                <li key={s.id}>
                  <Link href={`/log?stay=${s.id}`} className="block p-3 hover:bg-slate-50">
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-sm text-slate-700">
                      {s.city}, {s.state}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {places.length > 0 && (
            <div>
              <h2 className="mb-1 text-sm font-semibold text-slate-700">More stays from OpenStreetMap</h2>
              <ul data-testid="places" className="divide-y rounded border bg-white">
                {places.map((p, i) => (
                  <li key={`${p.osmType}${p.osmId}${i}`}>
                    <button type="button" onClick={() => pickPlace(p)} className="block w-full p-3 text-left hover:bg-slate-50">
                      <span className="font-medium">{p.name}</span>
                      <span className="block text-sm text-slate-700">{[p.city, p.state].filter(Boolean).join(", ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loading && stays.length === 0 && places.length === 0 && (
            <p className="text-sm text-slate-700">No matching stays found. You can add it below.</p>
          )}
          {active.placesError && (
            <p className="text-xs text-slate-700">Map search is unavailable right now; showing known stays only.</p>
          )}
        </div>
      )}
      <button type="button" onClick={() => setShowAdd((v) => !v)} className="text-sm text-blue-800 underline">
        {showAdd ? "Hide form" : "Cannot find your stay? Add it"}
      </button>
      {showAdd && <AddStayForm initialName={q.trim()} />}
    </div>
  );
}
