import { type EmailOtpType } from "@supabase/supabase-js";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { accounts, memberships, stakeholders } from "@/lib/db/schema";

export const runtime = "nodejs";

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

// Where to land a freshly signed-in person when the link didn't request a
// specific destination (§5.23/§5.13). A founder/admin (has a membership) goes
// to the product; someone who only holds equity goes to their portfolio.
async function defaultLandingFor(accountId: string, email: string): Promise<string> {
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.accountId, accountId), isNull(memberships.deletedAt)))
    .limit(1);
  if (membership) return "/cap-table";

  const [holding] = await db
    .select({ id: stakeholders.id })
    .from(stakeholders)
    .where(and(eq(stakeholders.email, email), isNull(stakeholders.deletedAt)))
    .limit(1);
  // No company yet and no equity held: a brand-new user — start onboarding.
  return holding ? "/portfolio" : "/onboarding";
}

// Magic-link callback. Prefers the token_hash + verifyOtp flow (no PKCE
// code-verifier cookie needed - robust across browsers and mail-scanner
// prefetching), and falls back to the PKCE ?code= exchange. On success,
// ensures a domain accounts row exists (§2.1) and routes to the right home.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  // An explicit ?next= (e.g. an invite deep-link) always wins over smart routing.
  const explicitNext = searchParams.get("next");

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

  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, userEmail))
    .limit(1);

  if (account) {
    // Accepting an invite: stamp any pending memberships on first sign-in (§5.13).
    await db
      .update(memberships)
      .set({ acceptedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(memberships.accountId, account.id), isNull(memberships.acceptedAt)));
  }

  let destination = explicitNext ?? "/cap-table";
  if (!explicitNext && account) {
    destination = await defaultLandingFor(account.id, userEmail);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
