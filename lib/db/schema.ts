// FreeCapT data model.
// Source of truth: docs/05_data_model.md §1 (conventions) + §2.1–§2.10.
import { sql, type SQL } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  char,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// --- Custom Postgres types not in Drizzle core (§1 conventions) ---
// citext: case-insensitive text (email identity). Requires `CREATE EXTENSION citext`.
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

// bytea: raw bytes for application-encrypted secrets.
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// inet: IP address (audit log actor IP).
const inet = customType<{ data: string }>({
  dataType() {
    return "inet";
  },
});

// UUIDv7 primary key — time-ordered, generated in the app layer (§8 open item #2).
const primaryId = () =>
  uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7());

// --- Enums (§2.2, §2.3, §2.4) ---
export const jurisdictionCode = pgEnum("jurisdiction_code", ["dk", "no", "uk", "us"]);
export const entityType = pgEnum("entity_type", [
  "dk-aps",
  "dk-as",
  "no-as",
  "no-asa",
  "uk-ltd",
  "us-de-ccorp",
  "us-de-llc",
]);
export const companyStatus = pgEnum("company_status", ["active", "archived", "pending_deletion"]);
export const dataRegion = pgEnum("data_region", ["eu-fra", "us-east"]);
export const membershipRole = pgEnum("membership_role", ["admin", "editor", "viewer"]);
export const stakeholderType = pgEnum("stakeholder_type", [
  "founder",
  "employee",
  "investor",
  "advisor",
  "entity",
  "other",
]);
export const securityCategory = pgEnum("security_category", [
  "equity_unit",
  "option_like",
  "convertible",
]);
export const transactionType = pgEnum("transaction_type", [
  "incorporation",
  "share_issuance",
  "option_grant",
  "safe_issuance",
  "convertible_issuance",
  "exercise",
  "cancellation",
  "transfer",
  "conversion",
  "pool_reservation",
  "pool_topup",
  "authorized_capital_change",
]);
export const billingPlan = pgEnum("billing_plan", ["free", "pro", "growth"]);

// --- §2.1 accounts — authenticated humans (or service accounts) ---
export const accounts = pgTable(
  "accounts",
  {
    id: primaryId(),
    email: citext().notNull().unique(),
    fullName: text(),
    language: char({ length: 2 }).notNull().default("en"),
    displayTimezone: text().notNull().default("UTC"),
    totpSecretEncrypted: bytea(),
    recoveryCodesHash: text().array(),
    referralCode: text().notNull().unique(),
    referredByAccountId: uuid().references((): AnyPgColumn => accounts.id),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    lastSignedInAt: timestamp({ withTimezone: true }),
    // The AI onboarding helper is free ONE time per account (docs/13 Prompt 9).
    hasUsedAiOnboarding: boolean().notNull().default(false),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("idx_accounts_referral_code")
      .on(t.referralCode)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_accounts_referred_by").on(t.referredByAccountId),
  ],
);

// --- §2.2 companies — the cap table entity ---
export const companies = pgTable(
  "companies",
  {
    id: primaryId(),
    displayName: text().notNull(),
    legalName: text().notNull(),
    jurisdiction: jurisdictionCode().notNull(),
    entityType: entityType().notNull(),
    packVersion: text().notNull(),
    registryIdentifier: text(),
    registryIdentifierVerifiedAt: timestamp({ withTimezone: true }),
    incorporationDate: date(),
    dataRegion: dataRegion().notNull(), // immutable post-create
    currency: char({ length: 3 }).notNull(),
    authorizedUnits: numeric({ precision: 20, scale: 0 }),
    parValue: numeric({ precision: 20, scale: 6 }),
    parValueCurrency: char({ length: 3 }),
    status: companyStatus().notNull().default("active"),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("idx_companies_jurisdiction")
      .on(t.jurisdiction)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_companies_data_region").on(t.dataRegion),
    index("idx_companies_registry_id")
      .on(t.jurisdiction, t.registryIdentifier)
      .where(sql`${t.registryIdentifier} IS NOT NULL`),
  ],
);

