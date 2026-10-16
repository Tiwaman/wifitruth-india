export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading...</span>
      <div className="h-[22rem] bg-gradient-to-b from-ocean-950 to-ocean-700 sm:h-[26rem]" />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6">
        <div className="skeleton h-9 w-1/2 rounded-2xl" />
        <div className="skeleton h-14 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4 rounded-3xl border border-sand-300/70 bg-sand-50 p-5">
              <div className="flex gap-3">
                <div className="skeleton h-11 w-11 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-1/2 rounded-lg" />
                </div>
              </div>
              <div className="skeleton h-10 w-1/3 rounded-lg" />
              <div className="skeleton h-2.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
