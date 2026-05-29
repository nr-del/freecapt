"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany } from "@/lib/db/queries";
import { getPackByEntityType } from "@/lib/packs/_shared/loader";

const { companies } = schema;

type EntityType = (typeof schema.companies.entityType.enumValues)[number];

export type UpdateJurisdictionResult =
  | { ok: true; entityType: string }
  | { ok: false; error: string };

// Switch the active company's jurisdiction by picking a new entity type. Pulls
// jurisdiction / currency / pack version from the matching country pack so the
// cap table, stakeholders, and (later) transactions re-label consistently.
export async function updateCompanyJurisdiction(
  entityType: string,
): Promise<UpdateJurisdictionResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const validValues = schema.companies.entityType.enumValues as readonly string[];
  if (!validValues.includes(entityType)) {
    return { ok: false, error: "Unknown entity type." };
  }

  const pack = getPackByEntityType(entityType);
  if (pack.code === "generic") {
    return { ok: false, error: "That jurisdiction's pack isn't available yet." };
  }

  try {
    await db
      .update(companies)
      .set({
        entityType: entityType as EntityType,
        jurisdiction: pack.jurisdiction,
        currency: pack.currency,
        packVersion: pack.packVersion,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));
  } catch (err) {
    console.error("[updateCompanyJurisdiction] failed:", err);
    return { ok: false, error: "Couldn't update the jurisdiction. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/cap-table");
  revalidatePath("/stakeholders");
  return { ok: true, entityType };
}
