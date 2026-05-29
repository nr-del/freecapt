import { and, desc, eq, isNull } from "drizzle-orm";

import { createServerClient } from "@/lib/auth/supabase-server";

import { db, schema } from "./index";

const { accounts, companies } = schema;

export type ActiveCompany = typeof companies.$inferSelect;

// Resolve the company the current build operates on. Until full
// membership/company wiring lands (later prompt), this is the seeded Acme demo —
// the most recently created one, so `pnpm db:seed dk` swaps the active company
// to the Danish ApS variant (both share displayName "Acme").
export async function getActiveCompany(): Promise<ActiveCompany | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.displayName, "Acme"), isNull(companies.deletedAt)))
    .orderBy(desc(companies.createdAt))
    .limit(1);
  return company ?? null;
}

// The domain account id for the signed-in Supabase user, for audit columns.
// Returns null if there's no session or no matching accounts row.
export async function getCurrentAccountId(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, user.email))
    .limit(1);
  return account?.id ?? null;
}
