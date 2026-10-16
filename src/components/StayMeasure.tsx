"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { LocationCheck } from "@/components/LocationCheck";
import { SpeedTest } from "@/components/SpeedTest";
import { StepCard, Stepper, type StepState } from "@/components/Stepper";
import { Button, ButtonLink, Notice } from "@/components/ui";
import { getDeviceId } from "@/lib/device-id";
import { isLocationCheckSkipped } from "@/lib/test-mode";
import type { Fix } from "@/lib/geo";
import type { SpeedResult } from "@/lib/speedtest/types";
import type { Spot, Stay } from "@/lib/types";

type Submit =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "error"; code: string; message: string };

const CONFETTI = [
  ["left-[12%]", "bg-amber-400", "0s"],
  ["left-[26%]", "bg-coral-400", "0.15s"],
  ["left-[40%]", "bg-ocean-300", "0.05s"],
  ["left-[58%]", "bg-amber-300", "0.2s"],
  ["left-[72%]", "bg-coral-500", "0.1s"],
  ["left-[86%]", "bg-ocean-500", "0.25s"],
] as const;

export function StayMeasure({ stay }: { stay: Pick<Stay, "id" | "name" | "lat" | "lon"> }) {
  const router = useRouter();
  const [fix, setFix] = useState<Fix | null>(null);
  const [spot, setSpot] = useState<Spot>("room");
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [submit, setSubmit] = useState<Submit>({ status: "idle" });
  const [runKey, setRunKey] = useState(0);
  const skipLocation = isLocationCheckSkipped();

  async function send() {
    if ((!fix && !skipLocation) || !result) return;
    setSubmit({ status: "sending" });
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stayId: stay.id,
          // Test mode: a fresh device id each time so repeat tests are not blocked by the one-per-day rule.
          deviceId: skipLocation ? `test-${crypto.randomUUID()}` : getDeviceId(),
          spot,
          ...result,
          location: fix ? { lat: fix.lat, lon: fix.lon, accuracy: fix.accuracy } : null,
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

  function testAnotherSpot() {
    setResult(null);
    setSubmit({ status: "idle" });
    setRunKey((k) => k + 1);
    document.getElementById("step-test")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const verified = fix !== null || skipLocation;
  const done = submit.status === "done";
  const current = !verified ? 2 : !result ? 3 : !done ? 4 : 5;
  const verifyState: StepState = verified ? "done" : "active";
  const testState: StepState = !verified ? "locked" : result ? "done" : "active";
  const shareState: StepState = !result ? "locked" : done ? "done" : "active";
  const retryable = submit.status === "error" && !["duplicate", "rate_limited"].includes(submit.code);
  return (
    <div className="space-y-5">
      <Stepper current={current} />
      <StepCard step={2} title="Confirm you are here" state={verifyState}>
        {skipLocation ? (
          <div
            role="status"
            data-testid="location-skipped"
            className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-yellow-500 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-950"
          >
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-ink">
              <SparkIcon className="h-3.5 w-3.5" />
              Test mode
            </span>
            <span>Test mode: the location check is switched off, so you can test from anywhere. Readings sent now are test data.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">
              One quick GPS check proves you are at the property. We use it once and never store your exact location.
            </p>
            <LocationCheck stay={stay} onVerified={setFix} />
          </div>
        )}
      </StepCard>
      <StepCard step={3} title="Run the speed test" state={testState} id="step-test">
        <SpeedTest
          key={runKey}
          enabled={verified}
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
      </StepCard>
      <StepCard step={4} title="Share your result" state={shareState} aria-live="polite">
        {!result ? (
          <p className="text-sm text-ink-soft">Finish the speed test and you can share it here. It takes one tap.</p>
        ) : (
          <div className="space-y-4">
            {!done && (
              <p className="text-sm text-ink-soft">
                Your result is shared anonymously. We keep only the speeds, the spot you chose and how close you were, never your exact
                location.
              </p>
            )}
            {done ? (
              <div
                role="status"
                data-testid="submit-message"
                data-status="done"
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-800 to-ocean-950 p-6 text-center text-white"
              >
                {CONFETTI.map(([left, color, delay]) => (
                  <span
                    key={left}
                    aria-hidden
                    className={`anim-confetti absolute top-2 h-2.5 w-2.5 rounded-sm ${left} ${color}`}
                    style={{ animationDelay: delay }}
                  />
                ))}
                <span className="anim-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-coral-400 text-ink shadow-lift">
                  <CheckIcon className="h-9 w-9" />
                </span>
                <p className="mt-4 font-display text-2xl font-bold">Thank you, traveller!</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-ocean-100">
                  Your reading was added. You just made {stay.name} a little more honest for the next guest.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href={`/stays/${stay.id}`} data-testid="see-results">
                    See results
                    <ArrowRightIcon className="h-4 w-4" />
                  </ButtonLink>
                  <Button variant="glass" onClick={testAnotherSpot}>
                    Test another spot
                  </Button>
                </div>
                <p className="mx-auto mt-4 max-w-sm text-xs text-ocean-100">
                  We keep one reading per stay per device per day, so another spot may have to wait until tomorrow.
                </p>
              </div>
            ) : (
              <Button
                onClick={send}
                variant="success"
                size="lg"
                disabled={submit.status === "sending" || (submit.status === "error" && !retryable)}
                className="w-full sm:w-auto"
              >
                {submit.status === "sending" ? "Submitting..." : "Submit reading"}
              </Button>
            )}
            {submit.status === "error" && (
              <Notice
                tone={submit.code === "duplicate" || submit.code === "rate_limited" ? "warn" : "error"}
                role="alert"
                data-testid="submit-message"
                data-status={submit.code}
              >
                {submit.message}
              </Notice>
            )}
          </div>
        )}
      </StepCard>
    </div>
  );
}
