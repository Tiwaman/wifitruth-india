"use client";

import { useState } from "react";
import { LocationCheck } from "@/components/LocationCheck";
import { SpeedTest } from "@/components/SpeedTest";
import type { Fix } from "@/lib/geo";
import type { SpeedResult } from "@/lib/speedtest/types";
import type { Spot, Stay } from "@/lib/types";

export function StayMeasure({ stay }: { stay: Pick<Stay, "id" | "name" | "lat" | "lon"> }) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [spot, setSpot] = useState<Spot>("room");
  const [result, setResult] = useState<SpeedResult | null>(null);
  void result;
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">1. Confirm you are here</h2>
        <LocationCheck stay={stay} onVerified={setFix} />
      </section>
      <SpeedTest enabled={fix !== null} spot={spot} onSpotChange={setSpot} onComplete={setResult} onReset={() => setResult(null)} />
    </div>
  );
}
