"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AddStayForm } from "@/components/AddStayForm";
import { PinIcon, SearchIcon } from "@/components/icons";
import { Notice } from "@/components/ui";
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
      <div className="flex items-center gap-2 rounded-full border-2 border-sand-300 bg-white pl-4 focus-within:border-ocean-600">
        <SearchIcon className="h-5 w-5 shrink-0 text-ocean-700" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a hotel, hostel, guesthouse or homestay in India"
          aria-label="Search stays"
          className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-base text-ink placeholder:text-ink-soft/80 focus:outline-none"
        />
      </div>
      {loading && (
        <p className="text-sm text-ink-soft" role="status">
          Searching...
        </p>
      )}
      {failed && (
        <Notice tone="error" role="alert">
          Search failed. Please try again.
        </Notice>
      )}
      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}
      {active && (
        <div className="space-y-4">
          {stays.length > 0 && (
            <ul data-testid="known-stays" className="divide-y divide-sand-300/70 overflow-hidden rounded-2xl border border-sand-300 bg-white">
              {stays.map((s) => (
                <li key={s.id}>
                  <Link href={`/log?stay=${s.id}`} className="flex items-center gap-3 p-3.5 hover:bg-ocean-50">
                    <PinIcon className="h-5 w-5 shrink-0 text-coral-600" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink [overflow-wrap:anywhere]">{s.name}</span>
                      <span className="block text-sm text-ink-soft">
                        {s.city}, {s.state}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {places.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-soft">More stays from OpenStreetMap</h3>
              <ul data-testid="places" className="divide-y divide-sand-300/70 overflow-hidden rounded-2xl border border-sand-300 bg-white">
                {places.map((p, i) => (
                  <li key={`${p.osmType}${p.osmId}${i}`}>
                    <button type="button" onClick={() => pickPlace(p)} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-ocean-50">
                      <PinIcon className="h-5 w-5 shrink-0 text-ocean-600" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink [overflow-wrap:anywhere]">{p.name}</span>
                        <span className="block text-sm text-ink-soft">{[p.city, p.state].filter(Boolean).join(", ")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loading && stays.length === 0 && places.length === 0 && (
            <p className="text-sm text-ink-soft">No matching stays found. You can add it below.</p>
          )}
          {active.placesError && <p className="text-xs text-ink-soft">Map search is unavailable right now; showing known stays only.</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowAdd((v) => !v)}
        className="text-sm font-semibold text-ocean-800 underline underline-offset-4 hover:text-ocean-950"
      >
        {showAdd ? "Hide form" : "Cannot find your stay? Add it"}
      </button>
      {showAdd && <AddStayForm initialName={q.trim()} />}
    </div>
  );
}
