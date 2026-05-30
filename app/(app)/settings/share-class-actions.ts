"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";

const { securities, shareClasses } = schema;

export type ShareClassResult = { ok: true } | { ok: false; error: string };

export interface ShareClassInput {
  name: string;
  seniority?: number;
  isPreferred?: boolean;
  liquidationPreferenceMultiple?: number | null;
  participating?: boolean;
  votesPerShare?: number | null;
}

function clean(input: ShareClassInput) {
  const name = input.name.trim();
  return {
    name,
    seniority: Number.isFinite(input.seniority) ? Math.trunc(input.seniority as number) : 0,
    isPreferred: Boolean(input.isPreferred),
    liquidationPreferenceMultiple:
      input.liquidationPreferenceMultiple != null && Number.isFinite(input.liquidationPreferenceMultiple)
        ? String(input.liquidationPreferenceMultiple)
        : null,
    participating: Boolean(input.participating),
    votesPerShare:
      input.votesPerShare != null && Number.isFinite(input.votesPerShare)
        ? String(input.votesPerShare)
        : null,
  };
}

function revalidate() {
  revalidatePath("/settings");
  revalidatePath("/cap-table");
  revalidatePath("/stakeholders");
}

// Add a new managed share class. Names are unique per company (case-insensitive).
export async function createShareClass(input: ShareClassInput): Promise<ShareClassResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Give the class a name." };
  const accountId = await getCurrentAccountId();

  // Reject a duplicate up front for a friendly message (the unique index is the
  // real guard).
  const [dupe] = await db
    .select({ id: shareClasses.id })
    .from(shareClasses)
    .where(
      and(
        eq(shareClasses.companyId, company.id),
        isNull(shareClasses.deletedAt),
        sql`lower(${shareClasses.name}) = ${data.name.toLowerCase()}`,
      ),
    )
    .limit(1);
  if (dupe) return { ok: false, error: "A class with that name already exists." };

  try {
    await db.insert(shareClasses).values({
      companyId: company.id,
      ...data,
      createdByAccountId: accountId,
      updatedByAccountId: accountId,
    });
  } catch (err) {
    console.error("[createShareClass] failed:", err);
    return { ok: false, error: "Couldn't add that class. Please try again." };
  }

  revalidate();
  return { ok: true };
}

// Edit a managed class. Renaming also re-points the securities that referenced
// the old name so the cap table stays consistent.
export async function updateShareClass(id: string, input: ShareClassInput): Promise<ShareClassResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Give the class a name." };
  const accountId = await getCurrentAccountId();

  try {
    const [existing] = await db
      .select({ name: shareClasses.name })
      .from(shareClasses)
      .where(
        and(eq(shareClasses.id, id), eq(shareClasses.companyId, company.id), isNull(shareClasses.deletedAt)),
      )
      .limit(1);
    if (!existing) return { ok: false, error: "That class wasn't found." };

    const renamed = existing.name.toLowerCase() !== data.name.toLowerCase();
    if (renamed) {
      const [dupe] = await db
        .select({ id: shareClasses.id })
        .from(shareClasses)
        .where(
          and(
            eq(shareClasses.companyId, company.id),
            isNull(shareClasses.deletedAt),
            sql`lower(${shareClasses.name}) = ${data.name.toLowerCase()}`,
          ),
        )
        .limit(1);
      if (dupe) return { ok: false, error: "A class with that name already exists." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(shareClasses)
        .set({ ...data, updatedByAccountId: accountId, updatedAt: new Date() })
        .where(eq(shareClasses.id, id));
      if (renamed) {
        await tx
          .update(securities)
          .set({ shareClass: data.name, updatedAt: new Date() })
          .where(
            and(
              eq(securities.companyId, company.id),
              isNull(securities.deletedAt),
              sql`lower(${securities.shareClass}) = ${existing.name.toLowerCase()}`,
            ),
          );
      }
    });
  } catch (err) {
    console.error("[updateShareClass] failed:", err);
    return { ok: false, error: "Couldn't update that class. Please try again." };
  }

  revalidate();
  return { ok: true };
}

// Remove a managed class. Blocked while any live security still references it —
// reassign those grants first.
export async function deleteShareClass(id: string): Promise<ShareClassResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  try {
    const [existing] = await db
      .select({ name: shareClasses.name })
      .from(shareClasses)
      .where(
        and(eq(shareClasses.id, id), eq(shareClasses.companyId, company.id), isNull(shareClasses.deletedAt)),
      )
      .limit(1);
    if (!existing) return { ok: false, error: "That class wasn't found." };

    const [used] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(securities)
      .where(
        and(
          eq(securities.companyId, company.id),
          isNull(securities.deletedAt),
          sql`lower(${securities.shareClass}) = ${existing.name.toLowerCase()}`,
        ),
      );
    if (Number(used?.n ?? 0) > 0) {
      return { ok: false, error: "That class is still in use. Reassign those holdings first." };
    }

    await db
      .update(shareClasses)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(shareClasses.id, id));
  } catch (err) {
    console.error("[deleteShareClass] failed:", err);
    return { ok: false, error: "Couldn't remove that class. Please try again." };
  }

  revalidate();
  return { ok: true };
}
