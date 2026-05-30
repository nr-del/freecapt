// FreeCapT marketing landing page. Copy follows docs/07_brand_package.md;
// tokens and the conic-gradient donut follow docs/12_design_system.md. The
// product lives behind the magic-link auth wall, so every CTA points to
// /sign-in. The hero card is an interactive, simplified round simulator.
import type { Metadata } from "next";
import Link from "next/link";

import { InteractiveHero } from "@/components/marketing/interactive-hero";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "FreeCapT - the free cap table for founders and small businesses",
  description:
    "The free cap table for bootstrapped founders, family businesses, and small SaaS - anywhere in the world. Local rules for Denmark, Norway, Sweden, Germany, Switzerland, the UK, and US, with more on the way. AI-native. $15/month when you're ready to share.",
  alternates: { canonical: "/" },
};

const COUNTRY_PACKS = [
  { flag: "🇩🇰", name: "Denmark", entity: "ApS · A/S", schemes: "§ 7P · Tegningsoptioner · Ejerbog" },
  { flag: "🇳🇴", name: "Norway", entity: "AS · ASA", schemes: "Opsjonsskatteordningen · Aksjeeierbok" },
  { flag: "🇸🇪", name: "Sweden", entity: "AB privat · publikt", schemes: "QESO · Aktiebok · Teckningsoptioner" },
  { flag: "🇩🇪", name: "Germany", entity: "GmbH · AG", schemes: "VSOP · Notary workflow · § 19a" },
  { flag: "🇨🇭", name: "Switzerland", entity: "AG · GmbH", schemes: "Sperrfrist · Mitarbeiteroptionen" },
  { flag: "🇬🇧", name: "United Kingdom", entity: "Ltd.", schemes: "EMI · Register of Members · ASA" },
  { flag: "🇺🇸", name: "United States", entity: "DE C-Corp · DE LLC", schemes: "ISO · NSO · SAFE · Profits interests" },
];

const SCREENS = [
  {
    kicker: "Cap table",
    title: "Who owns this company today.",
    body: 'Donut chart and table side by side. Outstanding or fully-diluted toggle. As-of-date for historical views. Click "You have 18.5% left to grant" to issue equity.',
  },
  {
    kicker: "Stakeholders",
    title: "Everyone, added in 30 seconds.",
    body: 'Paste from spreadsheet. Or type in plain English: "Anna and Ben at 30% each, Dana has 200k options vested over 4 years." AI parses, you confirm.',
  },
  {
    kicker: "Round modeling",
    paid: "Paid",
    title: "Allocate your raise across real investors.",
    body: "Raising 2M at 8M pre? Drop in your 10 interested investors with their commitment amounts. See who fits, who scales back, what the cap table looks like after.",
  },
  {
    kicker: "Stakeholder portal",
    paid: "Paid",
    title: "Your team sees what they own, in plain English.",
    body: 'Magic-link sign-in (no passwords). Their vesting schedule. AI "explain my grant" button. Angels and advisors with multiple grants get a free portfolio dashboard.',
  },
  {
    kicker: "Documents",
    paid: "Paid for legal-grade",
    title: "Per-jurisdiction templates that lawyers respect.",
    body: "Generate your Danish ejerbog, your German Gesellschafterliste, your UK Register of Members, your US capitalization table for 409A. PDF/A archival format. Word for redlining.",
  },
  {
    kicker: "Simulator",
    title: '"What if I raise 2M at 8M post?"',
    body: "Side-by-side before/after cap tables with per-stakeholder dilution. SAFEs auto-convert. Save scenarios, share read-only links with your cofounders.",
  },
];

const FREE_FEATURES = [
  "Full cap table - unlimited stakeholders",
  "Bulk add via spreadsheet paste",
  "AI onboarding helper (one-time)",
  "Round simulator (single-investor)",
  "Basic CSV export",
  "Cofounders as Admin / Editor / Viewer",
  "Multi-company switcher",
  "All 7 country packs",
  "5 UI languages",
  "Multi-currency, multi-timezone",
  "2FA, audit log, GDPR data export",
  "Magic-link sign-in",
];

const PAID_FEATURES = [
  "Everything in Free",
  'Ongoing AI chat - "ask your cap table"',
  '"Explain this" buttons on every number',
  "AI-driven bulk add (prompt + document upload)",
  "Rich Excel export - multi-sheet, live formulas, embedded chart",
  "Legal-grade PDF + Word exports - per jurisdiction",
  "Document template generation",
  "Stakeholder portal access for your team",
  "Round modeling - multi-investor allocation",
  "Term-sheet draft generation",
];

