"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";
import { sendGrantWelcome, sendStakeholderPortalInvite } from "@/lib/email/send";
import { ensureShareClasses } from "@/lib/share-classes/queries";
import { parseCartaWorkbook, type CartaGrant, type CartaParseResult } from "@/lib/carta/parse";
import {
  SECURITIES,
  STAKEHOLDER_TYPES,
  normalizeSecurity,
  normalizeType,
  parseAmount,
  parseVesting,
  toIsoDate,
  validRows,
  type BulkRow,
  type StakeholderType,
} from "@/lib/bulk-add/parse";

const { securities, stakeholders, transactions } = schema;

type TxnType = "share_issuance" | "option_grant" | "safe_issuance";

const TXN_FOR_CATEGORY: Record<string, TxnType> = {
  equity_unit: "share_issuance",
  option_like: "option_grant",
  convertible: "safe_issuance",
};

type SecurityCategory = "equity_unit" | "option_like" | "convertible";

// The structured single-stakeholder add. The optional `grant` block mirrors the
// fields the new-grant form collects; leaving it off just records the person.
export type SingleStakeholderInput = {
  fullName: string;
  email: string;
  type: string;
  isEntity: boolean;
  entityRegistryId: string;
  notes: string;
  grant: {
    category: SecurityCategory;
    subtype: string;
    shareClass: string;
    quantity: string; // equity_unit / option_like
    amount: string; // convertible (invested amount)
    issueDate: string;
    strikePrice: string; // option_like
    capAmount: string; // convertible
    discountPercent: string; // convertible
    vestingTotalMonths: string;
    vestingCliffMonths: string;
    vestingFrequency: string;
    taxScheme: string;
  } | null;
};

