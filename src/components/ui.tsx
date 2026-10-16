import Link from "next/link";

// Small shared building blocks. Milestone 3 restyles the whole app by editing these classes.

export function Card({ className = "", ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`} {...props} />;
}

const BUTTON = {
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  secondary: "border border-slate-400 bg-white text-slate-900 hover:bg-slate-50",
};

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: { href: string; variant?: keyof typeof BUTTON } & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold ${BUTTON[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Chip({ children, ...rest }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-800 ring-1 ring-slate-300" {...rest}>
      {children}
    </span>
  );
}
