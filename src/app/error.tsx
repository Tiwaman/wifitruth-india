"use client";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-6">
      <h1 className="text-xl font-semibold text-red-900">Something went wrong</h1>
      <p className="text-red-900">We hit a problem loading this page. Please try again.</p>
      <button type="button" onClick={() => retry()} className="rounded-lg bg-slate-900 px-4 py-2 text-white">
        Try again
      </button>
    </div>
  );
}
