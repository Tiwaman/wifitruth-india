"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui";

const NAV = [
  { href: "/", label: "Stays" },
  { href: "/log", label: "Log speed" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/stays") : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-sand-300/60 bg-sand-100/80 backdrop-blur-lg supports-[backdrop-filter]:bg-sand-100/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="WiFiTruth India, home" className="rounded-xl">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={
                n.href === "/log"
                  ? buttonClass("dark", "md", "ml-2")
                  : `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active(n.href) ? "bg-ocean-100 text-ocean-900" : "text-ink-soft hover:bg-sand-200 hover:text-ink"
                    }`
              }
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sand-200 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-sand-300/60 bg-sand-50 px-4 pb-4 pt-2 shadow-lift md:hidden">
          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={active(n.href) ? "page" : undefined}
                    className={`block rounded-2xl px-4 py-3 text-base font-semibold ${
                      active(n.href) ? "bg-ocean-100 text-ocean-900" : "text-ink hover:bg-sand-200"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
