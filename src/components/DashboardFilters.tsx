import { STAY_SORTS, type StaySort } from "@/lib/stay-summary";

const SORT_LABEL: Record<StaySort, string> = { best: "Best speed", tested: "Most tested", recent: "Recently tested" };

// Plain GET form: filters live in the URL, so the dashboard stays a server component.
export function DashboardFilters({ q, state, sort, states }: { q: string; state: string; sort: StaySort; states: string[] }) {
  const input = "w-full rounded-lg border border-slate-400 bg-white p-2";
  return (
    <form method="get" action="/" role="search" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" data-testid="filters">
      <label className="block text-sm">
        Search stays
        <input type="search" name="q" defaultValue={q} placeholder="Name, city or state" className={input} />
      </label>
      <label className="block text-sm">
        State
        <select name="state" defaultValue={state} className={input}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Sort by
        <select name="sort" defaultValue={sort} className={input}>
          {STAY_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-900">Apply</button>
    </form>
  );
}