const SECURITY = [
  {
    icon: "🇪🇺",
    title: "GDPR-compliant. EU and US regions.",
    body: "EU customers' data hosted in Frankfurt; US customers in us-east. Your choice at company creation, immutable thereafter.",
  },
  {
    icon: "🔒",
    title: "AES-256 encrypted. TLS 1.3.",
    body: "Per-tenant encryption keys. SOC 2 Type I attestation in progress (target Q3 2026). ISO 27001 on the roadmap.",
  },
  {
    icon: "📋",
    title: "Append-only audit log.",
    body: "Every state change recorded with actor, IP, before/after. 7-year retention. Tamper-evident replication to immutable storage.",
  },
  {
    icon: "💾",
    title: "Your data is yours.",
    body: "One-click export of everything - ledger, documents, audit log - as a ZIP. Account deletion within 30 days, full purge under GDPR.",
  },
  {
    icon: "🪄",
    title: "Magic-link only. No passwords.",
    body: "Lower attack surface than password databases. Optional TOTP 2FA for the paranoid. Device-trust prompts on new sign-ins.",
  },
  {
    icon: "🛡️",
    title: "Bug bounty + public security page.",
    body: "Researchers welcome. Status page at freecapt.com/status. Public changelog with every release.",
  },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. The free plan is the full personal cap table - build it, see it, model rounds, export the data, switch between companies if you manage multiple. There are no stakeholder limits, no time limits, no credit card. You pay $15/month only when you want to share with stakeholders, use AI features beyond setup, or generate legal-grade documents.",
  },
  {
    q: "What jurisdictions do you support?",
    a: "Seven at launch: Denmark (ApS + A/S), Norway (AS + ASA), Sweden (AB privat + publikt), Germany (GmbH + AG), Switzerland (AG + GmbH), United Kingdom (Ltd.), and United States Delaware (C-Corp + LLC). Each comes with the local instrument types, validation rules, document templates, and tax-favorable schemes (EMI, § 7P, opsjonsskatteordningen, QESO, ISO, profits interests). More countries are sprint-sized additions.",
  },
  {
    q: "Do I need a lawyer to use FreeCapT?",
    a: "No. FreeCapT is built for founders who don't have a Cooley partner on speed-dial. Onboarding is conversational. Defaults are sensible. The AI explains anything in plain English. You'll still want a lawyer for actual fundraises, tax-scheme elections, and notary appointments - we make those moments cheaper and faster by generating the right document for your lawyer to review.",
  },
  {
    q: "How is this different from Carta?",
    a: "Carta is built for venture-backed US scaleups and prices accordingly. It's the right tool for that audience. FreeCapT is built for the rest of us - bootstrapped founders, family businesses, agencies, small SaaS. We have first-class support for the local jurisdictions most tools ignore, AI-native UX, and a free plan that's actually usable. See our full comparison pages for the detail.",
  },
  {
    q: "Is my data safe?",
    a: "A cap table is the most sensitive document a private company owns. We treat it that way - AES-256 encryption at rest, TLS 1.3 in transit, per-tenant encryption keys, append-only audit log, GDPR-compliant. EU customers' data is hosted in Frankfurt; US in us-east. SOC 2 Type I attestation is in progress, with Type II following ~12 months later.",
  },
  {
    q: "What about GDPR?",
    a: "EU data stays in the EU (Frankfurt region). DPA available. One-click data export (you own your data). Account deletion triggers a 30-day grace period then full purge. Data subject access requests handled within 30 days. Privacy policy in plain English, not legalese.",
  },
  {
    q: "What languages do you support?",
    a: "UI is available in English, Dansk, Norsk, Svenska, and Deutsch. Language is independent of jurisdiction - a Danish founder running a UK Ltd. can use the Danish UI. Legal-grade exports stay in the jurisdiction's regulatory language (a Danish ejerbog is in Danish; a US capitalization table is in English) regardless of UI preference. French and Italian for Swiss customers are post-launch.",
  },
  {
    q: "Can I import from Carta or another tool?",
    a: "Yes. Export a CSV from Carta, Pulley, or any spreadsheet and paste into our bulk-add screen - columns auto-map. Or upload your formation documents and grant agreements; our AI will extract the entire cap table to a draft you confirm. Either path is typically a 5-minute migration.",
  },
];

