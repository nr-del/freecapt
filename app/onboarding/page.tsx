import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { createServerClient } from "@/lib/auth/supabase-server";
import { db, schema } from "@/lib/db";
import { getCompanyForEmail } from "@/lib/db/queries";
import { AVAILABLE_PACKS } from "@/lib/packs/_shared/loader";

import { OnboardingClient, type JurisdictionOption } from "./onboarding-client";

export const dynamic = "force-dynamic";

// Plain, serializable view of the country packs for the client form (functions
// and RegExps can't cross the server/client boundary). One entry per
// jurisdiction, each carrying its entity types + currency + registry label.
function jurisdictionOptions(): JurisdictionOption[] {
  const JLABEL: Record<string, string> = {
    dk: "Denmark",
    no: "Norway",
    uk: "United Kingdom",
    us: "United States",
  };
  const TZ: Record<string, string> = {
    dk: "Europe/Copenhagen",
    no: "Europe/Oslo",
    uk: "Europe/London",
    us: "America/New_York",
  };
  return AVAILABLE_PACKS.map((p) => ({
    code: p.jurisdiction,
    label: JLABEL[p.jurisdiction] ?? p.jurisdiction.toUpperCase(),
    currency: p.currency,
    defaultTimezone: TZ[p.jurisdiction] ?? "UTC",
    registryLabel: p.registryId.label,
    registryExample: p.registryId.example,
    defaultAuthorizedUnits: p.defaults.authorizedUnits,
    defaultParValue: p.defaults.parValue,
    entityTypes: p.entityTypes.map((e) => ({
      code: e.code,
      localName: e.localName,
      englishName: e.englishName,
    })),
  }));
}

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/sign-in");

  // Already onboarded? Skip straight to the product.
  const company = await getCompanyForEmail(user.email);
  if (company) redirect("/cap-table");

  const [account] = await db
    .select({ fullName: schema.accounts.fullName, language: schema.accounts.language })
    .from(schema.accounts)
    .where(eq(schema.accounts.email, user.email))
    .limit(1);

  return (
    <OnboardingClient
      email={user.email}
      defaultName={account?.fullName ?? ""}
      defaultLanguage={account?.language ?? "en"}
      jurisdictions={jurisdictionOptions()}
    />
  );
}
