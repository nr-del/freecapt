// Seeds an "Acme" demo cap table with founders, employees on options, an
// advisor, a convertible investor, and an option pool.
// Two variants (pick at the CLI):
//   pnpm db:seed         → Acme Inc. (US Delaware C-corp, USD, common stock / ISO / NSO / SAFE)
//   pnpm db:seed dk      → Acme ApS  (DK ApS, DKK, anparter / tegningsoptioner / konvertibelt)
// Idempotent: wipes any existing Acme row (by legal name) before re-inserting.
// Env loaded via --env-file=.env.local in the npm script.
import { eq } from "drizzle-orm";

import { db } from "./index";
import { accounts, companies, memberships, securities, stakeholders, subscriptions } from "./schema";

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 12);
}

type Variant = {
  legalName: string;
  displayName: string;
  jurisdiction: "dk" | "us";
  entityType: "dk-aps" | "us-de-ccorp";
  packVersion: string;
  currency: string;
  dataRegion: "eu-fra" | "us-east";
  registryIdentifier: string;
  incorporationDate: string;
  parValue: string;
  authorizedUnits: string;
  // instrument subtypes for this jurisdiction
  equitySubtype: string; // founders' equity units
  employeeOptionSubtype: string; // employee options
  advisorOptionSubtype: string; // advisor options
  convertibleSubtype: string; // investor convertible
  optionTaxScheme: string | null; // taxScheme stored on option securities
  // amounts (kept proportional so ownership % is comparable across variants)
  founderQty: [string, string, string];
  employeeQty: [string, string];
  advisorQty: string;
  strikePrice: string;
  convertibleAmount: string;
  convertibleCap: string;
};

const VARIANTS: Record<"us" | "dk", Variant> = {
  us: {
    legalName: "Acme Inc.",
    displayName: "Acme",
    jurisdiction: "us",
    entityType: "us-de-ccorp",
    packVersion: "us-de-ccorp@1.0.0",
    currency: "USD",
    dataRegion: "us-east",
    registryIdentifier: "88-1234567",
    incorporationDate: "2024-01-15",
    parValue: "0.0001",
    authorizedUnits: "10000000",
    equitySubtype: "common_stock",
    employeeOptionSubtype: "iso",
    advisorOptionSubtype: "nso",
    convertibleSubtype: "safe",
    optionTaxScheme: "iso",
    founderQty: ["4000000", "3000000", "2000000"],
    employeeQty: ["200000", "150000"],
    advisorQty: "50000",
    strikePrice: "0.50",
    convertibleAmount: "250000",
    convertibleCap: "5000000",
  },
  dk: {
    legalName: "Acme ApS",
    displayName: "Acme",
    jurisdiction: "dk",
    entityType: "dk-aps",
    packVersion: "dk-aps@1.0.0",
    currency: "DKK",
    dataRegion: "eu-fra",
    registryIdentifier: "12345674", // 8 digits, passes CVR mod-11
    incorporationDate: "2024-01-15",
    parValue: "1",
    authorizedUnits: "1000000",
    equitySubtype: "anparter",
    employeeOptionSubtype: "tegningsoptioner",
    advisorOptionSubtype: "differenceaktier",
    convertibleSubtype: "konvertibelt_gaeldsbrev",
    optionTaxScheme: "ll-7p",
    founderQty: ["400000", "300000", "200000"],
    employeeQty: ["20000", "15000"],
    advisorQty: "5000",
    strikePrice: "1.00",
    convertibleAmount: "1875000",
    convertibleCap: "37500000",
  },
};

