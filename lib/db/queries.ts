import { and, asc, eq, desc, isNull } from "drizzle-orm";

import { createServerClient } from "@/lib/auth/supabase-server";

import { db, schema } from "./index";

const { accounts, companies, memberships } = schema;

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

export interface CompanyMember {
  membershipId: string;
  accountId: string;
  email: string;
  fullName: string | null;
  role: string;
  invitedAt: Date | null;
  acceptedAt: Date | null;
}

// Everyone who can access a company's cap table (§5.13). An invite that hasn't
// been accepted yet has acceptedAt = null. Sorted accepted-first, then by email.
export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  return db
    .select({
      membershipId: memberships.id,
      accountId: accounts.id,
      email: accounts.email,
      fullName: accounts.fullName,
      role: memberships.role,
      invitedAt: memberships.invitedAt,
      acceptedAt: memberships.acceptedAt,
    })
    .from(memberships)
    .innerJoin(accounts, eq(memberships.accountId, accounts.id))
    .where(and(eq(memberships.companyId, companyId), isNull(memberships.deletedAt)))
    .orderBy(desc(memberships.acceptedAt), asc(accounts.email));
}
