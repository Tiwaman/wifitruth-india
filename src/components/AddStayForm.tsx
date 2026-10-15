"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAY_KINDS } from "@/lib/types";

export function AddStayForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await fetch("/api/stays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"),
        kind: f.get("kind"),
        city: f.get("city"),
        state: f.get("state"),
        lat: Number(f.get("lat")),
        lon: Number(f.get("lon")),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Could not add stay.");
    router.push(`/stays/${json.stay.id}`);
  }

  const input = "w-full rounded border border-slate-400 p-2 bg-white";
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Add a missing stay</h2>
      <label className="block text-sm">
        Name
        <input name="name" required defaultValue={initialName} className={input} />
      </label>
      <label className="block text-sm">
        Type
        <select name="kind" defaultValue="other" className={input}>
          {STAY_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
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
          <input name="lat" type="number" step="any" required className={input} />
        </label>
        <label className="block text-sm">
          Longitude
          <input name="lon" type="number" step="any" required className={input} />
        </label>
      </div>
      <p className="text-xs text-slate-700">Tip: right-click the place in a maps app to copy its coordinates.</p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {busy ? "Adding..." : "Add stay"}
      </button>
    </form>
  );
}
