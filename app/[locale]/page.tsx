// FreeCapT marketing landing page. Copy follows docs/07_brand_package.md;
// tokens and the conic-gradient donut follow docs/12_design_system.md. The
// product lives behind the magic-link auth wall, so every CTA points to
// /sign-in. The hero card is an interactive, simplified round simulator. All
// copy is sourced from the message catalog (messages/*.json) via next-intl.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InteractiveHero } from "@/components/marketing/interactive-hero";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("", locale),
  };
}

type ValueCard = { icon: string; title: string; body: string };
type Pack = { flag: string; name: string; entity: string; schemes: string };
type Screen = { kicker: string; paid?: string; title: string; body: string };
type SecurityCard = { icon: string; title: string; body: string };
type Faq = { q: string; a: string };

export default async function LandingPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const valueCards = t.raw("valueProps.cards") as ValueCard[];
  const packs = t.raw("countries.packs") as Pack[];
  const screens = t.raw("product.screens") as Screen[];
  const freeFeatures = t.raw("pricing.freeFeatures") as string[];
  const paidFeatures = t.raw("pricing.paidFeatures") as string[];
  const securityCards = t.raw("security.cards") as SecurityCard[];
  const faqItems = t.raw("faq.items") as Faq[];

  const signInAction = locale === routing.defaultLocale ? "/sign-in" : `/${locale}/sign-in`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FreeCapT",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t("meta.description"),
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Paid", price: "15", priceCurrency: "USD" },
    ],
    publisher: { "@type": "Organization", name: "Bifrost Studios" },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900 antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative grid-bg">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:pb-32 md:pt-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <span>●</span> {t("hero.badge")}
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                {t("hero.titleBefore")}
                <span className="text-brand-600">{t("hero.titleHighlight")}</span>.
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
                {t.rich("hero.lede", {
                  strong: (chunks) => <strong className="text-slate-900">{chunks}</strong>,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-700"
                >
                  {t("hero.ctaPrimary")} <span>→</span>
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-slate-700 hover:text-slate-900"
                >
                  {t("hero.ctaSecondary")}
                </a>
              </div>
              <p className="mt-6 text-xs text-slate-500">{t("hero.fineprint")}</p>
            </div>

            <InteractiveHero />
          </div>
        </section>

        {/* ── Three value props ─────────────────────────────────── */}
        <section id="features" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("valueProps.kicker")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                {t("valueProps.heading")}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {valueCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-7">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl text-brand-600">
                    {card.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Country packs ─────────────────────────────────────── */}
        <section id="countries" className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("countries.kicker")}
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                {t("countries.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">{t("countries.lede")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {packs.map((pack) => (
                <div
                  key={pack.name}
                  className="rounded-lg border border-slate-200 p-5 transition hover:border-brand-300"
                >
                  <div className="mb-2 text-2xl">{pack.flag}</div>
                  <div className="font-semibold">{pack.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{pack.entity}</div>
                  <div className="mt-3 text-xs text-brand-700">{pack.schemes}</div>
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-slate-500">
                <div className="mb-2 text-2xl opacity-50">➕</div>
                <div className="font-semibold">{t("countries.soonName")}</div>
                <div className="mt-0.5 text-xs">{t("countries.soonLabel")}</div>
                <div className="mt-3 text-xs italic">{t("countries.soonNote")}</div>
              </div>
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">{t("countries.languagesNote")}</p>
          </div>
        </section>

        {/* ── Product preview ───────────────────────────────────── */}
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("product.kicker")}
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                {t("product.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">{t("product.lede")}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {screens.map((screen) => (
                <div key={screen.title} className="rounded-xl border border-slate-200 bg-white p-7">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {screen.kicker}
                    {screen.paid ? <span className="ml-1 text-brand-700">- {screen.paid}</span> : null}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{screen.title}</h3>
                  <p className="text-sm text-slate-600">{screen.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section id="pricing" className="border-t border-slate-200">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("pricing.kicker")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("pricing.heading")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">{t("pricing.lede")}</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">{t("pricing.freeName")}</h3>
                  <div className="text-3xl font-bold tabular-nums">{t("pricing.freePrice")}</div>
                </div>
                <p className="mb-6 text-sm text-slate-500">{t("pricing.freeTagline")}</p>
                <Link
                  href="/sign-in"
                  className="mb-6 block w-full rounded-md border border-slate-300 py-3 text-center font-medium hover:bg-slate-50"
                >
                  {t("pricing.freeCta")}
                </Link>
                <ul className="space-y-3 text-sm">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paid */}
              <div className="relative rounded-2xl border border-slate-900 bg-slate-900 p-8 text-white">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {t("pricing.paidBadge")}
                </div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">{t("pricing.paidName")}</h3>
                  <div>
                    <span className="text-3xl font-bold tabular-nums">{t("pricing.paidPrice")}</span>
                    <span className="text-sm text-slate-400">{t("pricing.paidPer")}</span>
                  </div>
                </div>
                <p className="mb-6 text-sm text-slate-400">{t("pricing.paidTagline")}</p>
                <Link
                  href="/sign-in"
                  className="mb-6 block w-full rounded-md bg-brand-600 py-3 text-center font-medium hover:bg-brand-700"
                >
                  {t("pricing.paidCta")}
                </Link>
                <ul className="space-y-3 text-sm">
                  {paidFeatures.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">{t("pricing.footnote")}</p>
          </div>
        </section>

        {/* ── Security / trust ──────────────────────────────────── */}
        <section id="security" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-12 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("security.kicker")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                {t("security.heading")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">{t("security.lede")}</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              {securityCards.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-5"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-6 py-24">
            <div className="mb-12 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                {t("faq.kicker")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("faq.heading")}</h2>
            </div>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group border-b border-slate-200 py-5 [&>summary]:list-none"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    <span>{item.q}</span>
                    <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section id="cta" className="border-t border-slate-200 bg-slate-900 text-white">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">{t("cta.heading")}</h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">{t("cta.lede")}</p>
            <form
              action={signInAction}
              method="get"
              className="mx-auto mb-4 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                name="email"
                placeholder={t("cta.emailPlaceholder")}
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-6 py-3 font-medium hover:bg-brand-700"
              >
                {t("cta.submit")}
              </button>
            </form>
            <p className="text-xs text-slate-500">{t("cta.languages")}</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
