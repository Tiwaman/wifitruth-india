import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 rounded-xl border border-slate-300 bg-white p-6" data-testid="not-found">
      <h1 className="text-xl font-semibold">We could not find that page</h1>
      <p className="text-slate-700">The stay may have been removed or the link is wrong.</p>
      <Link href="/" className="inline-block text-blue-800 underline">
        Search for a stay
      </Link>
    </div>
  );
}
