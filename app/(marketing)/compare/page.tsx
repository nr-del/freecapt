import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Compare FreeCapT - free cap table vs Carta and Pulley",
  description:
    "See how FreeCapT compares to the bigger cap table platforms. Free for personal cap tables, multi-jurisdiction, AI-native, $15/month to share.",
  alternates: { canonical: "/compare" },
};

const COMPARISONS = [
  {
    name: "Carta",
    href: "/compare/carta",
    blurb:
      "The market-leading US equity platform for venture-backed companies. See where a free, multi-jurisdiction tool fits instead.",
  },
  {
    name: "Pulley",
    href: "/compare/pulley",
    blurb:
      "A modern cap table tool for US startups. See how FreeCapT compares on pricing, jurisdictions, and AI.",
  },
];

export default function CompareIndex() {
  return (
    <MarketingShell>
      <PageHeader
        kicker="Comparison"
        title="How FreeCapT compares"
        lede="Honest, factual comparisons against the bigger systems. We will tell you when they are the better pick - and when a free, multi-jurisdiction, AI-native cap table is the smarter call."
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {COMPARISONS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-xl border border-slate-200 bg-white p-7 transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="mb-2 text-lg font-semibold">
                FreeCapT vs <span className="text-brand-700">{c.name}</span>
              </div>
              <p className="mb-4 text-sm text-slate-600">{c.blurb}</p>
              <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700">
                Read the comparison →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
