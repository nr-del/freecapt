import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AiHelperLauncher } from "@/components/freecapt/ai-helper-launcher";
import { Toaster } from "@/components/ui/sonner";
import { createServerClient } from "@/lib/auth/supabase-server";
import { emailHoldsEquity, getCompanyForEmail } from "@/lib/db/queries";
import { fontVars } from "@/lib/fonts";

const NAV = [
  { href: "/cap-table", label: "Cap table" },
  { href: "/stakeholders", label: "Stakeholders" },
  { href: "/simulate", label: "Simulate" },
  { href: "/data-room", label: "Data room" },
  { href: "/settings", label: "Settings" },
];

// Server-side auth wall - CLAUDE.md auth rules. No session ⇒ /sign-in.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/sign-in");
  }

  // First-run gate: the product is unusable without a company. A signed-in user
  // who isn't a member of one is either brand-new (→ onboarding) or only holds
  // equity elsewhere as a stakeholder (→ their portfolio).
  const company = await getCompanyForEmail(user.email);
  if (!company) {
    redirect((await emailHoldsEquity(user.email)) ? "/portfolio" : "/onboarding");
  }

  // The product is English-only (not localized); it renders its own <html>/
  // <body> because the root layout is a pass-through.
  return (
    <html lang="en" className={fontVars}>
      <body>
        <div className="min-h-dvh bg-slate-50/50">
          <nav className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center gap-6 px-6">
              <Link
                href="/cap-table"
                className="py-3 text-sm font-bold tracking-tight text-slate-900"
              >
                Free<span className="text-brand-600">C</span>apT
              </Link>
              <div className="flex items-center gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
          {children}
          <AiHelperLauncher />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
