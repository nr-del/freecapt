// Seeds the "Acme Inc." demo cap table — a US Delaware C-corp with founders,
// employees on ISOs, an advisor on an NSO, a SAFE investor, and an option pool.
// Idempotent: wipes any existing Acme rows before re-inserting.
// Run: pnpm db:seed  (env loaded via --env-file=.env.local in the script)
import { eq } from "drizzle-orm";

import { db } from "./index";
import { companies, securities, stakeholders, subscriptions } from "./schema";

const PACK_VERSION = "us-de-ccorp@1.0.0";

async function main() {
  // --- Clean any prior Acme data (FKs are no-action, so delete children first) ---
  const existing = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.legalName, "Acme Inc."));

  for (const { id } of existing) {
    await db.delete(securities).where(eq(securities.companyId, id));
    await db.delete(stakeholders).where(eq(stakeholders.companyId, id));
    await db.delete(subscriptions).where(eq(subscriptions.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  // --- Company: 10,000,000 authorized shares ---
  const [company] = await db
    .insert(companies)
    .values({
      displayName: "Acme",
      legalName: "Acme Inc.",
      jurisdiction: "us",
      entityType: "us-de-ccorp",
      packVersion: PACK_VERSION,
      registryIdentifier: "88-1234567",
      incorporationDate: "2024-01-15",
      dataRegion: "us-east",
      currency: "USD",
      authorizedUnits: "10000000",
      parValue: "0.0001",
      parValueCurrency: "USD",
      status: "active",
    })
    .returning({ id: companies.id });

  if (!company) throw new Error("Failed to insert Acme company");
  const companyId = company.id;

  await db.insert(subscriptions).values({ companyId, plan: "free" });

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

  // --- Securities ---
  // Founders: common stock (equity_unit). 9,000,000 issued.
  // Employees + advisor: options (option_like) from the 1,000,000 pool.
  // Frank: SAFE (convertible), $250k @ $5M cap, 20% discount.
  await db.insert(securities).values([
    {
      companyId,
      stakeholderId: byEmail("anna@acme.test"),
      category: "equity_unit",
      subtype: "common_stock",
      packVersion: PACK_VERSION,
      quantity: "4000000",
      shareClass: "common",
      vestingStartDate: "2024-01-15",
      vestingTotalMonths: 48,
      vestingCliffMonths: 12,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("ben@acme.test"),
      category: "equity_unit",
      subtype: "common_stock",
      packVersion: PACK_VERSION,
      quantity: "3000000",
      shareClass: "common",
      vestingStartDate: "2024-01-15",
      vestingTotalMonths: 48,
      vestingCliffMonths: 12,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("chris@acme.test"),
      category: "equity_unit",
      subtype: "common_stock",
      packVersion: PACK_VERSION,
      quantity: "2000000",
      shareClass: "common",
      vestingStartDate: "2024-01-15",
      vestingTotalMonths: 48,
      vestingCliffMonths: 12,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("dana@acme.test"),
      category: "option_like",
      subtype: "iso",
      packVersion: PACK_VERSION,
      quantity: "200000",
      strikePrice: "0.50",
      strikeCurrency: "USD",
      shareClass: "common",
      taxScheme: "iso",
      vestingStartDate: "2024-06-01",
      vestingTotalMonths: 48,
      vestingCliffMonths: 12,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("erik@acme.test"),
      category: "option_like",
      subtype: "iso",
      packVersion: PACK_VERSION,
      quantity: "150000",
      strikePrice: "0.50",
      strikeCurrency: "USD",
      shareClass: "common",
      taxScheme: "iso",
      vestingStartDate: "2024-09-01",
      vestingTotalMonths: 48,
      vestingCliffMonths: 12,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("grace@acme.test"),
      category: "option_like",
      subtype: "nso",
      packVersion: PACK_VERSION,
      quantity: "50000",
      strikePrice: "0.50",
      strikeCurrency: "USD",
      shareClass: "common",
      taxScheme: "nso",
      vestingStartDate: "2024-03-01",
      vestingTotalMonths: 24,
      vestingCliffMonths: 0,
      vestingFrequency: "monthly",
    },
    {
      companyId,
      stakeholderId: byEmail("frank@vc.test"),
      category: "convertible",
      subtype: "safe",
      packVersion: PACK_VERSION,
      monetaryAmount: "250000",
      monetaryCurrency: "USD",
      capAmount: "5000000",
      capCurrency: "USD",
      discountPercent: "20",
    },
  ]);

  console.log(`Seeded Acme (${companyId}): 7 stakeholders, 7 securities, free subscription.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
