import { SpotIcon } from "@/components/SpotIcon";
import { SPOT_LABELS } from "@/lib/spots";
import { SPOTS, type Spot } from "@/lib/types";

/** Icon chips as a native radio group: arrow keys, labels and focus come for free. */
export function SpotPicker({
  value,
  onChange,
  disabled,
}: {
  value: Spot;
  onChange: (s: Spot) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-ink">Where are you testing?</legend>
      <div className="grid grid-cols-3 gap-2" data-testid="spot-picker">
        {SPOTS.map((s) => (
          <label
            key={s}
            className={`relative flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center text-xs font-semibold transition sm:text-sm ${
              disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:border-ocean-300"
            } ${value === s ? "border-ocean-600 bg-ocean-50 text-ocean-900" : "border-sand-300 bg-white text-ink-soft"} has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ocean-600`}
          >
            <input
              type="radio"
              name="spot"
              value={s}
              checked={value === s}
              onChange={() => onChange(s)}
              className="absolute inset-0 h-full w-full cursor-[inherit] opacity-0"
            />
            <SpotIcon spot={s} className={`h-6 w-6 ${value === s ? "text-ocean-700" : ""}`} />
            {SPOT_LABELS[s]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
