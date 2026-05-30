"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getActiveCompany, getCurrentAccountId } from "@/lib/db/queries";
import { sendMemberInvite } from "@/lib/email/send";
import { getPackByEntityType } from "@/lib/packs/_shared/loader";

const { accounts, companies, memberships } = schema;

type EntityType = (typeof schema.companies.entityType.enumValues)[number];
type MembershipRole = (typeof schema.memberships.role.enumValues)[number];

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export type InviteMemberResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

const VALID_ROLES = schema.memberships.role.enumValues as readonly string[];
const BULK_INVITE_LIMIT = 50;

type InviteContext = { companyId: string; companyName: string; inviterId: string | null; inviterName: string | null };

// Core single-invite: ensure an Account exists for the email, create a pending
// membership (acceptedAt stamped on their first sign-in), and email the magic
// link. Idempotent on the unique (account, company) pair. Returns whether the
// row was newly added and whether the email went out.
async function inviteOne(
  ctx: InviteContext,
  email: string,
  role: MembershipRole,
): Promise<{ added: boolean; emailed: boolean }> {
  await db
    .insert(accounts)
    .values({ email, referralCode: generateReferralCode() })
    .onConflictDoNothing({ target: accounts.email });
  const [invitee] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);
  if (!invitee) throw new Error("account upsert returned no row");

  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.accountId, invitee.id),
        eq(memberships.companyId, ctx.companyId),
        isNull(memberships.deletedAt),
      ),
    )
    .limit(1);
  if (existing) return { added: false, emailed: false };

  await db.insert(memberships).values({
    accountId: invitee.id,
    companyId: ctx.companyId,
    role,
    invitedByAccountId: ctx.inviterId,
    invitedAt: new Date(),
  });

  const sent = await sendMemberInvite({
    to: email,
    companyName: ctx.companyName,
    inviterName: ctx.inviterName,
    role,
  });
  return { added: true, emailed: sent.sent };
}

async function buildInviteContext(): Promise<InviteContext | null> {
  const company = await getActiveCompany();
  if (!company) return null;
  const inviterId = await getCurrentAccountId();
  let inviterName: string | null = null;
  if (inviterId) {
    const [me] = await db
      .select({ fullName: accounts.fullName })
      .from(accounts)
      .where(eq(accounts.id, inviterId))
      .limit(1);
    inviterName = me?.fullName ?? null;
  }
  return { companyId: company.id, companyName: company.displayName, inviterId, inviterName };
}

// Invite one person to co-manage the active company's cap table (§5.13).
export async function inviteMember(
  emailRaw: string,
  role: string,
): Promise<InviteMemberResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!VALID_ROLES.includes(role)) return { ok: false, error: "Pick a valid role." };

  const ctx = await buildInviteContext();
  if (!ctx) return { ok: false, error: "No active company found." };

  try {
    const { added, emailed } = await inviteOne(ctx, email, role as MembershipRole);
    if (!added) return { ok: false, error: "That person is already a member." };
    revalidatePath("/settings");
    return { ok: true, emailed };
  } catch (err) {
    console.error("[inviteMember] failed:", err);
    return { ok: false, error: "Couldn't send the invite. Please try again." };
  }
}

export type InviteMembersBulkResult =
  | { ok: true; invited: number; emailed: number; skipped: number; invalid: string[] }
  | { ok: false; error: string };

// Invite up to 50 people at once from a pasted list (§5.13). Each line is an
// email with an optional ", role" (admin/editor/viewer; falls back to
// defaultRole). Invalid lines are reported, not fatal; already-members are
// skipped silently. One DB pass + one email per newly-added invitee.
export async function inviteMembersBulk(
  raw: string,
  defaultRole: string,
): Promise<InviteMembersBulkResult> {
  const fallbackRole: MembershipRole = VALID_ROLES.includes(defaultRole)
    ? (defaultRole as MembershipRole)
    : "editor";

  // Parse: split on newlines/semicolons; each line "email[,role]".
  const seen = new Set<string>();
  const parsed: { email: string; role: MembershipRole }[] = [];
  const invalid: string[] = [];
  for (const line of raw.split(/[\n;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [emailPart, rolePart] = trimmed.split(/[,\t]/).map((s) => s.trim());
    const email = (emailPart ?? "").toLowerCase();
    if (!EMAIL_RE.test(email)) {
      invalid.push(trimmed);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    const role =
      rolePart && VALID_ROLES.includes(rolePart.toLowerCase())
        ? (rolePart.toLowerCase() as MembershipRole)
        : fallbackRole;
    parsed.push({ email, role });
  }

  if (parsed.length === 0) {
    return { ok: false, error: "No valid email addresses found." };
  }
  if (parsed.length > BULK_INVITE_LIMIT) {
    return { ok: false, error: `That's more than ${BULK_INVITE_LIMIT} addresses — invite in smaller batches.` };
  }

  const ctx = await buildInviteContext();
  if (!ctx) return { ok: false, error: "No active company found." };

  let invited = 0;
  let emailed = 0;
  let skipped = 0;
  for (const { email, role } of parsed) {
    try {
      const res = await inviteOne(ctx, email, role);
      if (res.added) {
        invited += 1;
        if (res.emailed) emailed += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error("[inviteMembersBulk] failed for", email, err);
      invalid.push(email);
    }
  }

  revalidatePath("/settings");
  return { ok: true, invited, emailed, skipped, invalid };
}

export type RemoveMemberResult = { ok: true } | { ok: false; error: string };

// Soft-delete a membership (revoke access). Guards against removing yourself or
// a membership belonging to another company.
export async function removeMember(membershipId: string): Promise<RemoveMemberResult> {
  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const meId = await getCurrentAccountId();

  try {
    const [target] = await db
      .select({ accountId: memberships.accountId })
      .from(memberships)
      .where(and(eq(memberships.id, membershipId), eq(memberships.companyId, company.id)))
      .limit(1);
    if (!target) return { ok: false, error: "That member wasn't found." };
    if (meId && target.accountId === meId) {
      return { ok: false, error: "You can't remove yourself." };
    }

    await db
      .update(memberships)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(memberships.id, membershipId));
  } catch (err) {
    console.error("[removeMember] failed:", err);
    return { ok: false, error: "Couldn't remove the member. Please try again." };
  }

  revalidatePath("/settings");
  return { ok: true };
}
