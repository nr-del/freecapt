import { and, asc, eq, desc, isNull } from "drizzle-orm";

import { createServerClient } from "@/lib/auth/supabase-server";

import { db, schema } from "./index";

const { accounts, companies, memberships, stakeholders } = schema;

export type ActiveCompany = typeof companies.$inferSelect;

// Resolve the active company for an email: the most-recent active company the
// account is a (non-deleted) member of. Multi-tenant — a person only ever
// resolves a company they belong to. Returns null when they have none yet
// (a brand-new user before onboarding, or a stakeholder-only account).
export async function getCompanyForEmail(email: string): Promise<ActiveCompany | null> {
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);
  if (!account) return null;

  const [row] = await db
    .select({ company: companies })
    .from(memberships)
    .innerJoin(companies, eq(memberships.companyId, companies.id))
    .where(
      and(
        eq(memberships.accountId, account.id),
        isNull(memberships.deletedAt),
        isNull(companies.deletedAt),
        eq(companies.status, "active"),
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(1);
  return row?.company ?? null;
}

// Resolve the active company for the signed-in user. The single entry point the
// product (cap table, stakeholders, simulate, data room, settings, exports) uses
// to scope every query to the viewer's own company.
export async function getActiveCompany(): Promise<ActiveCompany | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return getCompanyForEmail(user.email);
}

// Whether an email holds equity in any company (a stakeholder, distinct from a
// member). Drives onboarding routing: no membership + holds equity ⇒ portal.
export async function emailHoldsEquity(email: string): Promise<boolean> {
  const [holding] = await db
    .select({ id: stakeholders.id })
    .from(stakeholders)
    .where(and(eq(stakeholders.email, email), isNull(stakeholders.deletedAt)))
    .limit(1);
  return Boolean(holding);
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
