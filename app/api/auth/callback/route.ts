import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

export const runtime = "nodejs";

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

// Magic-link callback: exchange the code for a session, ensure a domain
// accounts row exists for this email (§2.1), then land on the cap table.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cap-table";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const fullName =
    typeof data.user.user_metadata?.full_name === "string"
      ? data.user.user_metadata.full_name
      : null;

  await db
    .insert(accounts)
    .values({
      email: data.user.email,
      fullName,
      referralCode: generateReferralCode(),
    })
    .onConflictDoNothing({ target: accounts.email });

  return NextResponse.redirect(`${origin}${next}`);
}
