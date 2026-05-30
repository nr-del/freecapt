import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { fontVars } from "@/lib/fonts";

export const metadata = {
  title: "Set up your company · FreeCapT",
};

// Minimal chrome for the first-run flow — no product nav (there's no company to
// navigate yet). Renders its own <html>/<body> because the root layout is a
// pass-through and this route sits outside the (app) and [locale] groups.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <div className="min-h-dvh bg-slate-50/50">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