export type CreateStakeholderResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Create a single stakeholder and, optionally, one security + its issuance
// transaction — the structured replacement for the old one-row bulk modal.
export async function createStakeholder(
  input: SingleStakeholderInput,
): Promise<CreateStakeholderResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found. Seed the demo first." };

  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false, error: "Give the stakeholder a name." };

  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }

  const type: StakeholderType = (STAKEHOLDER_TYPES as readonly string[]).includes(input.type)
    ? (input.type as StakeholderType)
    : "other";

  const accountId = await getCurrentAccountId();
  const currency = company.currency.trim();
  const today = new Date().toISOString().slice(0, 10);

  // Parse the optional grant up front so a bad grant fails before we write.
  let grantData:
    | {
        category: SecurityCategory;
        subtype: string;
        shareClass: string | null;
        quantity: string | null;
        amount: string | null;
        issueDate: string;
        strike: string | null;
        capAmount: string | null;
        discountPercent: string | null;
        vestingTotalMonths: number | null;
        vestingCliffMonths: number | null;
        vestingFrequency: string | null;
      }
    | null = null;

  const g = input.grant;
  if (g && g.subtype.trim()) {
    const isMoney = g.category === "convertible";
    const issueDate = toIsoDate(g.issueDate) ?? today;

    if (isMoney) {
      const amount = parseAmount(g.amount);
      if (amount == null || amount <= 0) return { ok: false, error: "Enter the invested amount." };
      const cap = parseAmount(g.capAmount);
      const discount = parseAmount(g.discountPercent);
      grantData = {
        category: g.category,
        subtype: g.subtype.trim(),
        shareClass: null,
        quantity: null,
        amount: String(amount),
        issueDate,
        strike: null,
        capAmount: cap != null && cap > 0 ? String(cap) : null,
        discountPercent: discount != null && discount > 0 ? String(discount) : null,
        vestingTotalMonths: null,
        vestingCliffMonths: null,
        vestingFrequency: null,
      };
    } else {
      const qty = parseAmount(g.quantity);
      if (qty == null || qty <= 0) {
        return { ok: false, error: "Enter a quantity greater than zero." };
      }
      const strike = parseAmount(g.strikePrice);
      const total = g.vestingTotalMonths.trim() ? Number(g.vestingTotalMonths) : null;
      const cliff = g.vestingCliffMonths.trim() ? Number(g.vestingCliffMonths) : null;
      const hasVesting = total != null && Number.isFinite(total) && total > 0;
      grantData = {
        category: g.category,
        subtype: g.subtype.trim(),
        shareClass: g.shareClass.trim() || "common",
        quantity: String(qty),
        amount: null,
        issueDate,
        strike: g.category === "option_like" && strike != null ? String(strike) : null,
        capAmount: null,
        discountPercent: null,
        vestingTotalMonths: hasVesting ? Math.trunc(total) : null,
        vestingCliffMonths: hasVesting && cliff != null && Number.isFinite(cliff) ? Math.trunc(cliff) : null,
        vestingFrequency: hasVesting ? g.vestingFrequency.trim() || "monthly" : null,
      };
    }
  }

  let newId = "";
  try {
    await db.transaction(async (tx) => {
      const [stakeholder] = await tx
        .insert(stakeholders)
        .values({
          companyId: company.id,
          fullName,
          email: email || null,
          type,
          isEntity: Boolean(input.isEntity),
          entityRegistryId: input.isEntity ? input.entityRegistryId.trim() || null : null,
          notes: input.notes.trim() || null,
          createdByAccountId: accountId,
          updatedByAccountId: accountId,
        })
        .returning({ id: stakeholders.id });
      if (!stakeholder) throw new Error("Failed to insert stakeholder");
      newId = stakeholder.id;

      if (grantData) {
        const [security] = await tx
          .insert(securities)
          .values({
            companyId: company.id,
            stakeholderId: stakeholder.id,
            category: grantData.category,
            subtype: grantData.subtype,
            packVersion: company.packVersion,
            quantity: grantData.quantity,
            monetaryAmount: grantData.amount,
            monetaryCurrency: grantData.amount ? currency : null,
            strikePrice: grantData.strike,
            strikeCurrency: grantData.strike ? currency : null,
            capAmount: grantData.capAmount,
            capCurrency: grantData.capAmount ? currency : null,
            discountPercent: grantData.discountPercent,
            shareClass: grantData.shareClass,
            taxScheme: grantData.subtype === "iso" || grantData.subtype === "nso" ? grantData.subtype : g?.taxScheme.trim() || null,
            vestingStartDate: grantData.vestingTotalMonths ? grantData.issueDate : null,
            vestingTotalMonths: grantData.vestingTotalMonths,
            vestingCliffMonths: grantData.vestingCliffMonths,
            vestingFrequency: grantData.vestingFrequency,
            createdByAccountId: accountId,
            updatedByAccountId: accountId,
          })
          .returning({ id: securities.id });
        if (!security) throw new Error("Failed to insert security");

        await tx.insert(transactions).values({
          companyId: company.id,
          type: TXN_FOR_CATEGORY[grantData.category] ?? "share_issuance",
          packVersion: company.packVersion,
          effectiveDate: grantData.issueDate,
          securityId: security.id,
          stakeholderId: stakeholder.id,
          quantity: grantData.quantity,
          monetaryAmount: grantData.amount,
          monetaryCurrency: grantData.amount ? currency : null,
          note: input.notes.trim() || null,
          createdByAccountId: accountId,
          updatedByAccountId: accountId,
        });
      }
    });
  } catch (err) {
    console.error("[createStakeholder] failed:", err);
    return { ok: false, error: "Couldn't save that stakeholder. Please try again." };
  }

  // Register the class name in the catalog so it shows up under managed classes.
  if (grantData?.shareClass) {
    await ensureShareClasses(company.id, [grantData.shareClass], accountId).catch(() => {});
  }

  // Best-effort welcome email; never fail the add on a delivery hiccup.
  if (email) {
    await sendGrantWelcome({
      to: email,
      companyName: company.displayName,
      stakeholderName: fullName,
    }).catch(() => {});
  }

  revalidatePath("/stakeholders");
  revalidatePath("/cap-table");
  revalidatePath("/settings");
  return { ok: true, id: newId };
}

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

  // Register the "common" class in the catalog so it shows under managed classes.
  await ensureShareClasses(company.id, ["common"], accountId).catch(() => {});

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

