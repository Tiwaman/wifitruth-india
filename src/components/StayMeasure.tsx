"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationCheck } from "@/components/LocationCheck";
import { SpeedTest } from "@/components/SpeedTest";
import { getDeviceId } from "@/lib/device-id";
import type { Fix } from "@/lib/geo";
import type { SpeedResult } from "@/lib/speedtest/types";
import type { Spot, Stay } from "@/lib/types";

type Submit =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "error"; code: string; message: string };

export function StayMeasure({ stay }: { stay: Pick<Stay, "id" | "name" | "lat" | "lon"> }) {
  const router = useRouter();
  const [fix, setFix] = useState<Fix | null>(null);
  const [spot, setSpot] = useState<Spot>("room");
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [submit, setSubmit] = useState<Submit>({ status: "idle" });

  async function send() {
    if (!fix || !result) return;
    setSubmit({ status: "sending" });
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stayId: stay.id,
          deviceId: getDeviceId(),
          spot,
          ...result,
          location: { lat: fix.lat, lon: fix.lon, accuracy: fix.accuracy },
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok: boolean; code?: string; error?: string } | null;
      if (res.ok && json?.ok) {
        setSubmit({ status: "done" });
        router.refresh();
      } else {
        setSubmit({
          status: "error",
          code: json?.code ?? "server_error",
          message: json?.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setSubmit({ status: "error", code: "network", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  const retryable = submit.status === "error" && !["duplicate", "rate_limited"].includes(submit.code);
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">1. Confirm you are here</h2>
        <LocationCheck stay={stay} onVerified={setFix} />
      </section>
      <SpeedTest
        enabled={fix !== null}
        spot={spot}
        onSpotChange={setSpot}
        onComplete={(r) => {
          setResult(r);
          setSubmit({ status: "idle" });
        }}
        onReset={() => {
          setResult(null);
          setSubmit({ status: "idle" });
        }}
      />
      {result && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
          <h2 className="text-lg font-semibold">3. Share your result</h2>
          <p className="text-sm text-slate-700">
            Your result is shared anonymously. We keep only the speeds, the spot you chose and how close you were, never your exact location.
          </p>
          {submit.status === "done" ? (
            <p role="status" data-testid="submit-message" data-status="done" className="rounded border-l-4 border-green-600 bg-green-50 p-3 text-sm text-green-900">
              Thank you! Your reading was added.
            </p>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={submit.status === "sending" || (submit.status === "error" && !retryable)}
              className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
            >
              {submit.status === "sending" ? "Submitting..." : "Submit reading"}
            </button>
          )}
          {submit.status === "error" && (
            <p
              role="alert"
              data-testid="submit-message"
              data-status={submit.code}
              className={`rounded border-l-4 p-3 text-sm ${
                submit.code === "duplicate" || submit.code === "rate_limited"
                  ? "border-yellow-600 bg-yellow-50 text-yellow-900"
                  : "border-red-600 bg-red-50 text-red-900"
              }`}
            >
              {submit.message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
