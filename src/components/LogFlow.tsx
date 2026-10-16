"use client";

import Link from "next/link";
import { StayMeasure } from "@/components/StayMeasure";
import { StayPicker } from "@/components/StayPicker";
import { Card } from "@/components/ui";
import { KIND_LABEL } from "@/lib/lodging";
import type { Stay } from "@/lib/types";

export function LogFlow({ stay, notice }: { stay: Stay | null; notice?: string }) {
  if (!stay) {
    return (
      <div className="space-y-4">
        {notice && (
          <p role="status" data-testid="log-notice" className="rounded border-l-4 border-yellow-600 bg-yellow-50 p-3 text-sm text-yellow-900">
            {notice}
          </p>
        )}
        <Card className="space-y-3" data-testid="choose-stay">
          <h2 className="text-lg font-semibold">Choose your stay</h2>
          <StayPicker />
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-2" data-testid="selected-stay">
        <div>
          <h2 className="text-lg font-semibold">{stay.name}</h2>
          <p className="text-sm text-slate-700">
            {KIND_LABEL[stay.kind]} · {stay.city}, {stay.state}
          </p>
        </div>
        <Link href="/log" className="text-sm text-blue-800 underline">
          Change stay
        </Link>
      </Card>
      <StayMeasure stay={{ id: stay.id, name: stay.name, lat: stay.lat, lon: stay.lon }} />
    </div>
  );
}
