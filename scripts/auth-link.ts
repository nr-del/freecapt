// Dev-only: mint a sign-in link without sending email (bypasses the email
// rate limit). Uses the service-role key + admin.generateLink, then prints a
// localhost callback URL that exercises the real token_hash verifyOtp flow.
//
//   pnpm auth:link you@example.com
//
// Open the printed URL in a browser to land on /cap-table.
import { createClient, type GenerateLinkType } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email) {
  console.error("Usage: pnpm auth:link <email>");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function generate(type: GenerateLinkType) {
  return supabase.auth.admin.generateLink({ type, email: email! } as never);
}

async function main() {
  // Existing user → magiclink. If the user doesn't exist yet, fall back to signup.
  let res = await generate("magiclink");
  if (res.error) res = await generate("signup");
  if (res.error || !res.data.properties) {
    console.error("generateLink failed:", res.error?.message);
    process.exit(1);
  }

  const { hashed_token, verification_type } = res.data.properties;
  const callback = `http://localhost:3000/api/auth/callback?token_hash=${hashed_token}&type=${verification_type}`;
  console.log("\nOpen this in your browser to sign in:\n");
  console.log(callback + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
