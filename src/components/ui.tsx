import Link from "next/link";

export function Container({ className = "", ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={`rounded-3xl border border-sand-300/70 bg-sand-50 p-5 shadow-card sm:p-6 ${className}`} {...props} />;
}

const BUTTON = {
  primary:
    "bg-gradient-to-r from-amber-400 to-coral-400 text-ink shadow-[0_8px_20px_-8px_rgb(255_107_74/0.7)] hover:brightness-105 hover:shadow-[0_12px_26px_-8px_rgb(255_107_74/0.8)]",
  dark: "bg-ocean-800 text-white hover:bg-ocean-900",
  outline: "border-2 border-ocean-700 bg-sand-50 text-ocean-900 hover:bg-ocean-50",
  glass: "border border-white/60 bg-white/10 text-white backdrop-blur hover:bg-white/20",
  success: "bg-green-700 text-white hover:bg-green-800",
};

export type ButtonVariant = keyof typeof BUTTON;

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "lg" = "md", extra = "") {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:hover:brightness-100 ${pad} ${BUTTON[variant]} ${extra}`;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: { href: string; variant?: ButtonVariant; size?: "md" | "lg" } & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: { variant?: ButtonVariant; size?: "md" | "lg" } & React.ComponentPropsWithoutRef<"button">) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export function Chip({ children, className = "", ...rest }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-ocean-50 px-2.5 py-0.5 text-xs font-semibold text-ocean-900 ring-1 ring-ocean-100 ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.18em] text-ocean-700 ${className}`}>{children}</p>;
}

export const inputClass =
  "w-full rounded-2xl border border-sand-300 bg-white px-4 py-2.5 text-ink placeholder:text-ink-soft/70 shadow-inner shadow-sand-200/40 focus:border-ocean-600";

const NOTICE = {
  ok: "border-green-600 bg-green-50 text-green-950",
  warn: "border-yellow-500 bg-yellow-50 text-yellow-950",
  error: "border-red-600 bg-red-50 text-red-950",
  info: "border-ocean-500 bg-ocean-50 text-ocean-950",
};

export function Notice({
  tone = "info",
  className = "",
  children,
  ...rest
}: { tone?: keyof typeof NOTICE } & React.ComponentPropsWithoutRef<"p">) {
  return (
    <p className={`rounded-2xl border-l-4 px-4 py-3 text-sm leading-relaxed ${NOTICE[tone]} ${className}`} {...rest}>
      {children}
    </p>
  );
}
