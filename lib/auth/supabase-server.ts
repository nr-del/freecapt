import { createServerClient as ssrCreateServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase Auth client for Server Components and Route Handlers.
// Reads/writes the session cookie. Writes are no-ops in Server Components
// (the middleware refreshes the session cookie instead).
export async function createServerClient() {
  const cookieStore = await cookies();
  return ssrCreateServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Read-only cookies in a Server Component; middleware handles refresh.
          }
        },
      },
    },
  );
}
