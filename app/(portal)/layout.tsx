import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/auth/supabase-server";
import { fontVars } from "@/lib/fonts";

import { signOut } from "./actions";

// The stakeholder portal (docs/01_mvp_scope.md §5.7) is its own surface, NOT
// the founder product: minimal chrome, no admin nav, no company-wide data.
// Own <html>/<body> because the root layout is a pass-through. English-only.
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <html lang="en" className={fontVars}>
      <body>
        <div className="flex min-h-dvh flex-col bg-slate-50/50">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
              <Link
                href="/portfolio"
                className="text-sm font-bold tracking-tight text-slate-900"
              >
                Free<span className="text-brand-600">C</span>apT
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-slate-500 transition-colors hover:text-slate-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>

          {/* §5.14 viral loop: a single, unobtrusive demand-gen line. */}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-slate-400">
              <span>Your equity, in plain English.</span>
              <Link href="/sign-in" className="text-brand-600 hover:text-brand-700">
                Manage your own cap table for free →
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
