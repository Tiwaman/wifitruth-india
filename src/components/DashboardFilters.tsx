import { SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { STAY_SORTS, type StaySort } from "@/lib/stay-summary";

const SORT_LABEL: Record<StaySort, string> = { best: "Best speed", tested: "Most tested", recent: "Recently tested" };

const pill =
  "rounded-full border border-transparent bg-sand-100 px-3 py-2 text-sm font-medium text-ink focus:border-ocean-600";

// Plain GET form: filters live in the URL, so the dashboard stays a server component.
export function DashboardFilters({ q, state, sort, states }: { q: string; state: string; sort: StaySort; states: string[] }) {
  return (
    <form
      method="get"
      action="/#stays"
      role="search"
      aria-label="Filter stays"
      className="grid gap-2 rounded-3xl border border-sand-300/70 bg-sand-50 p-2 shadow-card sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] sm:items-center sm:rounded-full"
      data-testid="filters"
    >
      <div className="flex items-center gap-2 rounded-full bg-sand-100 pl-3.5">
        <SearchIcon className="h-5 w-5 shrink-0 text-ocean-700" />
        <label htmlFor="f-q" className="sr-only">
          Search stays
        </label>
        <input
          id="f-q"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, city or state"
          className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-ink placeholder:text-ink-soft/80 focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <span className="pl-2 sm:sr-only">State</span>
        <select name="state" defaultValue={state} className={`${pill} min-w-0 flex-1`}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <span className="whitespace-nowrap pl-2 sm:sr-only">Sort by</span>
        <select name="sort" defaultValue={sort} className={`${pill} min-w-0 flex-1`}>
          {STAY_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <button className={buttonClass("dark")}>Apply</button>
    </form>
  );
}
