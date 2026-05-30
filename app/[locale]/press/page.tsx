import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Press & media - FreeCapT",
  description:
    "Press kit, boilerplate, facts, and media contact for FreeCapT, the free cap table for founders and small businesses. Built by Bifrost Studios in Copenhagen.",
  alternates: { canonical: "/press" },
};

const FACTS = [
  { label: "Product", value: "FreeCapT - a free, multi-jurisdiction, AI-native cap table" },
  { label: "Operated by", value: "Bifrost Studios, Copenhagen, Denmark" },
  { label: "Pricing", value: "Free for personal cap tables; $15/month to share, use AI, or export legal documents" },
  { label: "Jurisdictions", value: "Denmark, Norway, Sweden, Germany, Switzerland, United Kingdom, United States" },
  { label: "Languages", value: "English, Dansk, Norsk, Svenska, Deutsch" },
  { label: "Stage", value: "Private beta (2026)" },
];

export default function PressPage() {
  return (
    <MarketingShell>
      <PageHeader
        kicker="Press"
        title="Press & media"
        lede="Everything you need to write about FreeCapT. For interviews or anything not covered here, email press@freecapt.com."
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Boilerplate */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Boilerplate</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-600">
            <p>
              FreeCapT is the free cap table for founders and small businesses. Built by Bifrost
              Studios in Copenhagen, it gives bootstrapped startups, family businesses, agencies, and
              small SaaS a complete cap table - free for personal use, in five languages, under the
              rules of seven jurisdictions. AI handles setup in minutes: upload your formation
              documents and FreeCapT extracts your cap table, or describe it in plain English.
              FreeCapT charges $15/month only when you want to share with stakeholders, use AI beyond
              setup, or generate legal-grade documents.
            </p>
          </div>
        </section>

        {/* Fast facts */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Fast facts</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <dl className="divide-y divide-slate-100">
              {FACTS.map((f) => (
                <div key={f.label} className="flex gap-4 px-5 py-3 text-sm">
                  <dt className="w-32 shrink-0 font-medium text-slate-500">{f.label}</dt>
                  <dd className="text-slate-700">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Assets */}
        <section className="mb-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Brand assets</h2>
          <p className="mb-4 text-sm text-slate-600">
            The FreeCapT wordmark is &ldquo;FreeCapT&rdquo; with a capital C set in emerald
            (#059669). Please do not alter the colours or proportions. A full logo pack (SVG/PNG, on
            light and dark) is available on request.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-2xl font-bold tracking-tight text-slate-900">
              Free<span className="text-brand-600">C</span>apT
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-2xl font-bold tracking-tight text-white">
              Free<span className="text-brand-500">C</span>apT
            </div>
            <a
              href="mailto:press@freecapt.com?subject=FreeCapT%20logo%20pack"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Request the logo pack →
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Media contact</h2>
          <p className="text-sm text-slate-600">
            Email{" "}
            <a href="mailto:press@freecapt.com" className="text-brand-600 hover:text-brand-700">
              press@freecapt.com
            </a>{" "}
            for interviews, quotes, or anything you need. You can also{" "}
            <Link href="/contact" className="text-brand-600 hover:text-brand-700">
              reach the wider team
            </Link>
            .
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