// --- Detail-page edit actions -------------------------------------------

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateStakeholder(id: string) {
  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${id}`);
  revalidatePath("/cap-table");
  revalidatePath("/settings");
}

// The shape the grant form posts (matches AddStakeholderModal's grant block).
export type GrantInput = {
  category: SecurityCategory;
  subtype: string;
  shareClass: string;
  quantity: string;
  amount: string;
  issueDate: string;
  strikePrice: string;
  capAmount: string;
  discountPercent: string;
  vestingTotalMonths: string;
  vestingCliffMonths: string;
  vestingFrequency: string;
  taxScheme: string;
};

type ParsedGrant = {
  category: SecurityCategory;
  subtype: string;
  shareClass: string | null;
  quantity: string | null;
  amount: string | null;
  issueDate: string;
  strike: string | null;
  capAmount: string | null;
  discountPercent: string | null;
  taxScheme: string | null;
  vestingTotalMonths: number | null;
  vestingCliffMonths: number | null;
  vestingFrequency: string | null;
};

// Parse + validate one grant. Mirrors the inline logic in createStakeholder.
function parseGrant(g: GrantInput): { ok: true; data: ParsedGrant } | { ok: false; error: string } {
  const today = new Date().toISOString().slice(0, 10);
  const subtype = g.subtype.trim();
  if (!subtype) return { ok: false, error: "Pick a security." };
  const issueDate = toIsoDate(g.issueDate) ?? today;

  if (g.category === "convertible") {
    const amount = parseAmount(g.amount);
    if (amount == null || amount <= 0) return { ok: false, error: "Enter the invested amount." };
    const cap = parseAmount(g.capAmount);
    const discount = parseAmount(g.discountPercent);
    return {
      ok: true,
      data: {
        category: g.category,
        subtype,
        shareClass: null,
        quantity: null,
        amount: String(amount),
        issueDate,
        strike: null,
        capAmount: cap != null && cap > 0 ? String(cap) : null,
        discountPercent: discount != null && discount > 0 ? String(discount) : null,
        taxScheme: null,
        vestingTotalMonths: null,
        vestingCliffMonths: null,
        vestingFrequency: null,
      },
    };
  }

  const qty = parseAmount(g.quantity);
  if (qty == null || qty <= 0) return { ok: false, error: "Enter a quantity greater than zero." };
  const strike = parseAmount(g.strikePrice);
  const total = g.vestingTotalMonths.trim() ? Number(g.vestingTotalMonths) : null;
  const cliff = g.vestingCliffMonths.trim() ? Number(g.vestingCliffMonths) : null;
  const hasVesting = total != null && Number.isFinite(total) && total > 0;
  return {
    ok: true,
    data: {
      category: g.category,
      subtype,
      shareClass: g.shareClass.trim() || "common",
      quantity: String(qty),
      amount: null,
      issueDate,
      strike: g.category === "option_like" && strike != null ? String(strike) : null,
      capAmount: null,
      discountPercent: null,
      taxScheme: subtype === "iso" || subtype === "nso" ? subtype : g.taxScheme.trim() || null,
      vestingTotalMonths: hasVesting ? Math.trunc(total) : null,
      vestingCliffMonths:
        hasVesting && cliff != null && Number.isFinite(cliff) ? Math.trunc(cliff) : null,
      vestingFrequency: hasVesting ? g.vestingFrequency.trim() || "monthly" : null,
    },
  };
}

// The column set for a security row, derived from a parsed grant.
function securityColumns(company: { packVersion: string; currency: string }, data: ParsedGrant) {
  const currency = company.currency.trim();
  return {
    category: data.category,
    subtype: data.subtype,
    packVersion: company.packVersion,
    quantity: data.quantity,
    monetaryAmount: data.amount,
    monetaryCurrency: data.amount ? currency : null,
    strikePrice: data.strike,
    strikeCurrency: data.strike ? currency : null,
    capAmount: data.capAmount,
    capCurrency: data.capAmount ? currency : null,
    discountPercent: data.discountPercent,
    shareClass: data.shareClass,
    taxScheme: data.taxScheme,
    vestingStartDate: data.vestingTotalMonths ? data.issueDate : null,
    vestingTotalMonths: data.vestingTotalMonths,
    vestingCliffMonths: data.vestingCliffMonths,
    vestingFrequency: data.vestingFrequency,
  };
}

// Confirm a stakeholder belongs to the active company (tenant guard).
async function ownStakeholder(stakeholderId: string) {
  const company = await getActiveCompany();
  if (!company) return null;
  const [row] = await db
    .select({ id: stakeholders.id, email: stakeholders.email, fullName: stakeholders.fullName })
    .from(stakeholders)
    .where(
      and(
        eq(stakeholders.id, stakeholderId),
        eq(stakeholders.companyId, company.id),
        isNull(stakeholders.deletedAt),
      ),
    )
    .limit(1);
  return row ? { company, stakeholder: row } : null;
}

export type StakeholderDetailsInput = {
  fullName: string;
  email: string;
  type: string;
  isEntity: boolean;
  entityRegistryId: string;
  notes: string;
};

// Edit a stakeholder's profile fields.
export async function updateStakeholder(
  id: string,
  input: StakeholderDetailsInput,
): Promise<ActionResult> {
  const owned = await ownStakeholder(id);
  if (!owned) return { ok: false, error: "That stakeholder wasn't found." };

  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false, error: "Give the stakeholder a name." };
  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  const type: StakeholderType = (STAKEHOLDER_TYPES as readonly string[]).includes(input.type)
    ? (input.type as StakeholderType)
    : "other";
  const accountId = await getCurrentAccountId();

  try {
    await db
      .update(stakeholders)
      .set({
        fullName,
        email: email || null,
        type,
        isEntity: Boolean(input.isEntity),
        entityRegistryId: input.isEntity ? input.entityRegistryId.trim() || null : null,
        notes: input.notes.trim() || null,
        updatedByAccountId: accountId,
        updatedAt: new Date(),
      })
      .where(eq(stakeholders.id, id));
  } catch (err) {
    console.error("[updateStakeholder] failed:", err);
    return { ok: false, error: "Couldn't save those changes. Please try again." };
  }

  revalidateStakeholder(id);
  return { ok: true };
}

// Soft-delete a stakeholder and their holdings (removes them from the cap table).
export async function deleteStakeholder(id: string): Promise<ActionResult> {
  const owned = await ownStakeholder(id);
  if (!owned) return { ok: false, error: "That stakeholder wasn't found." };
  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(securities)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(securities.stakeholderId, id), isNull(securities.deletedAt)));
      await tx.update(stakeholders).set({ deletedAt: now, updatedAt: now }).where(eq(stakeholders.id, id));
    });
  } catch (err) {
    console.error("[deleteStakeholder] failed:", err);
    return { ok: false, error: "Couldn't remove that stakeholder. Please try again." };
  }
  revalidateStakeholder(id);
  return { ok: true };
}

// Add a holding to an existing stakeholder.
export async function createSecurityForStakeholder(
  stakeholderId: string,
  grant: GrantInput,
): Promise<ActionResult> {
  const owned = await ownStakeholder(stakeholderId);
  if (!owned) return { ok: false, error: "That stakeholder wasn't found." };
  const { company } = owned;

  const parsed = parseGrant(grant);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;
  const accountId = await getCurrentAccountId();

  try {
    await db.transaction(async (tx) => {
      const [security] = await tx
        .insert(securities)
        .values({
          companyId: company.id,
          stakeholderId,
          ...securityColumns(company, data),
          createdByAccountId: accountId,
          updatedByAccountId: accountId,
        })
        .returning({ id: securities.id });
      if (!security) throw new Error("Failed to insert security");

      await tx.insert(transactions).values({
        companyId: company.id,
        type: TXN_FOR_CATEGORY[data.category] ?? "share_issuance",
        packVersion: company.packVersion,
        effectiveDate: data.issueDate,
        securityId: security.id,
        stakeholderId,
        quantity: data.quantity,
        monetaryAmount: data.amount,
        monetaryCurrency: data.amount ? company.currency.trim() : null,
        createdByAccountId: accountId,
        updatedByAccountId: accountId,
      });
    });
  } catch (err) {
    console.error("[createSecurityForStakeholder] failed:", err);
    return { ok: false, error: "Couldn't add that holding. Please try again." };
  }

  if (data.shareClass) await ensureShareClasses(company.id, [data.shareClass], accountId).catch(() => {});
  revalidateStakeholder(stakeholderId);
  return { ok: true };
}

// Edit an existing holding. The issuance transaction isn't rewritten (it's the
// historical record) — we update the live security row the cap table reads.
export async function updateSecurity(securityId: string, grant: GrantInput): Promise<ActionResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const [existing] = await db
    .select({ id: securities.id, stakeholderId: securities.stakeholderId })
    .from(securities)
    .where(
      and(
        eq(securities.id, securityId),
        eq(securities.companyId, company.id),
        isNull(securities.deletedAt),
      ),
    )
    .limit(1);
  if (!existing) return { ok: false, error: "That holding wasn't found." };

  const parsed = parseGrant(grant);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;
  const accountId = await getCurrentAccountId();

  try {
    await db
      .update(securities)
      .set({ ...securityColumns(company, data), updatedByAccountId: accountId, updatedAt: new Date() })
      .where(eq(securities.id, securityId));
  } catch (err) {
    console.error("[updateSecurity] failed:", err);
    return { ok: false, error: "Couldn't update that holding. Please try again." };
  }

  if (data.shareClass) await ensureShareClasses(company.id, [data.shareClass], accountId).catch(() => {});
  revalidateStakeholder(existing.stakeholderId);
  return { ok: true };
}

// Soft-delete a single holding.
export async function deleteSecurity(securityId: string): Promise<ActionResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  const [existing] = await db
    .select({ id: securities.id, stakeholderId: securities.stakeholderId })
    .from(securities)
    .where(
      and(
        eq(securities.id, securityId),
        eq(securities.companyId, company.id),
        isNull(securities.deletedAt),
      ),
    )
    .limit(1);
  if (!existing) return { ok: false, error: "That holding wasn't found." };
  try {
    await db
      .update(securities)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(securities.id, securityId));
  } catch (err) {
    console.error("[deleteSecurity] failed:", err);
    return { ok: false, error: "Couldn't remove that holding. Please try again." };
  }
  revalidateStakeholder(existing.stakeholderId);
  return { ok: true };
}

// Send (or resend) the stakeholder a portal invite and stamp portalInviteSentAt.
export async function sendStakeholderInvite(id: string): Promise<ActionResult> {
  const owned = await ownStakeholder(id);
  if (!owned) return { ok: false, error: "That stakeholder wasn't found." };
  const { company, stakeholder } = owned;
  const email = stakeholder.email?.trim();
  if (!email) return { ok: false, error: "Add an email address before inviting." };

  const res = await sendStakeholderPortalInvite({
    to: email,
    companyName: company.displayName,
    stakeholderName: stakeholder.fullName,
  });
  if (!res.sent) {
    return {
      ok: false,
      error:
        res.reason === "email_not_configured"
          ? "Email isn't switched on yet, so we couldn't send the invite."
          : "Couldn't send the invite. Please try again.",
    };
  }

  try {
    await db
      .update(stakeholders)
      .set({ portalInviteSentAt: new Date(), updatedAt: new Date() })
      .where(eq(stakeholders.id, id));
  } catch (err) {
    console.error("[sendStakeholderInvite] stamp failed:", err);
  }

  revalidateStakeholder(id);
  return { ok: true };
}

// --- Carta import --------------------------------------------------------

// Parse an uploaded Carta "Equity Plan" .xlsx into a preview. No writes happen
// here — the client shows the grants, then calls importCartaGrants to commit.
export async function previewCartaImport(formData: FormData): Promise<CartaParseResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a Carta export (.xlsx) to upload." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { ok: false, error: "That file is larger than 15 MB." };
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xlsm")) {
    return { ok: false, error: "Upload the Excel (.xlsx) export, not a CSV or PDF." };
  }

  const buf = await file.arrayBuffer();
  return parseCartaWorkbook(buf);
}

export type CartaImportResult =
  | { ok: true; stakeholdersCreated: number; stakeholdersMatched: number; holdings: number }
  | { ok: false; error: string };

// Commit reviewed Carta grants: find-or-create each stakeholder (deduped by
// email, then name, against both existing rows and others in this batch), then
// insert one security + issuance transaction per grant and register the share
// classes. Carta's schedule column carries no reliable duration, so vesting
// months are left empty — the start date is kept for reference.
export async function importCartaGrants(grants: CartaGrant[]): Promise<CartaImportResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };
  if (!Array.isArray(grants) || grants.length === 0) {
    return { ok: false, error: "Nothing to import." };
  }

  const accountId = await getCurrentAccountId();
  const currency = company.currency.trim();
  const today = new Date().toISOString().slice(0, 10);

  // Existing stakeholders, so we match instead of duplicating.
  const existing = await db
    .select({ id: stakeholders.id, email: stakeholders.email, fullName: stakeholders.fullName })
    .from(stakeholders)
    .where(and(eq(stakeholders.companyId, company.id), isNull(stakeholders.deletedAt)));

  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const s of existing) {
    if (s.email) byEmail.set(s.email.toLowerCase(), s.id);
    byName.set(s.fullName.trim().toLowerCase(), s.id);
  }

  const newIds = new Set<string>();
  const matchedIds = new Set<string>();
  const classSet = new Set<string>();
  const welcomeByEmail = new Map<string, string>();
  let holdings = 0;

  try {
    await db.transaction(async (tx) => {
      const runByEmail = new Map<string, string>();
      const runByName = new Map<string, string>();

      for (const g of grants) {
        const name = g.stakeholderName.trim();
        if (!name) continue;
        const email = g.stakeholderEmail.trim();
        const emailKey = email.toLowerCase();
        const nameKey = name.toLowerCase();

        // Resolve the stakeholder: existing DB row, then one created earlier in
        // this batch, otherwise create a fresh one.
        let stakeholderId =
          (emailKey ? byEmail.get(emailKey) ?? runByEmail.get(emailKey) : undefined) ??
          byName.get(nameKey) ??
          runByName.get(nameKey) ??
          "";

        if (!stakeholderId) {
          const type: StakeholderType = (STAKEHOLDER_TYPES as readonly string[]).includes(g.type)
            ? g.type
            : "other";
          const [ins] = await tx
            .insert(stakeholders)
            .values({
              companyId: company.id,
              fullName: name,
              email: email || null,
              type,
              notes: g.jobTitle.trim() || null,
              createdByAccountId: accountId,
              updatedByAccountId: accountId,
            })
            .returning({ id: stakeholders.id });
          if (!ins) throw new Error("Failed to insert stakeholder");
          stakeholderId = ins.id;
          newIds.add(stakeholderId);
          if (emailKey) runByEmail.set(emailKey, stakeholderId);
          runByName.set(nameKey, stakeholderId);
          if (email) welcomeByEmail.set(emailKey, name);
        } else if (!newIds.has(stakeholderId)) {
          matchedIds.add(stakeholderId);
        }

        const isMoney = g.category === "convertible";
        const qty = isMoney ? null : String(Math.max(0, Math.round(g.quantity)));
        const shareClass = isMoney ? null : g.shareClass.trim() || "common";
        if (shareClass) classSet.add(shareClass);
        const strike =
          g.category === "option_like" && g.strikePrice != null && g.strikePrice > 0
            ? String(g.strikePrice)
            : null;
        const effectiveDate = g.vestingStartDate ?? today;

        const [security] = await tx
          .insert(securities)
          .values({
            companyId: company.id,
            stakeholderId,
            category: g.category,
            subtype: g.subtype || (isMoney ? "safe" : "common_stock"),
            packVersion: company.packVersion,
            quantity: qty,
            monetaryAmount: null,
            monetaryCurrency: null,
            strikePrice: strike,
            strikeCurrency: strike ? currency : null,
            shareClass,
            taxScheme: g.subtype === "iso" || g.subtype === "nso" ? g.subtype : null,
            vestingStartDate: g.vestingStartDate,
            vestingTotalMonths: null,
            vestingCliffMonths: null,
            vestingFrequency: null,
            createdByAccountId: accountId,
            updatedByAccountId: accountId,
          })
          .returning({ id: securities.id });
        if (!security) throw new Error("Failed to insert security");

        await tx.insert(transactions).values({
          companyId: company.id,
          type: TXN_FOR_CATEGORY[g.category] ?? "share_issuance",
          packVersion: company.packVersion,
          effectiveDate,
          securityId: security.id,
          stakeholderId,
          quantity: qty,
          monetaryAmount: null,
          monetaryCurrency: null,
          note: g.planName.trim() ? `Imported from Carta — ${g.planName.trim()}` : "Imported from Carta",
          createdByAccountId: accountId,
          updatedByAccountId: accountId,
        });
        holdings++;
      }
    });
  } catch (err) {
    console.error("[importCartaGrants] failed:", err);
    return { ok: false, error: "Couldn't import those grants. Please try again." };
  }

  if (classSet.size > 0) {
    await ensureShareClasses(company.id, Array.from(classSet), accountId).catch(() => {});
  }

  // Best-effort welcome emails for newly-added stakeholders with an address.
  if (welcomeByEmail.size > 0) {
    await Promise.allSettled(
      Array.from(welcomeByEmail, ([email, name]) =>
        sendGrantWelcome({ to: email, companyName: company.displayName, stakeholderName: name }),
      ),
    );
  }

  revalidatePath("/stakeholders");
  revalidatePath("/cap-table");
  revalidatePath("/settings");

  return {
    ok: true,
    stakeholdersCreated: newIds.size,
    stakeholdersMatched: matchedIds.size,
    holdings,
  };
}
