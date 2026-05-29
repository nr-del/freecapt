import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/auth/supabase-server";

const NAV = [
  { href: "/cap-table", label: "Cap table" },
  { href: "/stakeholders", label: "Stakeholders" },
  { href: "/settings", label: "Settings" },
];

// Server-side auth wall — CLAUDE.md auth rules. No session ⇒ /sign-in.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-slate-50/50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6">
          <Link href="/cap-table" className="py-3 text-sm font-bold tracking-tight text-slate-900">
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
    </div>
  );
}
