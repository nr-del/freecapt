import type { Metadata } from "next";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Changelog - FreeCapT",
  description:
    "What is new in FreeCapT: cap table, stakeholders, country packs, round simulator, AI onboarding, and more.",
  alternates: { canonical: "/changelog" },
};

type Entry = { date: string; tag: string; title: string; items: string[] };

const ENTRIES: Entry[] = [
  {
    date: "May 2026",
    tag: "Marketing",
    title: "New landing page and public site",
    items: [
      "Interactive hero with a live, simplified round simulator.",
      "Comparison pages versus the bigger cap table platforms.",
      "Full company and legal pages: about, contact, press, privacy, terms, status.",
      "Repositioned for founders and small businesses everywhere.",
    ],
  },
  {
    date: "May 2026",
    tag: "AI",
    title: "AI onboarding helper",
    items: [
      "Upload formation documents and FreeCapT extracts your cap table to a draft.",
      "Describe your cap table in plain English and have it parsed into rows.",
      "One free AI onboarding per account.",
    ],
  },
  {
    date: "May 2026",
    tag: "Product",
    title: "Round simulator",
    items: [
      "Model a single priced round and see before/after ownership and per-stakeholder dilution.",
      "SAFEs auto-convert in the projection.",
      "Save scenarios and share a read-only link.",
    ],
  },
  {
    date: "May 2026",
    tag: "Country packs",
    title: "Seven jurisdictions",
    items: [
      "Denmark, Norway, Sweden, Germany, Switzerland, United Kingdom, United States.",
      "Local instruments, registry-number validation, and tax-favorable schemes (EMI, § 7P, opsjonsskatteordningen, QESO, ISO, profits interests).",
    ],
  },
  {
    date: "April 2026",
    tag: "Product",
    title: "Cap table and stakeholders",
    items: [
      "Pure-CSS ownership donut, outstanding/fully-diluted toggle, CSV export.",
      "Bulk add stakeholders by pasting from a spreadsheet.",
      "Magic-link sign-in - no passwords.",
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  Marketing: "bg-brand-50 text-brand-700",
  AI: "bg-amber-100 text-amber-700",
  Product: "bg-slate-100 text-slate-700",
  "Country packs": "bg-brand-50 text-brand-700",
};

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <PageHeader
        kicker="Changelog"
        title="What's new"
        lede="A running log of what we have shipped. We are in private beta, so expect this to move fast."
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ol className="space-y-10">
          {ENTRIES.map((entry, i) => (
            <li key={i} className="relative border-l border-slate-200 pl-6">
              <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <div className="mb-2 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">{entry.date}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    TAG_COLORS[entry.tag] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {entry.tag}
                </span>
              </div>
              <h2 className="mb-2 text-base font-semibold text-slate-900">{entry.title}</h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand-500">·</span> {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </MarketingShell>
  );
}
