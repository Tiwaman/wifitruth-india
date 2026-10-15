"use client";

import { useCallback, useState } from "react";
import type { Fix } from "@/lib/geo";

export type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "success"; fix: Fix }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "timeout" };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "success",
          fix: { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy },
        }),
      (err) =>
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable",
        }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  return { state, request };
}
