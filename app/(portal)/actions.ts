"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/auth/supabase-server";

// Sign out of the magic-link session and return to the sign-in page. Used by
// the portal chrome; safe to reuse from the app surface later.
export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
