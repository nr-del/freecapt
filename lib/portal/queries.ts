// Server-side data layer for the stakeholder portal (docs/01_mvp_scope.md §5.7).
// A signed-in person sees only their own grants, matched by email against
// stakeholder rows across every company. On first view we lazily link the
// stakeholder to their Account and stamp portalFirstSeenAt (§5.24 dedupe).
import "server-only";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db, schema } from "@/lib/db";

const { accounts, stakeholders, companies, securities } = schema;

export interface PortalUser {
  email: string;
  accountId: string | null;
}

export async function getPortalUser(): Promise<PortalUser | null> {
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

  return { email: user.email, accountId: account?.id ?? null };
}

export interface PortalCompanyHolding {
  companyId: string;
  companyName: string;
  entityType: string;
  jurisdiction: string;
  currency: string;
  stakeholderType: string;
}

// Every company where the signed-in person holds equity, newest first. Links
// matched stakeholders to the Account and marks first-seen, idempotently.
export async function getMyHoldings(): Promise<PortalCompanyHolding[]> {
  const user = await getPortalUser();
  if (!user) return [];

  const rows = await db
    .select({
      stakeholderId: stakeholders.id,
      companyId: companies.id,
      companyName: companies.displayName,
      entityType: companies.entityType,
      jurisdiction: companies.jurisdiction,
      currency: companies.currency,
      stakeholderType: stakeholders.type,
      createdAt: stakeholders.createdAt,
    })
    .from(stakeholders)
    .innerJoin(companies, eq(stakeholders.companyId, companies.id))
    .where(
      and(
        eq(stakeholders.email, user.email),
        isNull(stakeholders.deletedAt),
        isNull(companies.deletedAt),
      ),
    )
    .orderBy(desc(stakeholders.createdAt));

  if (rows.length > 0) {
    const ids = rows.map((r) => r.stakeholderId);
    // COALESCE keeps any existing link/timestamp; only fills the gaps.
    await db
      .update(stakeholders)
      .set({
        accountId: user.accountId
          ? sql`COALESCE(${stakeholders.accountId}, ${user.accountId}::uuid)`
          : stakeholders.accountId,
        portalFirstSeenAt: sql`COALESCE(${stakeholders.portalFirstSeenAt}, now())`,
        updatedAt: new Date(),
      })
      .where(inArray(stakeholders.id, ids));
  }

  // Collapse to one entry per company (a person may have several grants there).
  const seen = new Set<string>();
  const out: PortalCompanyHolding[] = [];
  for (const r of rows) {
    if (seen.has(r.companyId)) continue;
    seen.add(r.companyId);
    out.push({
      companyId: r.companyId,
      companyName: r.companyName,
      entityType: r.entityType,
      jurisdiction: r.jurisdiction,
      currency: r.currency,
      stakeholderType: r.stakeholderType,
    });
  }
  return out;
}

export interface PortalGrant {
  securityId: string;
  category: string;
  subtype: string;
  packVersion: string;
  quantity: string | null;
  monetaryAmount: string | null;
  monetaryCurrency: string | null;
  strikePrice: string | null;
  strikeCurrency: string | null;
  capAmount: string | null;
  discountPercent: string | null;
  shareClass: string | null;
  vestingStartDate: string | null;
  vestingTotalMonths: number | null;
  vestingCliffMonths: number | null;
  vestingFrequency: string | null;
  status: string;
}

export interface PortalCompanyDetail {
  company: {
    id: string;
    displayName: string;
    entityType: string;
    jurisdiction: string;
    currency: string;
    authorizedUnits: string | null;
  };
  stakeholderName: string;
  stakeholderType: string;
  grants: PortalGrant[];
}

// Full detail for one company the signed-in person holds equity in. Returns
// null if they hold nothing there (so the page can 404 / redirect).
export async function getMyCompanyDetail(companyId: string): Promise<PortalCompanyDetail | null> {
  const user = await getPortalUser();
  if (!user) return null;

  const shRows = await db
    .select({
      stakeholderId: stakeholders.id,
      stakeholderName: stakeholders.fullName,
      stakeholderType: stakeholders.type,
      companyId: companies.id,
      displayName: companies.displayName,
      entityType: companies.entityType,
      jurisdiction: companies.jurisdiction,
      currency: companies.currency,
      authorizedUnits: companies.authorizedUnits,
    })
    .from(stakeholders)
    .innerJoin(companies, eq(stakeholders.companyId, companies.id))
    .where(
      and(
        eq(stakeholders.companyId, companyId),
        eq(stakeholders.email, user.email),
        isNull(stakeholders.deletedAt),
        isNull(companies.deletedAt),
      ),
    );

  const first = shRows[0];
  if (!first) return null;

  const stakeholderIds = shRows.map((r) => r.stakeholderId);
  const grants = await db
    .select({
      securityId: securities.id,
      category: securities.category,
      subtype: securities.subtype,
      packVersion: securities.packVersion,
      quantity: securities.quantity,
      monetaryAmount: securities.monetaryAmount,
      monetaryCurrency: securities.monetaryCurrency,
      strikePrice: securities.strikePrice,
      strikeCurrency: securities.strikeCurrency,
      capAmount: securities.capAmount,
      discountPercent: securities.discountPercent,
      shareClass: securities.shareClass,
      vestingStartDate: securities.vestingStartDate,
      vestingTotalMonths: securities.vestingTotalMonths,
      vestingCliffMonths: securities.vestingCliffMonths,
      vestingFrequency: securities.vestingFrequency,
      status: securities.status,
    })
    .from(securities)
    .where(and(inArray(securities.stakeholderId, stakeholderIds), isNull(securities.deletedAt)));

  return {
    company: {
      id: first.companyId,
      displayName: first.displayName,
      entityType: first.entityType,
      jurisdiction: first.jurisdiction,
      currency: first.currency,
      authorizedUnits: first.authorizedUnits,
    },
    stakeholderName: first.stakeholderName,
    stakeholderType: first.stakeholderType,
    grants,
  };
}