// --- §2.3 memberships — Account × Company × Role ---
export const memberships = pgTable(
  "memberships",
  {
    id: primaryId(),
    accountId: uuid()
      .notNull()
      .references(() => accounts.id),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    role: membershipRole().notNull(),
    invitedByAccountId: uuid().references(() => accounts.id),
    invitedAt: timestamp({ withTimezone: true }),
    acceptedAt: timestamp({ withTimezone: true }),
    lastActiveAt: timestamp({ withTimezone: true }),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex("uq_memberships_account_company")
      .on(t.accountId, t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_memberships_account")
      .on(t.accountId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_memberships_company")
      .on(t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// --- §2.4 stakeholders — people/entities holding equity ---
export const stakeholders = pgTable(
  "stakeholders",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    fullName: text().notNull(),
    email: citext(),
    type: stakeholderType().notNull(),
    accountId: uuid().references(() => accounts.id),
    portalInviteSentAt: timestamp({ withTimezone: true }),
    portalFirstSeenAt: timestamp({ withTimezone: true }),
    isEntity: boolean().notNull().default(false),
    entityRegistryId: text(),
    notes: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("idx_stakeholders_company")
      .on(t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_stakeholders_account")
      .on(t.accountId)
      .where(sql`${t.accountId} IS NOT NULL`),
    index("idx_stakeholders_email")
      .on(t.companyId, sql`lower(${t.email})` as unknown as SQL)
      .where(sql`${t.email} IS NOT NULL AND ${t.deletedAt} IS NULL`),
  ],
);

// --- share_classes — named classes of equity managed per company ---
// Cap tables routinely carry several classes (Ordinary, Ordinary A, Preferred
// Seed…). A class is referenced by name from securities.shareClass (kept as
// text so imports with arbitrary class names — e.g. Carta's "Ordinary A-shares"
// — round-trip without a hard FK), and defined here so founders can manage the
// catalog and its economics (seniority, liquidation preference, votes).
export const shareClasses = pgTable(
  "share_classes",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    name: text().notNull(),
    // Higher = more senior in a liquidation waterfall. Common is usually 0.
    seniority: integer().notNull().default(0),
    isPreferred: boolean().notNull().default(false),
    // 1.00 = a 1× non-participating preference; null for common.
    liquidationPreferenceMultiple: numeric({ precision: 8, scale: 2 }),
    participating: boolean().notNull().default(false),
    votesPerShare: numeric({ precision: 12, scale: 4 }),
    notes: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex("uq_share_classes_company_name")
      .on(t.companyId, sql`lower(${t.name})`)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_share_classes_company")
      .on(t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// --- §2.5 securities — issued instruments ---
export const securities = pgTable(
  "securities",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    stakeholderId: uuid()
      .notNull()
      .references(() => stakeholders.id),
    category: securityCategory().notNull(),
    subtype: text().notNull(),
    packVersion: text().notNull(),
    quantity: numeric({ precision: 20, scale: 0 }),
    monetaryAmount: numeric({ precision: 20, scale: 4 }),
    monetaryCurrency: char({ length: 3 }),
    strikePrice: numeric({ precision: 20, scale: 6 }),
    strikeCurrency: char({ length: 3 }),
    capAmount: numeric({ precision: 20, scale: 4 }),
    capCurrency: char({ length: 3 }),
    discountPercent: numeric({ precision: 5, scale: 2 }),
    shareClass: text(),

    vestingStartDate: date(),
    vestingTotalMonths: integer(),
    vestingCliffMonths: integer(),
    vestingFrequency: text(),

    taxScheme: text(),
    taxSchemeMetadata: jsonb().default({}),

    status: text().notNull().default("active"),
    statusChangedAt: timestamp({ withTimezone: true }),
    statusReason: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    check("ck_securities_quantity", sql`(${t.category} = 'convertible') OR (${t.quantity} IS NOT NULL)`),
    check(
      "ck_securities_monetary",
      sql`(${t.category} != 'convertible') OR (${t.monetaryAmount} IS NOT NULL)`,
    ),
    index("idx_securities_company")
      .on(t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_securities_stakeholder")
      .on(t.stakeholderId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_securities_company_status")
      .on(t.companyId, t.status)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

// --- §2.6 transactions — events on the ledger ---
export const transactions = pgTable(
  "transactions",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    type: transactionType().notNull(),
    packVersion: text().notNull(),
    effectiveDate: date().notNull(),
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

    securityId: uuid().references(() => securities.id),
    sourceSecurityId: uuid().references((): AnyPgColumn => securities.id),
    stakeholderId: uuid().references(() => stakeholders.id),

    quantity: numeric({ precision: 20, scale: 0 }),
    monetaryAmount: numeric({ precision: 20, scale: 4 }),
    monetaryCurrency: char({ length: 3 }),

    note: text(),
    founderPersonalNote: text(),
    metadata: jsonb().default({}),

    approvalStatus: text().notNull().default("recorded"),
    approvedByAccountId: uuid().references(() => accounts.id),
    approvedAt: timestamp({ withTimezone: true }),

    fxRateToCompanyPrimary: numeric({ precision: 20, scale: 8 }),
    fxRateDate: date(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("idx_transactions_company_date")
      .on(t.companyId, t.effectiveDate.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_transactions_security")
      .on(t.securityId)
      .where(sql`${t.securityId} IS NOT NULL`),
    index("idx_transactions_stakeholder")
      .on(t.stakeholderId)
      .where(sql`${t.stakeholderId} IS NOT NULL`),
    index("idx_transactions_type").on(t.companyId, t.type),
  ],
);

// --- §2.7 documents ---
export const documents = pgTable(
  "documents",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    filename: text().notNull(),
    storageKey: text().notNull(),
    storageRegion: dataRegion().notNull(),
    contentType: text().notNull(),
    byteSize: bigint({ mode: "number" }).notNull(),
    sha256Hash: bytea().notNull(),
    templateUsed: text(),

    signed: boolean().notNull().default(false),
    signedAt: timestamp({ withTimezone: true }),
    signedBy: text(),

    transactionId: uuid().references(() => transactions.id),
    stakeholderId: uuid().references(() => stakeholders.id),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
    updatedByAccountId: uuid().references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("idx_documents_company")
      .on(t.companyId)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_documents_transaction")
      .on(t.transactionId)
      .where(sql`${t.transactionId} IS NOT NULL`),
    index("idx_documents_template")
      .on(t.templateUsed)
      .where(sql`${t.templateUsed} IS NOT NULL`),
  ],
);

// --- §2.8 audit_events — tamper-evident log (append-only) ---
export const auditEvents = pgTable(
  "audit_events",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    companyId: uuid().references(() => companies.id),
    accountId: uuid().references(() => accounts.id),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    action: text().notNull(),
    entityType: text(),
    entityId: uuid(),
    beforeData: jsonb(),
    afterData: jsonb(),
    ipAddress: inet(),
    userAgent: text(),
    sessionId: uuid(),

    isStaffAction: boolean().notNull().default(false),
    staffReason: text(),
    impersonatingAccountId: uuid().references(() => accounts.id),
  },
  (t) => [
    index("idx_audit_company_time")
      .on(t.companyId, t.occurredAt.desc())
      .where(sql`${t.companyId} IS NOT NULL`),
    index("idx_audit_account_time").on(t.accountId, t.occurredAt.desc()),
    index("idx_audit_action_time").on(t.action, t.occurredAt.desc()),
    index("idx_audit_staff")
      .on(t.occurredAt.desc())
      .where(sql`${t.isStaffAction}`),
  ],
);

// --- §2.9 subscriptions — billing state ---
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .unique()
      .references(() => companies.id),
    plan: billingPlan().notNull().default("free"),
    stakeholderLimit: integer().notNull().default(10),
    bonusSlots: integer().notNull().default(0),
    stripeSubscriptionId: text(),
    stripeCustomerId: text(),
    currentPeriodStart: timestamp({ withTimezone: true }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelAtPeriodEnd: boolean().notNull().default(false),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_subscriptions_stripe_sub").on(t.stripeSubscriptionId)],
);

// --- §2.10 vesting_schedules — custom (non-standard) vesting only ---
export const vestingSchedules = pgTable("vesting_schedules", {
  id: primaryId(),
  securityId: uuid()
    .notNull()
    .references(() => securities.id),
  events: jsonb().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// --- scenarios — saved simulator scenarios (data-model §2, "scenarios") ---
// `inputs` holds the round parameters (size, pre-money, pool top-up) plus a
// frozen snapshot of the cap table so a shared link renders identically even if
// the live cap table changes later. `shareToken` is the unguessable key for the
// public read-only view.
export const scenarios = pgTable(
  "scenarios",
  {
    id: primaryId(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    name: text().notNull(),
    inputs: jsonb().notNull(),
    shareToken: text().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdByAccountId: uuid().references(() => accounts.id),
  },
  (t) => [
    index("idx_scenarios_company").on(t.companyId),
    index("idx_scenarios_share_token")
      .on(t.shareToken)
      .where(sql`${t.shareToken} IS NOT NULL`),
  ],
);
