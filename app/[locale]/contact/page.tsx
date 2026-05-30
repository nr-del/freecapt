import type { Metadata } from "next";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Contact FreeCapT - support, sales, privacy, and security",
  description:
    "Get in touch with FreeCapT. Support, general enquiries, privacy/GDPR requests, and security disclosures. Built by Bifrost Studios in Copenhagen.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  {
    icon: "✉️",
    title: "General & support",
    body: "Questions, feedback, or help with your cap table. We aim to reply within one business day.",
    email: "hello@freecapt.com",
  },
  {
    icon: "🔐",
    title: "Privacy & GDPR",
    body: "Data subject access requests, data export, deletion, or DPA enquiries.",
    email: "privacy@freecapt.com",
  },
  {
    icon: "🛡️",
    title: "Security",
    body: "Responsible disclosure of a vulnerability. PGP available on request.",
    email: "security@freecapt.com",
  },
  {
    icon: "📰",
    title: "Press",
    body: "Media enquiries, interviews, and our press kit.",
    email: "press@freecapt.com",
  },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHeader
        kicker="Contact"
        title="Talk to us"
        lede="We are a small team and we read everything. Pick the right inbox below and we will get back to you."
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <div key={c.email} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 text-2xl">{c.icon}</div>
              <div className="mb-1 text-sm font-semibold text-slate-900">{c.title}</div>
              <p className="mb-3 text-sm text-slate-600">{c.body}</p>
              <a
                href={`mailto:${c.email}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                {c.email}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Company details</h2>
          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">Operated by</dt>
              <dd>Bifrost Studios</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">Based in</dt>
              <dd>Copenhagen, Denmark</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">Email</dt>
              <dd>
                <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
                  hello@freecapt.com
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-medium text-slate-500">Status</dt>
              <dd>
                <a href="/status" className="text-brand-600 hover:text-brand-700">
                  freecapt.com/status
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </MarketingShell>
  );
}