// JSON-LD structured data - helps search engines render rich results for the
// FAQ and understand the product/pricing (docs SEO pass).
const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const PRODUCT_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FreeCapT",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "The free cap table for founders and small businesses. Multi-jurisdiction, AI-native, free for personal cap tables.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    {
      "@type": "Offer",
      name: "Paid",
      price: "15",
      priceCurrency: "USD",
      description: "Per month. Sharing, AI features, and legal-grade documents.",
    },
  ],
  publisher: { "@type": "Organization", name: "Bifrost Studios" },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900 antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSONLD) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative grid-bg">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:pb-32 md:pt-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <span>●</span> Now in private beta - DK · NO · SE · DE · CH · UK · US
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                The free cap table for <span className="text-brand-600">founders everywhere</span>.
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
                Built for bootstrapped startups, family businesses, agencies, and small SaaS. In
                five languages. Under your country&apos;s rules. AI-native.{" "}
                <strong className="text-slate-900">$15/month</strong> when you want to share with
                stakeholders.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-700"
                >
                  Get started - free <span>→</span>
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-slate-700 hover:text-slate-900"
                >
                  See pricing
                </a>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                No credit card. Set up in 15 minutes. Unlimited stakeholders on the free plan.
              </p>
            </div>

            <InteractiveHero />
          </div>
        </section>

        {/* ── Three value props ─────────────────────────────────── */}
        <section id="features" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                What you get
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                Cap tables shouldn&apos;t take a lawyer, a sales call, or a Tuesday.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: "◐",
                  title: "Free for your personal cap table",
                  body: "Build it, see it, model rounds, export the raw data. No stakeholder count limits. No credit card. No asterisks. Pay $15/month only when you want to share with employees, generate legal docs, or use AI features.",
                },
                {
                  icon: "⌖",
                  title: "Built for seven jurisdictions",
                  body: "Danish ApS · Norwegian AS · Swedish AB · German GmbH · Swiss AG · UK Ltd. · US Delaware C-Corp + LLC. Each with its own instruments, templates, and tax-favorable schemes (EMI, § 7P, opsjonsskatteordningen, QESO, ISO, profits interests).",
                },
                {
                  icon: "✦",
                  title: "AI-native, not bolted-on",
                  body: 'Upload your formation docs - AI extracts your cap table in 90 seconds. Ask in plain English: "What if I raise 2M at 8M pre-money?" Click "explain this" on any number. Powered by Claude, in your region.',
                },
              ].map((card) => (
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
                Country packs
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                Free in your country, under your country&apos;s rules.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Every pack ships with the local entity types, instruments, validation, and document
                templates. No US-first hand-waving.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {COUNTRY_PACKS.map((pack) => (
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
                <div className="font-semibold">France · NL · ES · FI · CA</div>
                <div className="mt-0.5 text-xs">Coming as country packs</div>
                <div className="mt-3 text-xs italic">One sprint per new country.</div>
              </div>
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">
              UI available in Dansk · Norsk · Svenska · Deutsch · English. Language is independent of
              jurisdiction - pick what works for you.
            </p>
          </div>
        </section>

        {/* ── Product preview ───────────────────────────────────── */}
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-16 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                The product
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                Six screens. Not thirty.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                FreeCapT is built around one question: who owns this company? Everything else is in
                service of answering that, clearly, in 15 minutes or less.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {SCREENS.map((screen) => (
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
                Pricing
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Two plans. One price.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                $15/month - and only when you&apos;re ready. The free plan is a real, complete cap
                table, not a trial.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">Free</h3>
                  <div className="text-3xl font-bold tabular-nums">$0</div>
                </div>
                <p className="mb-6 text-sm text-slate-500">For your personal cap table. Forever.</p>
                <Link
                  href="/sign-in"
                  className="mb-6 block w-full rounded-md border border-slate-300 py-3 text-center font-medium hover:bg-slate-50"
                >
                  Get started - free
                </Link>
                <ul className="space-y-3 text-sm">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paid */}
              <div className="relative rounded-2xl border border-slate-900 bg-slate-900 p-8 text-white">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  When you&apos;re ready
                </div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">Paid</h3>
                  <div>
                    <span className="text-3xl font-bold tabular-nums">$15</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                </div>
                <p className="mb-6 text-sm text-slate-400">
                  Everything in Free, plus the value moments.
                </p>
                <Link
                  href="/sign-in"
                  className="mb-6 block w-full rounded-md bg-brand-600 py-3 text-center font-medium hover:bg-brand-700"
                >
                  Start paid plan
                </Link>
                <ul className="space-y-3 text-sm">
                  {PAID_FEATURES.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">
              No usage cliffs. No per-stakeholder fees. Cancel in one click; your data stays yours.
            </p>
          </div>
        </section>

        {/* ── Security / trust ──────────────────────────────────── */}
        <section id="security" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-12 text-center">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Security &amp; trust
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                A cap table is the most sensitive document a private company owns.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">We treat it that way.</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              {SECURITY.map((item) => (
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
                Questions, anticipated
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">FAQ</h2>
            </div>
            <div className="space-y-2">
              {FAQ.map((item) => (
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
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
              See your cap table in 15 minutes.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
              No credit card. No sales call. No lawyer. Paste your existing spreadsheet, type it in
              plain English, or upload your formation docs.
            </p>
            <form action="/sign-in" method="get" className="mx-auto mb-4 flex max-w-md gap-3">
              <input
                type="email"
                name="email"
                placeholder="you@yourcompany.com"
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-6 py-3 font-medium hover:bg-brand-700"
              >
                Get started →
              </button>
            </form>
            <p className="text-xs text-slate-500">
              Available in Dansk · Norsk · Svenska · Deutsch · English
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
