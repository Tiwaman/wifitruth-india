import { CheckIcon, LockIcon } from "@/components/icons";

export const LOG_STEPS = ["Choose stay", "Verify location", "Test speed", "Share"] as const;

export type StepState = "locked" | "active" | "done";

/** Horizontal 4-step progress indicator. `current` is 1-based; 5 means everything is done. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Progress" data-testid="stepper">
      {LOG_STEPS.map((label, i) => {
        const n = i + 1;
        const state: StepState = n < current ? "done" : n === current ? "active" : "locked";
        return (
          <li key={label} className="relative flex flex-col items-center gap-1.5 text-center" data-state={state} aria-current={state === "active" ? "step" : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[1.15rem] h-0.5 w-full -translate-y-1/2 rounded-full ${n <= current ? "bg-ocean-600" : "bg-sand-300"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-4 ring-sand-100 transition ${
                state === "done"
                  ? "bg-ocean-700 text-white"
                  : state === "active"
                    ? "bg-gradient-to-br from-amber-400 to-coral-400 text-ink shadow-[0_6px_16px_-6px_rgb(255_107_74/0.8)]"
                    : "bg-sand-200 text-ink-soft"
              }`}
            >
              {state === "done" ? <CheckIcon className="h-5 w-5" /> : n}
            </span>
            <span className={`text-[0.7rem] font-semibold leading-tight sm:text-sm ${state === "locked" ? "text-ink-soft" : "text-ink"}`}>
              {label}
              <span className="sr-only">{state === "done" ? " (done)" : state === "active" ? " (current step)" : " (locked)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StepCard({
  step,
  title,
  state,
  children,
  id,
  ...rest
}: {
  step: number;
  title: string;
  state: StepState;
  children: React.ReactNode;
  id?: string;
} & Omit<React.ComponentPropsWithoutRef<"section">, "title">) {
  return (
    <section
      id={id}
      data-state={state}
      aria-labelledby={`step-${step}-h`}
      className={`scroll-mt-24 rounded-3xl border p-5 transition sm:p-6 ${
        state === "active"
          ? "border-ocean-300 bg-sand-50 shadow-lift ring-2 ring-ocean-100"
          : state === "done"
            ? "border-sand-300/70 bg-sand-50 shadow-card"
            : "border-sand-300/60 bg-sand-50/60"
      }`}
      {...rest}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
            state === "done" ? "bg-ocean-700 text-white" : state === "active" ? "bg-ocean-100 text-ocean-900" : "bg-sand-200 text-ink-soft"
          }`}
        >
          {state === "done" ? <CheckIcon className="h-5 w-5" /> : state === "locked" ? <LockIcon className="h-4 w-4" /> : step}
        </span>
        <h2 id={`step-${step}-h`} className={`font-display text-xl font-semibold ${state === "locked" ? "text-ink-soft" : "text-ink"}`}>
          {title}
        </h2>
        <span className="ml-auto text-xs font-bold uppercase tracking-wider text-ink-soft">
          {state === "done" ? "Done" : state === "locked" ? "Locked" : "Your turn"}
        </span>
      </div>
      {children}
    </section>
  );
}
