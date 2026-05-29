import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

export const runtime = "nodejs";

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

// Magic-link callback. Prefers the token_hash + verifyOtp flow (no PKCE
// code-verifier cookie needed — robust across browsers and mail-scanner
// prefetching), and falls back to the PKCE ?code= exchange. On success,
// ensures a domain accounts row exists (§2.1) and lands on the cap table.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cap-table";

  const supabase = await createServerClient();

  let userEmail: string | null = null;
  let fullName: string | null = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error || !data.user?.email) {
      console.error("[auth/callback] verifyOtp failed:", error?.message);
      return NextResponse.redirect(
        `${origin}/sign-in?error=auth&reason=${encodeURIComponent(error?.message ?? "no_user")}`,
      );
    }
    userEmail = data.user.email;
    if (typeof data.user.user_metadata?.full_name === "string") {
      fullName = data.user.user_metadata.full_name;
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error?.message);
      return NextResponse.redirect(
        `${origin}/sign-in?error=auth&reason=${encodeURIComponent(error?.message ?? "no_user")}`,
      );
    }
    userEmail = data.user.email;
    if (typeof data.user.user_metadata?.full_name === "string") {
      fullName = data.user.user_metadata.full_name;
    }
  } else {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_token`);
  }

  await db
    .insert(accounts)
    .values({ email: userEmail, fullName, referralCode: generateReferralCode() })
    .onConflictDoNothing({ target: accounts.email });

  return NextResponse.redirect(`${origin}${next}`);
}
