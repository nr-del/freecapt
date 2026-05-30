"use server";

import { revalidatePath } from "next/cache";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";
import { sendGrantWelcome } from "@/lib/email/send";
import {
  SECURITIES,
  normalizeSecurity,
  normalizeType,
  parseAmount,
  parseVesting,
  toIsoDate,
  validRows,
  type BulkRow,
} from "@/lib/bulk-add/parse";

const { securities, stakeholders, transactions } = schema;

type TxnType = "share_issuance" | "option_grant" | "safe_issuance";

const TXN_FOR_CATEGORY: Record<string, TxnType> = {
  equity_unit: "share_issuance",
  option_like: "option_grant",
  convertible: "safe_issuance",
};

export type BulkAddResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

// Create one stakeholder + one security + one issuance transaction per valid
// row, inside a single DB transaction. Ownership % isn't stored - the cap
// table derives it at read time - so a successful add just refreshes that view.
export async function createStakeholdersBulk(rows: BulkRow[]): Promise<BulkAddResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found. Seed the demo first." };

  const accountId = await getCurrentAccountId();
  const valid = validRows(rows);
  if (valid.length === 0) return { ok: false, error: "Nothing valid to add." };

  const currency = company.currency.trim();
  const today = new Date().toISOString().slice(0, 10);

  // Stakeholders with an email get a "view your stake" welcome after the write
  // commits (§5.7). Deduped, one per address.
  const inviteByEmail = new Map<string, string>();

  try {
    await db.transaction(async (tx) => {
      for (const row of valid) {
        const type = normalizeType(row.type) ?? "other";
        const secKey = normalizeSecurity(row.security) ?? "common_stock";
        const spec = SECURITIES[secKey];
        const amount = parseAmount(row.quantity) ?? 0;
        const effectiveDate = toIsoDate(row.date) ?? today;
        const strike = parseAmount(row.strike);
        const vesting = parseVesting(row.vesting);

        const [stakeholder] = await tx
          .insert(stakeholders)
          .values({
            companyId: company.id,
            fullName: row.name.trim(),
            email: row.email.trim() || null,
            type,
            notes: row.notes.trim() || null,
            createdByAccountId: accountId,
            updatedByAccountId: accountId,
          })
          .returning({ id: stakeholders.id });
        if (!stakeholder) throw new Error("Failed to insert stakeholder");

        const isMoney = spec.kind === "money";
        const [security] = await tx
          .insert(securities)
          .values({
            companyId: company.id,
            stakeholderId: stakeholder.id,
            category: spec.category,
            subtype: secKey,
            packVersion: company.packVersion,
            quantity: isMoney ? null : String(amount),
            monetaryAmount: isMoney ? String(amount) : null,
            monetaryCurrency: isMoney ? currency : null,
            strikePrice: !isMoney && strike != null ? String(strike) : null,
            strikeCurrency: !isMoney && strike != null ? currency : null,
            shareClass: isMoney ? null : "common",
            taxScheme: secKey === "iso" || secKey === "nso" ? secKey : null,
            vestingStartDate: !isMoney && vesting.totalMonths ? effectiveDate : null,
            vestingTotalMonths: isMoney ? null : vesting.totalMonths,
            vestingCliffMonths: isMoney ? null : vesting.cliffMonths,
            vestingFrequency: isMoney ? null : vesting.frequency,
            createdByAccountId: accountId,
            updatedByAccountId: accountId,
          })
          .returning({ id: securities.id });
        if (!security) throw new Error("Failed to insert security");

        await tx.insert(transactions).values({
          companyId: company.id,
          type: TXN_FOR_CATEGORY[spec.category] ?? "share_issuance",
          packVersion: company.packVersion,
          effectiveDate,
          securityId: security.id,
          stakeholderId: stakeholder.id,
          quantity: isMoney ? null : String(amount),
          monetaryAmount: isMoney ? String(amount) : null,
          monetaryCurrency: isMoney ? currency : null,
          note: row.notes.trim() || null,
          createdByAccountId: accountId,
          updatedByAccountId: accountId,
        });

        const email = row.email.trim().toLowerCase();
        if (email && !inviteByEmail.has(email)) {
          inviteByEmail.set(email, row.name.trim());
        }
      }
    });
  } catch (err) {
    console.error("[createStakeholdersBulk] failed:", err);
    return { ok: false, error: "Couldn't save those rows. Please try again." };
  }

  // Best-effort welcome emails; never fail the add if delivery has a hiccup.
  if (inviteByEmail.size > 0) {
    await Promise.allSettled(
      Array.from(inviteByEmail, ([email, name]) =>
        sendGrantWelcome({ to: email, companyName: company.displayName, stakeholderName: name }),
      ),
    );
  }

  revalidatePath("/stakeholders");
  revalidatePath("/cap-table");
  return { ok: true, count: valid.length };
}
