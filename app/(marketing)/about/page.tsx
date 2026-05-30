import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "About FreeCapT - built by Bifrost Studios in Copenhagen",
  description:
    "Why we built a free, multi-jurisdiction, AI-native cap table for founders and small businesses everywhere. Made by Bifrost Studios in Copenhagen.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Free should mean free",
    body: "The personal cap table is free forever - unlimited stakeholders, no time limit, no credit card. You pay $15/month only when you want to share, use AI, or generate legal-grade documents.",
  },
  {
    title: "Your country, your rules",
    body: "Most tools are US-first and bolt the rest of the world on later. We build country packs - real instruments, registries, and tax schemes - for each jurisdiction we support.",
  },
  {
    title: "Plain language over jargon",
    body: "A cap table is the most important document a private company owns. It should be legible to the founder who owns it, not just the lawyer who drafted it.",
  },
  {
    title: "Your data is yours",
    body: "One-click export of everything. Magic-link sign-in, no passwords. GDPR-grade handling, EU and US regions. No third-party trackers.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHeader
        kicker="About"
        title="A free cap table for the other 95%"
        lede="Most companies are not venture-backed unicorns. They are bootstrapped startups, family businesses, agencies, and small SaaS - and they deserve a cap table that is free, legible, and built for their country."
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose-sm space-y-5 text-slate-600">
          <p>
            FreeCapT started with a simple frustration: the tools for tracking who owns a company
            are priced for venture-backed US scaleups, and they treat every other kind of business
            as an afterthought. If you run a Danish ApS, a German GmbH, or a UK Ltd., you either pay
            for software that does not understand your jurisdiction, or you keep your cap table in a
            spreadsheet and hope it stays correct.
          </p>
          <p>
            We think that is backwards. The vast majority of private companies are not chasing a
            Series C. They are founders, families, and small teams who need to know - clearly and
            confidently - who owns what. So we built a cap table that is free for personal use,
            speaks five languages, understands seven jurisdictions, and uses AI to make setup take
            minutes instead of an afternoon with a lawyer.
          </p>
          <p>
            We charge $15/month when you are ready to share with stakeholders, use AI beyond initial
            setup, or generate legal-grade documents. That is the whole business model. No
            per-seat creep, no usage cliffs, no sales calls.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-2 text-sm font-semibold text-slate-900">{v.title}</div>
              <p className="text-sm text-slate-600">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Who builds it</h2>
          <p className="text-sm text-slate-600">
            FreeCapT is built by <span className="font-medium text-slate-900">Bifrost Studios</span>,
            a small software studio in Copenhagen, Denmark. We are a focused team that cares about
            craft, privacy, and pricing that respects the people who use our products.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get started - free
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
