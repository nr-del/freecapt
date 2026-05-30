import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

const { securities, shareClasses } = schema;

export interface ShareClassRow {
  id: string;
  name: string;
  seniority: number;
  isPreferred: boolean;
  liquidationPreferenceMultiple: string | null;
  participating: boolean;
  votesPerShare: string | null;
  notes: string | null;
  // How many live securities reference this class by name (for "in use" UI).
  inUse: number;
}

// All defined classes for a company, most senior first then alphabetical, with
// a count of how many live securities reference each one by name. Common (or any
// class with no explicit rows) shows inUse = 0.
export async function getShareClasses(companyId: string): Promise<ShareClassRow[]> {
  const classes = await db
    .select()
    .from(shareClasses)
    .where(and(eq(shareClasses.companyId, companyId), isNull(shareClasses.deletedAt)))
    .orderBy(desc(shareClasses.seniority), asc(shareClasses.name));

  // Usage counts keyed by lower(name) so display casing doesn't matter.
  const usage = await db
    .select({
      name: sql<string>`lower(${securities.shareClass})`,
      n: sql<number>`count(*)::int`,
    })
    .from(securities)
    .where(
      and(
        eq(securities.companyId, companyId),
        isNull(securities.deletedAt),
        sql`${securities.shareClass} IS NOT NULL`,
      ),
    )
    .groupBy(sql`lower(${securities.shareClass})`);
  const usageMap = new Map(usage.map((u) => [u.name, Number(u.n)]));

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    seniority: c.seniority,
    isPreferred: c.isPreferred,
    liquidationPreferenceMultiple: c.liquidationPreferenceMultiple,
    participating: c.participating,
    votesPerShare: c.votesPerShare,
    notes: c.notes,
    inUse: usageMap.get(c.name.toLowerCase()) ?? 0,
  }));
}

// Distinct class names a company actually uses on equity securities — the union
// of the managed catalog and any names that appear on securities but were never
// formally defined (e.g. legacy/imported rows). Drives the class picker so a
// founder never has to retype an existing class.
export async function getShareClassNames(companyId: string): Promise<string[]> {
  const [defined, used] = await Promise.all([
    db
      .select({ name: shareClasses.name })
      .from(shareClasses)
      .where(and(eq(shareClasses.companyId, companyId), isNull(shareClasses.deletedAt))),
    db
      .selectDistinct({ name: securities.shareClass })
      .from(securities)
      .where(
        and(
          eq(securities.companyId, companyId),
          isNull(securities.deletedAt),
          sql`${securities.shareClass} IS NOT NULL AND ${securities.shareClass} <> ''`,
        ),
      ),
  ]);

  const byLower = new Map<string, string>();
  for (const r of [...defined, ...used]) {
    const name = (r.name ?? "").trim();
    if (name && !byLower.has(name.toLowerCase())) byLower.set(name.toLowerCase(), name);
  }
  return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
}

// Idempotently make sure each of `names` exists in the catalog for the company.
// Used by the add/import flows so referencing a class name also registers it for
// management. Best-effort, case-insensitive on the unique (company, lower(name))
// index; never throws on a duplicate.
export async function ensureShareClasses(
  companyId: string,
  names: Iterable<string>,
  accountId: string | null,
): Promise<void> {
  const clean = new Map<string, string>();
  for (const raw of names) {
    const name = (raw ?? "").trim();
    if (name) clean.set(name.toLowerCase(), name);
  }
  if (clean.size === 0) return;

  await db
    .insert(shareClasses)
    .values(
      Array.from(clean.values(), (name) => ({
        companyId,
        name,
        createdByAccountId: accountId,
        updatedByAccountId: accountId,
      })),
    )
    .onConflictDoNothing();
}
