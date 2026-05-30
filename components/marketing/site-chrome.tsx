// Shared marketing chrome - one header + footer used across every public
// page (landing, comparisons, legal, company). Keeping these in one place means
// the nav and footer links stay consistent site-wide. Copy follows
// docs/07_brand_package.md; tokens follow docs/12_design_system.md. All display
// text comes from the message catalog (messages/*.json) via next-intl; links use
// the locale-aware Link so the active locale prefix is preserved.
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { MobileNav } from "@/components/marketing/mobile-nav";

type NavItem = { key: string; label: string; href: string };
type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

// Wordmark - the C is brand-600 (docs/07_brand_package.md §1).
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Free<span className="text-brand-600">C</span>apT
    </span>
  );
}

// mailto:/http(s): links must not be locale-prefixed; everything else routes
// through the locale-aware Link.
function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className="hover:text-white">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="hover:text-white">
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const items = t.raw("items") as NavItem[];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          {items.map((item) => (
            <Link key={item.key} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* Desktop actions. */}
          <LanguageSwitcher className="hidden md:block" />
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-slate-700 hover:text-slate-900 md:inline-block"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/sign-in"
            className="hidden rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 md:inline-block"
          >
            {t("getStarted")}
          </Link>
          {/* Mobile: hamburger -> full-screen menu. */}
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  const columns = t.raw("columns") as FooterColumn[];

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Wordmark className="mb-3 block text-xl font-bold text-white [&_.text-brand-600]:text-brand-500" />
            <p className="max-w-xs text-sm leading-relaxed">
              {t.rich("tagline", {
                studio: (chunks) => <span className="text-slate-300">{chunks}</span>,
              })}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.heading}
              </div>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor href={link.href}>{link.label}</FooterAnchor>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <div>{t("copyright")}</div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded border border-slate-800 px-2 py-1">{t("badgeGdpr")}</span>
            <span className="rounded border border-slate-800 px-2 py-1">{t("badgeRegions")}</span>
            <span className="rounded border border-slate-800 px-2 py-1">{t("badgeSoc2")}</span>
            <Link href="/status" className="rounded border border-slate-800 px-2 py-1 hover:text-white">
              {t("badgeStatus")}
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
