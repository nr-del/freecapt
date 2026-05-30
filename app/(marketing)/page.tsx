// FreeCapT marketing landing page — faithful React/Tailwind port of
// docs/08_landing_page.html. Copy follows docs/07_brand_package.md; tokens and
// the conic-gradient donut follow docs/12_design_system.md. The product lives
// behind the magic-link auth wall, so every CTA points to /sign-in.
import Link from "next/link";

import { CapTableDonut, Swatch } from "@/components/freecapt/cap-table-donut";

export const metadata = {
  title: "FreeCapT — the free cap table for European founders",
  description:
    "The free cap table for bootstrapped founders, family businesses, and small SaaS. Built for Denmark, Norway, Sweden, Germany, Switzerland, the UK, and US. AI-native. $15/month when you're ready to share.",
};

// Wordmark — the C is brand-600 (docs/07_brand_package.md §1).
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Free<span className="text-brand-600">C</span>apT
    </span>
  );
}

// Hero illustration slices — match the .wf-donut gradient stops in the doc.
const HERO_SLICES = [
  { label: "Anna (Founder)", pct: 30.7, color: "#047857" },
  { label: "Ben (Founder)", pct: 30.7, color: "#10b981" },
  { label: "Chris (Founder)", pct: 18.4, color: "#34d399" },
  { label: "Dana + Erik (Options)", pct: 2.5, color: "#f59e0b" },
  { label: "Frank (SAFE)", pct: 0.9, color: "#fbbf24" },
  { label: "Pool", pct: 12.0, color: "#94a3b8" },
  { label: "Unissued", pct: 4.8, color: "#e2e8f0" },
];

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
  "Full cap table — unlimited stakeholders",
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
  'Ongoing AI chat — "ask your cap table"',
  '"Explain this" buttons on every number',
  "AI-driven bulk add (prompt + document upload)",
  "Rich Excel export — multi-sheet, live formulas, embedded chart",
  "Legal-grade PDF + Word exports — per jurisdiction",
  "Document template generation",
  "Stakeholder portal access for your team",
  "Round modeling — multi-investor allocation",
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
    body: "One-click export of everything — ledger, documents, audit log — as a ZIP. Account deletion within 30 days, full purge under GDPR.",
  },
  {
    icon: "🪄",
    title: "Magic-link only. No passwords.",
    body: "Lower attack surface than password databases. Optional TOTP 2FA for the paranoid. Device-trust prompts on new sign-ins.",
  },
  {
    icon: "🛡️",
    title: "Bug bounty + public security page.",
    body: "Researchers welcome. Status page at status.freecapt.com. Public changelog with every release.",
  },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. The free plan is the full personal cap table — build it, see it, model rounds, export the data, switch between companies if you manage multiple. There are no stakeholder limits, no time limits, no credit card. You pay $15/month only when you want to share with stakeholders, use AI features beyond setup, or generate legal-grade documents.",
  },
  {
    q: "What jurisdictions do you support?",
    a: "Seven at launch: Denmark (ApS + A/S), Norway (AS + ASA), Sweden (AB privat + publikt), Germany (GmbH + AG), Switzerland (AG + GmbH), United Kingdom (Ltd.), and United States Delaware (C-Corp + LLC). Each comes with the local instrument types, validation rules, document templates, and tax-favorable schemes (EMI, § 7P, opsjonsskatteordningen, QESO, ISO, profits interests). More countries are sprint-sized additions.",
  },
  {
    q: "Do I need a lawyer to use FreeCapT?",
    a: "No. FreeCapT is built for founders who don't have a Cooley partner on speed-dial. Onboarding is conversational. Defaults are sensible. The AI explains anything in plain English. You'll still want a lawyer for actual fundraises, tax-scheme elections, and notary appointments — we make those moments cheaper and faster by generating the right document for your lawyer to review.",
  },
  {
    q: "How is this different from Carta?",
    a: "Carta is built for venture-backed US scaleups and prices accordingly — $2,400+/year for a tiny company. It's the right tool for that audience. FreeCapT is built for the 95% of private companies that aren't VC-backed unicorns — bootstrapped founders, family businesses, agencies, small SaaS. We have first-class support for European jurisdictions, AI-native UX, and a free plan that's actually usable.",
  },
  {
    q: "Is my data safe?",
    a: "A cap table is the most sensitive document a private company owns. We treat it that way — AES-256 encryption at rest, TLS 1.3 in transit, per-tenant encryption keys, append-only audit log, GDPR-compliant. EU customers' data is hosted in Frankfurt; US in us-east. SOC 2 Type I attestation is in progress, with Type II following ~12 months later.",
  },
  {
    q: "What about GDPR?",
    a: "EU data stays in the EU (Frankfurt region). DPA available. One-click data export (you own your data). Account deletion triggers a 30-day grace period then full purge. Data subject access requests handled within 30 days. Privacy policy in plain English, not legalese.",
  },
  {
    q: "What languages do you support?",
    a: "UI is available in English, Dansk, Norsk, Svenska, and Deutsch. Language is independent of jurisdiction — a Danish founder running a UK Ltd. can use the Danish UI. Legal-grade exports stay in the jurisdiction's regulatory language (a Danish ejerbog is in Danish; a US capitalization table is in English) regardless of UI preference. French and Italian for Swiss customers are post-launch.",
  },
  {
    q: "Can I import from Carta or another tool?",
    a: "Yes. Export a CSV from Carta, Pulley, or any spreadsheet and paste into our bulk-add screen — columns auto-map. Or upload your formation documents and grant agreements; our AI will extract the entire cap table to a draft you confirm. Either path is typically a 5-minute migration.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 antialiased">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark className="text-xl font-bold tracking-tight" />
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#countries" className="hover:text-slate-900">Countries</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#security" className="hover:text-slate-900">Security</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <select
              aria-label="Language"
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
              defaultValue="EN"
            >
              <option value="EN">🇬🇧 EN</option>
              <option value="DA">🇩🇰 DA</option>
              <option value="NO">🇳🇴 NO</option>
              <option value="SV">🇸🇪 SV</option>
              <option value="DE">🇩🇪 DE</option>
            </select>
            <Link href="/sign-in" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              href="/sign-in"
              className="hidden rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:inline-block"
            >
              Get started — free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative grid-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 md:grid-cols-2 md:pb-32 md:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <span>●</span> Now in private beta — DK · NO · SE · DE · CH · UK · US
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              The free cap table for <span className="text-brand-600">European founders</span>.
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
                Get started — free <span>→</span>
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

          {/* Hero illustration — cap table preview */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Acme ApS · Your cap table</div>
                  <div className="text-lg font-semibold">Who owns Acme today.</div>
                </div>
                <div className="rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                  7 stakeholders
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  <CapTableDonut slices={HERO_SLICES} size={160} />
                </div>
                <div className="flex-1 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span><Swatch color="#047857" />Anna (Founder)</span>
                    <span className="font-medium tabular-nums">30.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span><Swatch color="#10b981" />Ben (Founder)</span>
                    <span className="font-medium tabular-nums">30.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span><Swatch color="#34d399" />Chris (Founder)</span>
                    <span className="font-medium tabular-nums">18.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span><Swatch color="#f59e0b" />Dana + Erik (Options)</span>
                    <span className="font-medium tabular-nums">3.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span><Swatch color="#94a3b8" />Frank (SAFE)</span>
                    <span className="font-medium tabular-nums">~5%</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Pool</span>
                    <span className="tabular-nums">12.0%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm">
                <span className="text-brand-600">✦</span>
                <span className="italic text-slate-500">
                  &ldquo;What if I raise 2M DKK at 8M DKK pre-money?&rdquo;
                </span>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-md">
              🇪🇺 GDPR
            </div>
            <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 shadow-md">
              Free up to forever — for personal use
            </div>
          </div>
        </div>
      </section>

      {/* ── Three value props ───────────────────────────────────── */}
      <section id="features" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
              What you get
            </div>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              Cap tables shouldn&apos;t take a lawyer, a Carta sales call, or a Tuesday.
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
                body: 'Upload your formation docs — AI extracts your cap table in 90 seconds. Ask in plain English: "What if I raise 2M at 8M pre-money?" Click "explain this" on any number. Powered by Claude, in your region.',
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

      {/* ── Country packs ───────────────────────────────────────── */}
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
            jurisdiction — pick what works for you.
          </p>
        </div>
      </section>

      {/* ── Product preview ─────────────────────────────────────── */}
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
                  {screen.paid ? <span className="ml-1 text-brand-700">— {screen.paid}</span> : null}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{screen.title}</h3>
                <p className="text-sm text-slate-600">{screen.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-16 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Two plans. One price.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Carta starts at $2,400/year for a tiny company. We&apos;re $180/year — and only when
              you&apos;re ready.
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
                Get started — free
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

      {/* ── Security / trust ────────────────────────────────────── */}
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

      {/* ── FAQ ─────────────────────────────────────────────────── */}
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
              <details key={item.q} className="group border-b border-slate-200 py-5 [&>summary]:list-none">
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

      {/* ── Final CTA ───────────────────────────────────────────── */}
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

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-10 grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Wordmark className="mb-3 text-xl font-bold text-white [&_.text-brand-600]:text-brand-500" />
              <p className="max-w-xs text-sm leading-relaxed">
                The free cap table for European founders. Built by{" "}
                <span className="text-slate-300">Bifrost Studios</span> in Copenhagen.
              </p>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </div>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#countries" className="hover:text-white">Country packs</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Changelog</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Trust
              </div>
              <ul className="space-y-2 text-sm">
                <li><a href="#security" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Company
              </div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
                <li><a href="mailto:hello@freecapt.com" className="hover:text-white">hello@freecapt.com</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500">
            <div>© 2026 Bifrost Studios. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded border border-slate-800 px-2 py-1">🇪🇺 GDPR</span>
              <span className="rounded border border-slate-800 px-2 py-1">EU + US regions</span>
              <span className="rounded border border-slate-800 px-2 py-1">SOC 2 in progress</span>
              <span className="rounded border border-slate-800 px-2 py-1">Status: ●</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
