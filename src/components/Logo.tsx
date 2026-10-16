export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill="#0a4f5c" />
      <path d="M9 15.5a15 15 0 0 1 22 0" fill="none" stroke="#7fd0da" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12.3 19.2a10.4 10.4 0 0 1 15.4 0" fill="none" stroke="#ffd98a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 35c-4.5-3.8-6.2-6.4-6.2-9a6.2 6.2 0 0 1 12.4 0c0 2.6-1.7 5.2-6.2 9Z" fill="#ff6b4a" />
      <circle cx="20" cy="26" r="2.3" fill="#fffdf9" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-lg font-bold leading-none tracking-tight ${light ? "text-white" : "text-ink"}`}>
        WiFiTruth
        <span className={`block text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${light ? "text-amber-300" : "text-ocean-700"}`}>
          India
        </span>
      </span>
    </span>
  );
}
