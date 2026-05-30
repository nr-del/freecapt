import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

// Next 16 "proxy" convention (formerly middleware). Two jobs, composed:
//   1. next-intl locale routing for the public marketing pages (URL-prefixed
//      locales: /, /da, /no, /sv, /de).
//   2. Supabase session refresh on every request so Server Components see a
//      current session. Per @supabase/ssr Next.js guidance.
// The authenticated product (/cap-table, /stakeholders, /simulate, /settings),
// the share links, and the API are NOT localized, so locale routing is skipped
// for them and the original Supabase-only flow runs unchanged.
const intlMiddleware = createIntlMiddleware(routing);

const NON_LOCALIZED_PREFIXES = [
  "/cap-table",
  "/stakeholders",
  "/simulate",
  "/settings",
  "/share",
  "/api",
  "/monitoring", // Sentry tunnel
  "/sitemap.xml",
  "/robots.txt",
];

function isLocalized(pathname: string): boolean {
  return !NON_LOCALIZED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function attachSupabase(request: NextRequest, response: NextResponse): Promise<unknown> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  return supabase.auth.getUser();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Localized marketing: next-intl owns the response (it may redirect/rewrite to
  // the correct locale). Attach a session refresh onto that response.
  if (isLocalized(pathname)) {
    const response = intlMiddleware(request);
    await attachSupabase(request, response);
    return response;
  }

  // Non-localized (product/share/api): the original Supabase flow, unchanged.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
