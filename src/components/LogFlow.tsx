"use client";

import Link from "next/link";
import { KindIcon } from "@/components/SpotIcon";
import { StayMeasure } from "@/components/StayMeasure";
import { StayPicker } from "@/components/StayPicker";
import { StepCard, Stepper } from "@/components/Stepper";
import { Notice } from "@/components/ui";
import { KIND_LABEL } from "@/lib/lodging";
import type { Stay } from "@/lib/types";

export function LogFlow({ stay, notice }: { stay: Stay | null; notice?: string }) {
  if (!stay) {
    return (
      <div className="space-y-5">
        <Stepper current={1} />
        {notice && (
          <Notice tone="warn" role="status" data-testid="log-notice">
            {notice}
          </Notice>
        )}
        <StepCard step={1} title="Choose your stay" state="active" data-testid="choose-stay">
          <p className="mb-4 text-sm text-ink-soft">Search for the hotel, hostel, guesthouse or homestay you are at. Only places to sleep can be added.</p>
          <StayPicker />
        </StepCard>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-sand-300/70 bg-sand-50 p-4 shadow-card" data-testid="selected-stay">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ocean-700 text-white">
          <KindIcon kind={stay.kind} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ocean-700">Step 1 done · Your stay</p>
          <h2 className="font-display text-xl font-semibold leading-snug [overflow-wrap:anywhere]">{stay.name}</h2>
          <p className="text-sm text-ink-soft">
            {KIND_LABEL[stay.kind]} · {stay.city}, {stay.state}
          </p>
        </div>
        <Link href="/log" className="rounded-full border border-ocean-700 px-4 py-2 text-sm font-semibold text-ocean-900 hover:bg-ocean-50">
          Change stay
        </Link>
      </div>
      <StayMeasure stay={{ id: stay.id, name: stay.name, lat: stay.lat, lon: stay.lon }} />
    </div>
  );
}
