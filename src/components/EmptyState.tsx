import { ButtonLink } from "@/components/ui";

export function EmptyState({
  title,
  text,
  testId,
  cta,
}: {
  title: string;
  text: string;
  testId?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-ocean-300 bg-ocean-50/60 px-6 py-10 text-center"
    >
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true" focusable="false">
        <circle cx="118" cy="34" r="16" fill="#ffd98a" />
        <path d="M0 110V78L34 48l26 24 28-34 36 40 36-16v70Z" fill="#7fd0da" opacity="0.7" />
        <path d="M0 110V92l40-24 34 20 30-18 56 28v12Z" fill="#0d6473" />
        <path d="M60 64a22 22 0 0 1 32 0M66 72a13 13 0 0 1 20 0" fill="none" stroke="#ff6b4a" strokeWidth="4" strokeLinecap="round" />
        <circle cx="76" cy="80" r="3.5" fill="#ff6b4a" />
        <path d="M18 30c6-3 12-3 18 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-ink-soft">{text}</p>
      {cta && (
        <ButtonLink href={cta.href} variant="dark">
          {cta.label}
        </ButtonLink>
      )}
    </div>
  );
}
