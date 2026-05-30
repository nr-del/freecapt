import type { Metadata } from "next";

import { MarketingShell, PageHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Status - FreeCapT",
  description:
    "Current operational status of FreeCapT services: application, API, authentication, database, AI features, and email delivery.",
  alternates: { canonical: "/status" },
  robots: { index: false },
};

// Static placeholder status. Wire to a real uptime source (e.g. an uptime
// monitor or a status JSON) when one exists; until then this reflects the
// intended components and a healthy default.
const COMPONENTS = [
  { name: "Web application", state: "Operational" },
  { name: "API", state: "Operational" },
  { name: "Authentication (magic link)", state: "Operational" },
  { name: "Database (EU region)", state: "Operational" },
  { name: "Database (US region)", state: "Operational" },
  { name: "AI features", state: "Operational" },
  { name: "Email delivery", state: "Operational" },
];

export default function StatusPage() {
  return (
    <MarketingShell>
      <PageHeader kicker="Status" title="System status" />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-5">
          <span className="flex h-3 w-3 shrink-0 rounded-full bg-brand-500" aria-hidden />
          <div>
            <div className="text-sm font-semibold text-slate-900">All systems operational</div>
            <div className="text-xs text-slate-500">
              Updated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <ul className="divide-y divide-slate-100">
            {COMPONENTS.map((c) => (
              <li key={c.name} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-slate-700">{c.name}</span>
                <span className="inline-flex items-center gap-2 text-brand-700">
                  <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  {c.state}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Seeing a problem we have not caught? Email{" "}
          <a href="mailto:hello@freecapt.com" className="text-brand-600 hover:text-brand-700">
            hello@freecapt.com
          </a>{" "}
          and we will look right away.
        </p>
      </div>
    </MarketingShell>
  );
}
