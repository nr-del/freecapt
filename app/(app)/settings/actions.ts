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

// Invite someone to co-manage the active company's cap table (§5.13). We ensure
// an Account exists for the email (so the membership has an owner), create a
// pending membership (acceptedAt stamped on their first sign-in), and email a
// magic-link invite. Idempotent on the unique (account, company) pair.
export async function inviteMember(
  emailRaw: string,
  role: string,
): Promise<InviteMemberResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!VALID_ROLES.includes(role)) return { ok: false, error: "Pick a valid role." };

  const company = await getActiveCompany();
  if (!company) return { ok: false, error: "No active company found." };

  const inviterId = await getCurrentAccountId();

  try {
    // Ensure an Account row for the invitee, then read its id back.
    await db
      .insert(accounts)
      .values({ email, referralCode: generateReferralCode() })
      .onConflictDoNothing({ target: accounts.email });
    const [invitee] = await db
      .select({ id: accounts.id, fullName: accounts.fullName })
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);
    if (!invitee) return { ok: false, error: "Couldn't set up the invite. Please try again." };

    // Already a member of this company?
    const [existing] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.accountId, invitee.id),
          eq(memberships.companyId, company.id),
          isNull(memberships.deletedAt),
        ),
      )
      .limit(1);
    if (existing) return { ok: false, error: "That person is already a member." };

    await db.insert(memberships).values({
      accountId: invitee.id,
      companyId: company.id,
      role: role as MembershipRole,
      invitedByAccountId: inviterId,
      invitedAt: new Date(),
    });
  } catch (err) {
    console.error("[inviteMember] failed:", err);
    return { ok: false, error: "Couldn't send the invite. Please try again." };
  }

  let inviterName: string | null = null;
  if (inviterId) {
    const [me] = await db
      .select({ fullName: accounts.fullName })
      .from(accounts)
      .where(eq(accounts.id, inviterId))
      .limit(1);
    inviterName = me?.fullName ?? null;
  }

  const result = await sendMemberInvite({
    to: email,
    companyName: company.displayName,
    inviterName,
    role,
  });

  revalidatePath("/settings");
  return { ok: true, emailed: result.sent };
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
