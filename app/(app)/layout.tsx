import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/auth/supabase-server";

// Server-side auth wall — CLAUDE.md auth rules. No session ⇒ /sign-in.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <div className="min-h-dvh">{children}</div>;
}
