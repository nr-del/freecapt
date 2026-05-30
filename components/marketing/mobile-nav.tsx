"use client";

// Mobile navigation for the marketing header. Below md, the desktop nav is
// hidden; this renders a hamburger that opens a full-width panel with the same
// nav links + CTAs + language switcher so small-screen visitors can reach every
// section. Closes on link tap, on Escape, and locks body scroll while open.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";

type NavItem = { key: string; label: string; href: string };

export function MobileNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  // Lock background scroll + close on Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Free<span className="text-brand-600">C</span>apT
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="flex size-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-col px-6 py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-slate-100 py-4 text-lg font-medium text-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 px-6 pt-4">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-md bg-brand-600 px-4 py-3 text-center text-base font-medium text-white hover:bg-brand-700"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-3 text-center text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("signIn")}
            </Link>
            <LanguageSwitcher className="mt-2" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
