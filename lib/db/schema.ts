// FreeCapT data model — first four core tables.
// Source of truth: docs/05_data_model.md §1 (conventions) + §2.1–§2.4.
// Securities, transactions, documents, audit_events and the rest land later.
import { sql, type SQL } from "drizzle-orm";
import {
  boolean,
  char,
  customType,
  date,
  index,
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
