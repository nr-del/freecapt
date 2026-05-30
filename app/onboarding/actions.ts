"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db, schema } from "@/lib/db";
import { getCompanyForEmail } from "@/lib/db/queries";
import { getPackByEntityType } from "@/lib/packs/_shared/loader";

const { accounts, companies, memberships, subscriptions } = schema;

type EntityType = (typeof schema.companies.entityType.enumValues)[number];
type DataRegion = (typeof schema.companies.dataRegion.enumValues)[number];

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

// The UI languages we ship (next-intl locales). Stored on accounts.language (char 2).
const LANGUAGES = ["en", "da", "no", "sv", "de"] as const;

const inputSchema = z.object({
  fullName: z.string().trim().min(1, "Tell us your name.").max(120),
  language: z.enum(LANGUAGES),
  timezone: z.string().trim().min(1).max(64),
  entityType: z.enum(schema.companies.entityType.enumValues),
  legalName: z.string().trim().min(1, "Add the company's legal name.").max(200),
  displayName: z.string().trim().min(1, "Add a short display name.").max(120),
  currency: z.string().trim().length(3),
  registryIdentifier: z.string().trim().max(40).optional(),
  incorporationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  authorizedUnits: z.number().nonnegative().optional(),
  parValue: z.number().nonnegative().optional(),
});

export type OnboardingInput = z.input<typeof inputSchema>;

export type OnboardingResult = { ok: false; error: string };

// Create the signed-in user's first company + profile (§5.1 onboarding). Writes
// the account profile, the company (jurisdiction/currency/pack pulled from the
// matching country pack so labels are correct from minute one), an admin
// membership, and a free subscription — all in one transaction. Redirects to
// the cap table on success; returns an error string otherwise.
export async function completeOnboarding(raw: OnboardingInput): Promise<OnboardingResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const input = parsed.data;

  const pack = getPackByEntityType(input.entityType);
  if (pack.code === "generic") {
    return { ok: false, error: "That jurisdiction isn't available yet." };
  }

  // Idempotent: if they already belong to a company (double submit, back button),
  // don't create a second one — just continue.
  const existing = await getCompanyForEmail(user.email);
  if (existing) {
    redirect("/cap-table");
  }

  const currency = input.currency.toUpperCase();
  const dataRegion: DataRegion = pack.jurisdiction === "us" ? "us-east" : "eu-fra";
  const registryIdentifier = input.registryIdentifier?.trim() || null;
  const incorporationDate = input.incorporationDate?.trim() || null;

  try {
    await db.transaction(async (tx) => {
      // Ensure the account exists, then update the profile fields.
      await tx
        .insert(accounts)
        .values({
          email: user.email!,
          fullName: input.fullName,
          language: input.language,
          displayTimezone: input.timezone,
          referralCode: generateReferralCode(),
        })
        .onConflictDoUpdate({
          target: accounts.email,
          set: {
            fullName: input.fullName,
            language: input.language,
            displayTimezone: input.timezone,
            updatedAt: new Date(),
          },
        });

      const [account] = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, user.email!))
        .limit(1);
      if (!account) throw new Error("account upsert failed");

      const [company] = await tx
        .insert(companies)
        .values({
          displayName: input.displayName,
          legalName: input.legalName,
          jurisdiction: pack.jurisdiction,
          entityType: input.entityType as EntityType,
          packVersion: pack.packVersion,
          registryIdentifier,
          incorporationDate,
          dataRegion,
          currency,
          authorizedUnits: input.authorizedUnits != null ? String(input.authorizedUnits) : null,
          parValue: input.parValue != null ? String(input.parValue) : null,
          parValueCurrency: input.parValue != null ? currency : null,
          status: "active",
          createdByAccountId: account.id,
          updatedByAccountId: account.id,
        })
        .returning({ id: companies.id });
      if (!company) throw new Error("company insert failed");

      await tx.insert(memberships).values({
        accountId: account.id,
        companyId: company.id,
        role: "admin",
        acceptedAt: new Date(),
      });

      await tx.insert(subscriptions).values({ companyId: company.id, plan: "free" });
    });
  } catch (err) {
    console.error("[completeOnboarding] failed:", err);
    return { ok: false, error: "Couldn't create your company. Please try again." };
  }

  revalidatePath("/cap-table");
  redirect("/cap-table");
}
