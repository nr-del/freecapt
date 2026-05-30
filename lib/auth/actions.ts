"use server";

import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/auth/supabase-server";

// End the current session and bounce to /sign-in. Magic-link auth means there's
// no password to clear — signOut() revokes the Supabase session + clears the
// session cookie (the middleware no longer finds a user on the next request).
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
