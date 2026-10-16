"use client";

import { useEffect, useMemo } from "react";
import { CrosshairIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useGeolocation } from "@/hooks/useGeolocation";
import { evaluateLocation, MAX_ACCURACY_M, MAX_DISTANCE_M, type Fix } from "@/lib/geo";
import type { Stay } from "@/lib/types";

type Tone = "ok" | "warn" | "error";

const toneClass: Record<Tone, string> = {
  ok: "border-green-600 bg-green-50 text-green-950",
  warn: "border-yellow-500 bg-yellow-50 text-yellow-950",
  error: "border-red-600 bg-red-50 text-red-950",
};

export function LocationCheck({
  stay,
  onVerified,
}: {
  stay: Pick<Stay, "name" | "lat" | "lon">;
  onVerified?: (fix: Fix | null) => void;
}) {
  const { state, request } = useGeolocation();
  const { lat, lon, name } = stay;

  const result = useMemo(
    () => (state.status === "success" ? evaluateLocation({ lat, lon }, state.fix) : null),
    [state, lat, lon],
  );

  const verifiedFix = result?.status === "ok" && state.status === "success" ? state.fix : null;
  useEffect(() => {
    onVerified?.(verifiedFix);
  }, [verifiedFix, onVerified]);

  let message: { tone: Tone; text: string } | null = null;
  if (state.status === "denied")
    message = {
      tone: "error",
      text: "Location permission was denied. Allow location access for this site in your browser settings, then try again. We only use it once to confirm you are at the stay.",
    };
  else if (state.status === "unavailable")
    message = { tone: "error", text: "Your device could not determine a location. Turn on GPS or location services and try again." };
  else if (state.status === "timeout")
    message = { tone: "warn", text: "Getting your location timed out. Move near a window or outdoors and try again." };
  else if (result?.status === "ok")
    message = { tone: "ok", text: `Location confirmed: you are about ${result.distanceM} m from ${name}.` };
  else if (result?.status === "low_accuracy")
    message = {
      tone: "warn",
      text: `GPS is not accurate enough (about ${result.accuracyM} m, need ${MAX_ACCURACY_M} m or better). Step outside or near a window, wait a few seconds and retry.`,
    };
  else if (result?.status === "too_far")
    message = {
      tone: "error",
      text: `You appear to be about ${result.distanceM} m from ${name}. You must be within ${MAX_DISTANCE_M} m to submit a reading.`,
    };
  else if (result?.status === "invalid")
    message = { tone: "error", text: "We received an invalid location. Please try again." };

  const busy = state.status === "requesting";
  return (
    <section className="space-y-3" aria-live="polite">
      <Button onClick={request} disabled={busy} variant={verifiedFix ? "outline" : "dark"} size="lg" className="w-full sm:w-auto">
        <CrosshairIcon className="h-5 w-5" />
        {busy ? "Getting your location..." : state.status === "idle" ? "Verify I am at this stay" : "Check again"}
      </Button>
      {message && (
        <p
          role={message.tone === "ok" ? "status" : "alert"}
          data-testid="location-message"
          data-status={result?.status ?? state.status}
          className={`rounded-2xl border-l-4 px-4 py-3 text-sm leading-relaxed ${toneClass[message.tone]}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