async function main() {
  const arg = (process.argv[2] ?? "us").toLowerCase();
  const key: "us" | "dk" = arg === "dk" ? "dk" : "us";
  const v = VARIANTS[key];

  // --- Clean any prior Acme data for this variant (FKs are no-action) ---
  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.legalName, v.legalName));

  for (const { id } of existing) {
    await db.delete(securities).where(eq(securities.companyId, id));
    await db.delete(stakeholders).where(eq(stakeholders.companyId, id));
    await db.delete(subscriptions).where(eq(subscriptions.companyId, id));
    await db.delete(memberships).where(eq(memberships.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  const [company] = await db
    .insert(companies)
    .values({
      displayName: v.displayName,
      legalName: v.legalName,
      jurisdiction: v.jurisdiction,
      entityType: v.entityType,
      packVersion: v.packVersion,
      registryIdentifier: v.registryIdentifier,
      incorporationDate: v.incorporationDate,
      dataRegion: v.dataRegion,
      currency: v.currency,
      authorizedUnits: v.authorizedUnits,
      parValue: v.parValue,
      parValueCurrency: v.currency,
      status: "active",
    })
    .returning({ id: companies.id });

  if (!company) throw new Error("Failed to insert Acme company");
  const companyId = company.id;

  await db.insert(subscriptions).values({ companyId, plan: "free" });

  // Optional: grant a dev account admin access so the demo shows up after sign-in
  // (getActiveCompany is membership-scoped). Set SEED_OWNER_EMAIL to your
  // magic-link email, e.g. `SEED_OWNER_EMAIL=me@example.com pnpm db:seed`.
  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmail) {
    await db
      .insert(accounts)
      .values({ email: ownerEmail, fullName: "Demo Owner", referralCode: generateReferralCode() })
      .onConflictDoNothing({ target: accounts.email });
    const [owner] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, ownerEmail))
      .limit(1);
    if (owner) {
      await db
        .insert(memberships)
        .values({ accountId: owner.id, companyId, role: "admin", acceptedAt: new Date() })
        .onConflictDoNothing();
      console.log(`  · linked ${ownerEmail} as admin`);
    }
  }

  // --- Stakeholders ---
  const people = [
    { fullName: "Anna Founder", email: "anna@acme.test", type: "founder" as const },
    { fullName: "Ben Founder", email: "ben@acme.test", type: "founder" as const },
    { fullName: "Chris Founder", email: "chris@acme.test", type: "founder" as const },
    { fullName: "Dana Employee", email: "dana@acme.test", type: "employee" as const },
    { fullName: "Erik Employee", email: "erik@acme.test", type: "employee" as const },
    { fullName: "Frank Investor", email: "frank@vc.test", type: "investor" as const },
    { fullName: "Grace Advisor", email: "grace@acme.test", type: "advisor" as const },
  ];

  const inserted = await db
    .insert(stakeholders)
    .values(people.map((p) => ({ companyId, ...p })))
    .returning({ id: stakeholders.id, email: stakeholders.email });

  const byEmail = (email: string) => {
    const row = inserted.find((r) => r.email?.toLowerCase() === email.toLowerCase());
    if (!row) throw new Error(`Stakeholder not found: ${email}`);
    return row.id;
  };

  const founderEquity = (email: string, quantity: string, start: string) => ({
    companyId,
    stakeholderId: byEmail(email),
    category: "equity_unit" as const,
    subtype: v.equitySubtype,
    packVersion: v.packVersion,
    quantity,
    shareClass: "common",
    vestingStartDate: start,
    vestingTotalMonths: 48,
    vestingCliffMonths: 12,
    vestingFrequency: "monthly",
  });

  const option = (
    email: string,
    subtype: string,
    quantity: string,
    start: string,
    totalMonths: number,
    cliffMonths: number,
  ) => ({
    companyId,
    stakeholderId: byEmail(email),
    category: "option_like" as const,
    subtype,
    packVersion: v.packVersion,
    quantity,
    strikePrice: v.strikePrice,
    strikeCurrency: v.currency,
    shareClass: "common",
    taxScheme: v.optionTaxScheme,
    vestingStartDate: start,
    vestingTotalMonths: totalMonths,
    vestingCliffMonths: cliffMonths,
    vestingFrequency: "monthly",
  });

  await db.insert(securities).values([
    founderEquity("anna@acme.test", v.founderQty[0], "2024-01-15"),
    founderEquity("ben@acme.test", v.founderQty[1], "2024-01-15"),
    founderEquity("chris@acme.test", v.founderQty[2], "2024-01-15"),
    option("dana@acme.test", v.employeeOptionSubtype, v.employeeQty[0], "2024-06-01", 48, 12),
    option("erik@acme.test", v.employeeOptionSubtype, v.employeeQty[1], "2024-09-01", 48, 12),
    option("grace@acme.test", v.advisorOptionSubtype, v.advisorQty, "2024-03-01", 24, 0),
    {
      companyId,
      stakeholderId: byEmail("frank@vc.test"),
      category: "convertible" as const,
      subtype: v.convertibleSubtype,
      packVersion: v.packVersion,
      monetaryAmount: v.convertibleAmount,
      monetaryCurrency: v.currency,
      capAmount: v.convertibleCap,
      capCurrency: v.currency,
      discountPercent: "20",
    },
  ]);

  console.log(
    `Seeded ${v.legalName} (${companyId}, ${v.entityType}/${v.currency}): 7 stakeholders, 7 securities, free subscription.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
