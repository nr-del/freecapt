// Shared marketing chrome - one header + footer used across every public
// page (landing, comparisons, legal, company). Keeping these in one place means
// the nav and footer links stay consistent site-wide. Copy follows
// docs/07_brand_package.md; tokens follow docs/12_design_system.md.
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// Wordmark - the C is brand-600 (docs/07_brand_package.md §1).
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Free<span className="text-brand-600">C</span>apT
    </span>
  );
}

const NAV = [
  { label: "Product", href: "/#features" },
  { label: "Countries", href: "/#countries" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Compare", href: "/compare" },
  { label: "Security", href: "/#security" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* Decorative language switcher - next-intl wiring lands later.
              appearance:none + forced webkit/moz removes the native arrow so
              only our single chevron shows. */}
          <div className="relative hidden sm:block">
            <select
              aria-label="Language"
              defaultValue="EN"
              className="cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs [-moz-appearance:none] [-webkit-appearance:none]"
            >
              <option value="EN">🇬🇧 EN</option>
              <option value="DA">🇩🇰 DA</option>
              <option value="NO">🇳🇴 NO</option>
              <option value="SV">🇸🇪 SV</option>
              <option value="DE">🇩🇪 DE</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
          </div>
          <Link href="/sign-in" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="hidden rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:inline-block"
          >
            Get started - free
          </Link>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Country packs", href: "/#countries" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Compare", href: "/compare" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Security", href: "/#security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
      { label: "hello@freecapt.com", href: "mailto:hello@freecapt.com" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Wordmark className="mb-3 block text-xl font-bold text-white [&_.text-brand-600]:text-brand-500" />
            <p className="max-w-xs text-sm leading-relaxed">
              The free cap table for founders and small businesses. Built by{" "}
              <span className="text-slate-300">Bifrost Studios</span> in Copenhagen.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.heading}
              </div>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <div>© 2026 Bifrost Studios. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded border border-slate-800 px-2 py-1">🇪🇺 GDPR</span>
            <span className="rounded border border-slate-800 px-2 py-1">EU + US regions</span>
            <span className="rounded border border-slate-800 px-2 py-1">SOC 2 in progress</span>
            <Link href="/status" className="rounded border border-slate-800 px-2 py-1 hover:text-white">
              Status: ●
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Wraps a content page in the shared header + footer. The landing page composes
// these directly so it can interleave full-bleed sections.
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900 antialiased">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

// Simple page header band for sub-pages (title + lede).
export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        {kicker ? (
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {kicker}
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
        {lede ? <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{lede}</p> : null}
      </div>
    </div>
  );
}
