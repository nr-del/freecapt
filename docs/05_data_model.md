# Data model spec — v1 (Postgres 16+)

**Version:** 0.1
**Date:** 2026-05-26
**Audience:** Engineering — anyone writing the first migration
**Status:** Buildable. Naming and column types are decisions, not suggestions. Open items at end are explicit.

This doc turns §3 (data model), §5.11 (country packs), §5.16 (i18n), §5.17 (security), and §5.18 (database & infra requirements) of the main scope into concrete SQL. It assumes Postgres 16+ with Row-Level Security enforced.

---

## 1. Conventions (apply to every table)

- **Primary keys:** `id` is `uuid` generated with `uuidv7()` (time-ordered, sortable, no leaking record counts). Postgres 16 doesn't ship `uuidv7()` natively — install the `pg_uuidv7` extension or generate in the application layer.
- **Tenancy column:** every tenanted table has `company_id uuid not null` (or `account_id uuid not null` for account-scoped tables). Enforced by RLS policy.
- **Currency on every money column:** every `numeric(20, 4)` money column is paired with a `*_currency char(3)` ISO 4217 column. No implicit currency anywhere. See §10.
- **All timestamps UTC:** `timestamptz` always. Per-Account `display_timezone` (IANA name) controls rendering. See §11.
- **Audit columns** (every table except `audit_events` and reference tables):
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
  - `created_by_account_id uuid references accounts(id)`
  - `updated_by_account_id uuid references accounts(id)`
- **Soft delete:** `deleted_at timestamptz` column on tenanted tables. Application code filters `WHERE deleted_at IS NULL` by default; RLS policies do too. Hard delete only via the GDPR data-deletion workflow.
- **Money:** `numeric(20, 4)` for any monetary value. Always accompanied by a `*_currency` column (ISO 4217 char(3)).
- **Share/option counts:** `numeric(20, 0)` — supports up to 10^20 units. Integer would overflow on edge cases (high-share-count companies).
- **Percentages:** stored as `numeric(7, 4)` representing 0–100.0000 (not 0–1). Easier to read in SQL, no off-by-100 bugs.
- **Time zones:** all timestamps stored UTC (`timestamptz`). User TZ is a display preference on the Account.
- **Foreign keys:** ENFORCED at the DB level. No application-layer-only relationships.
- **Enums:** Postgres native `CREATE TYPE ... AS ENUM (...)`. Easier to query than text-with-CHECK, easier to extend than custom types.

---

## 2. Core tables — the seven objects

### 2.1 `accounts` — authenticated humans (or service accounts)

```sql
CREATE TABLE accounts (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  email               citext NOT NULL UNIQUE,            -- case-insensitive
  full_name           text,
  language            char(2) NOT NULL DEFAULT 'en',     -- 'en','da','no','sv','de'
  display_timezone    text NOT NULL DEFAULT 'UTC',
  totp_secret_encrypted bytea,                            -- null if 2FA disabled
  recovery_codes_hash text[],                              -- bcrypt hashes
  referral_code       text UNIQUE NOT NULL,              -- e.g. 'nr-bf24x'
  referred_by_account_id uuid REFERENCES accounts(id),
  email_verified_at   timestamptz,
  last_signed_in_at   timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz                         -- GDPR delete sets this
);
CREATE INDEX idx_accounts_referral_code ON accounts(referral_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_referred_by ON accounts(referred_by_account_id);
```

Notes:
- Email is the only identity. Magic-link auth has no password column.
- `totp_secret_encrypted` is application-encrypted (envelope encryption with a per-tenant key from KMS / Vault).
- `referral_code` is generated at signup; used for `/r/<code>` link attribution.

### 2.2 `companies` — the cap table entity

```sql
CREATE TYPE jurisdiction_code AS ENUM ('dk', 'no', 'uk', 'us');
CREATE TYPE entity_type AS ENUM (
  'dk-aps', 'dk-as',
  'no-as', 'no-asa',
  'uk-ltd',
  'us-de-ccorp', 'us-de-llc'
);
CREATE TYPE company_status AS ENUM ('active', 'archived', 'pending_deletion');
CREATE TYPE data_region AS ENUM ('eu-fra', 'us-east');

CREATE TABLE companies (
  id                      uuid PRIMARY KEY DEFAULT uuidv7(),
  display_name            text NOT NULL,
  legal_name              text NOT NULL,
  jurisdiction            jurisdiction_code NOT NULL,
  entity_type             entity_type NOT NULL,
  pack_version            text NOT NULL,                 -- e.g. 'dk-aps@1.2.0'
  registry_identifier     text,                          -- CVR / Org-nr / Co# / EIN
  registry_identifier_verified_at timestamptz,
  incorporation_date      date,
  data_region             data_region NOT NULL,          -- IMMUTABLE post-create
  currency                char(3) NOT NULL,              -- ISO 4217
  authorized_units        numeric(20, 0),                -- total auth shares
  par_value               numeric(20, 6),                -- per unit, in currency
  par_value_currency      char(3),
  status                  company_status NOT NULL DEFAULT 'active',

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by_account_id   uuid REFERENCES accounts(id),
  updated_by_account_id   uuid REFERENCES accounts(id),
  deleted_at              timestamptz
);
CREATE INDEX idx_companies_jurisdiction ON companies(jurisdiction) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_data_region ON companies(data_region);
CREATE INDEX idx_companies_registry_id ON companies(jurisdiction, registry_identifier) WHERE registry_identifier IS NOT NULL;
```

Notes:
- `pack_version` is stored as text (e.g. `dk-aps@1.2.0`). Every transaction inherits the company's pack_version at creation — see §2.5.
- `data_region` is immutable after company creation. Migrating between regions requires a documented support-ticket flow with downtime.
- `(jurisdiction, registry_identifier)` indexed together because CVR-nr `12345678` could collide with a UK number — uniqueness only within jurisdiction.

### 2.3 `memberships` — Account × Company × Role

```sql
CREATE TYPE membership_role AS ENUM ('admin', 'editor', 'viewer');
-- Note: 'stakeholder' is NOT a membership role — stakeholders are a different
-- object (§2.4). A given Account can be both a member (with role admin/editor/viewer)
-- AND a stakeholder of the same company.

CREATE TABLE memberships (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  account_id            uuid NOT NULL REFERENCES accounts(id),
  company_id            uuid NOT NULL REFERENCES companies(id),
  role                  membership_role NOT NULL,
  invited_by_account_id uuid REFERENCES accounts(id),
  invited_at            timestamptz,
  accepted_at           timestamptz,
  last_active_at        timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,

  UNIQUE (account_id, company_id) WHERE deleted_at IS NULL
);
CREATE INDEX idx_memberships_account ON memberships(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_company ON memberships(company_id) WHERE deleted_at IS NULL;
```

Notes:
- Partial unique index ensures one active membership per (account, company) pair, but allows historical (deleted) rows to exist for audit.
- An account with `memberships.count(company) > 1` triggers the company switcher in the UI (§4 of the main scope).
- Enforcement that at least one Admin exists per company is application-layer (transactional check).

### 2.4 `stakeholders` — people/entities holding equity

```sql
CREATE TYPE stakeholder_type AS ENUM ('founder', 'employee', 'investor', 'advisor', 'entity', 'other');

CREATE TABLE stakeholders (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id            uuid NOT NULL REFERENCES companies(id),
  full_name             text NOT NULL,
  email                 citext,
  type                  stakeholder_type NOT NULL,
  account_id            uuid REFERENCES accounts(id),     -- linked when stakeholder claims portal
  portal_invite_sent_at timestamptz,
  portal_first_seen_at  timestamptz,
  is_entity             boolean NOT NULL DEFAULT false,   -- true if corporate stakeholder
  entity_registry_id    text,                              -- CVR / Org-nr if entity
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by_account_id uuid REFERENCES accounts(id),
  updated_by_account_id uuid REFERENCES accounts(id),
  deleted_at            timestamptz
);
CREATE INDEX idx_stakeholders_company ON stakeholders(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stakeholders_account ON stakeholders(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_stakeholders_email ON stakeholders(company_id, lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
```

Notes:
- `account_id` is nullable — a stakeholder doesn't have to have claimed the portal. When they click their magic link and confirm, we set this.
- Same email can be a stakeholder of multiple companies (Anna's employee grant from Company A is a different stakeholder row than her angel investment in Company B — both link to her single Account).

### 2.5 `securities` — issued instruments

```sql
CREATE TYPE security_category AS ENUM ('equity_unit', 'option_like', 'convertible');

CREATE TABLE securities (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id            uuid NOT NULL REFERENCES companies(id),
  stakeholder_id        uuid NOT NULL REFERENCES stakeholders(id),
  category              security_category NOT NULL,
  subtype               text NOT NULL,                     -- pack-defined, e.g. 'common_stock', 'iso', 'safe', 'tegningsoption'
  pack_version          text NOT NULL,                     -- inherited from company at creation
  quantity              numeric(20, 0),                    -- for equity_unit / option_like
  monetary_amount       numeric(20, 4),                    -- for convertible (SAFE / convertible loan)
  monetary_currency     char(3),
  strike_price          numeric(20, 6),                    -- for option_like
  strike_currency       char(3),
  cap_amount            numeric(20, 4),                    -- for SAFE / convertible
  cap_currency          char(3),
  discount_percent      numeric(5, 2),                     -- for SAFE / convertible
  share_class           text,                              -- e.g. 'common', 'preferred-seed', 'ordinary'

  -- Vesting (denormalized for the common case; see vesting_schedules for custom)
  vesting_start_date    date,
  vesting_total_months  int,
  vesting_cliff_months  int,
  vesting_frequency     text,                              -- 'monthly' / 'quarterly' / 'cliff_only'

  -- Tax scheme metadata
  tax_scheme            text,                              -- e.g. 'emi', 'iso', 'lh-7p', 'opsjonsskatteordningen', 'profits_interest'
  tax_scheme_metadata   jsonb DEFAULT '{}',                -- scheme-specific fields

  -- State
  status                text NOT NULL DEFAULT 'active',    -- 'active', 'cancelled', 'exercised', 'converted'
  status_changed_at     timestamptz,
  status_reason         text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by_account_id uuid REFERENCES accounts(id),
  updated_by_account_id uuid REFERENCES accounts(id),
  deleted_at            timestamptz,

  CHECK ((category = 'convertible') OR (quantity IS NOT NULL)),
  CHECK ((category != 'convertible') OR (monetary_amount IS NOT NULL))
);
CREATE INDEX idx_securities_company ON securities(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_securities_stakeholder ON securities(stakeholder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_securities_company_status ON securities(company_id, status) WHERE deleted_at IS NULL;
```

Notes:
- `subtype` is a string keyed against the pack's instrument catalog. Validated in application code against `pack_version`'s catalog.
- `tax_scheme_metadata` jsonb holds scheme-specific eligibility snapshots — at the time the grant was issued, was the company under 50 employees? Was the salary ratio under 10%? Frozen for audit.
- Custom vesting schedules (non-standard cliffs, milestones) go to a separate `vesting_schedules` table — see §2.10.

### 2.6 `transactions` — events on the ledger

```sql
CREATE TYPE transaction_type AS ENUM (
  'incorporation',
  'share_issuance',
  'option_grant',
  'safe_issuance',
  'convertible_issuance',
  'exercise',
  'cancellation',
  'transfer',
  'conversion',
  'pool_reservation',
  'pool_topup',
  'authorized_capital_change'
);

CREATE TABLE transactions (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id            uuid NOT NULL REFERENCES companies(id),
  type                  transaction_type NOT NULL,
  pack_version          text NOT NULL,                     -- inherited
  effective_date        date NOT NULL,
  recorded_at           timestamptz NOT NULL DEFAULT now(),

  -- Polymorphic targets — depends on type
  security_id           uuid REFERENCES securities(id),
  source_security_id    uuid REFERENCES securities(id),    -- for transfers / conversions
  stakeholder_id        uuid REFERENCES stakeholders(id),

  -- Numeric payload
  quantity              numeric(20, 0),
  monetary_amount       numeric(20, 4),
  monetary_currency     char(3),

  -- Free-form
  note                  text,
  founder_personal_note text,                              -- for grant emails to stakeholders
  metadata              jsonb DEFAULT '{}',                -- type-specific fields

  -- Approval / signing state
  approval_status       text NOT NULL DEFAULT 'recorded',  -- 'recorded' | 'awaiting_signature' | 'signed' | 'cancelled'
  approved_by_account_id uuid REFERENCES accounts(id),
  approved_at           timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by_account_id uuid REFERENCES accounts(id),
  updated_by_account_id uuid REFERENCES accounts(id),
  deleted_at            timestamptz
);
CREATE INDEX idx_transactions_company_date ON transactions(company_id, effective_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_security ON transactions(security_id) WHERE security_id IS NOT NULL;
CREATE INDEX idx_transactions_stakeholder ON transactions(stakeholder_id) WHERE stakeholder_id IS NOT NULL;
CREATE INDEX idx_transactions_type ON transactions(company_id, type);
```

Notes:
- Transactions are mostly append-only. Edits are allowed (with audit trail) for typos, but a *cancellation* is a new transaction referencing the original, not an UPDATE.
- `effective_date` (when the transaction is legally effective) is distinct from `recorded_at` (when we wrote it down). Backdating an issuance by a week is legitimate; both are stored.
- `pack_version` on the transaction means we can look at a 2026 grant and still apply 2026 § 7P rules even after the pack updates to 2028 rules.

### 2.7 `documents`

```sql
CREATE TABLE documents (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id            uuid NOT NULL REFERENCES companies(id),
  filename              text NOT NULL,
  storage_key           text NOT NULL,                     -- S3 / object storage key
  storage_region        data_region NOT NULL,              -- matches company.data_region
  content_type          text NOT NULL,
  byte_size             bigint NOT NULL,
  sha256_hash           bytea NOT NULL,                    -- tamper detection
  template_used         text,                              -- if generated from template, e.g. 'dk-aps-tegningsoption@1.2.0'

  -- Signing state (no native e-sign in v1)
  signed                boolean NOT NULL DEFAULT false,
  signed_at             timestamptz,
  signed_by             text,                              -- free-text countersigner

  -- Optional polymorphic links
  transaction_id        uuid REFERENCES transactions(id),
  stakeholder_id        uuid REFERENCES stakeholders(id),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by_account_id uuid REFERENCES accounts(id),
  updated_by_account_id uuid REFERENCES accounts(id),
  deleted_at            timestamptz
);
CREATE INDEX idx_documents_company ON documents(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_transaction ON documents(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_documents_template ON documents(template_used) WHERE template_used IS NOT NULL;
```

Notes:
- `storage_region` mirrors company region — never cross-region.
- `sha256_hash` lets us detect tampering and dedupe identical uploads.
- Per-tenant encryption at the storage layer (KEK per company, DEK per object).

### 2.8 `audit_events` — the tamper-evident log

```sql
CREATE TABLE audit_events (
  id                    bigserial PRIMARY KEY,             -- sequential, not uuid (helps replication ordering)
  company_id            uuid REFERENCES companies(id),     -- nullable for account-level events
  account_id            uuid REFERENCES accounts(id),      -- actor; nullable for system events
  occurred_at           timestamptz NOT NULL DEFAULT now(),
  action                text NOT NULL,                     -- 'transaction.created' | 'account.signed_in' | etc.
  entity_type           text,                              -- 'transaction' | 'stakeholder' | etc.
  entity_id             uuid,
  before_data           jsonb,
  after_data            jsonb,
  ip_address            inet,
  user_agent            text,
  session_id            uuid,

  -- For staff/admin events (admin.capframe.app)
  is_staff_action       boolean NOT NULL DEFAULT false,
  staff_reason          text,
  impersonating_account_id uuid REFERENCES accounts(id)
);
CREATE INDEX idx_audit_company_time ON audit_events(company_id, occurred_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX idx_audit_account_time ON audit_events(account_id, occurred_at DESC);
CREATE INDEX idx_audit_action_time ON audit_events(action, occurred_at DESC);
CREATE INDEX idx_audit_staff ON audit_events(occurred_at DESC) WHERE is_staff_action;

-- Hard guarantee: never UPDATE or DELETE from this table in application code.
-- Enforce by GRANTing only INSERT and SELECT to the app user.
REVOKE UPDATE, DELETE ON audit_events FROM app_user;
GRANT INSERT, SELECT ON audit_events TO app_user;

-- Cold-storage replication: logical replication to S3 with object-lock for 7 years.
```

Notes:
- `bigserial` not uuid: ordering matters for replication, and sequential integers are smaller.
- The `REVOKE ... DELETE` is what makes this append-only at the DB level, not just by convention.
- Retention job runs at 7+ years moving cold rows to S3 with object lock and deletes from hot store.

### 2.9 `subscriptions` — billing state

```sql
CREATE TYPE billing_plan AS ENUM ('free', 'pro', 'growth');

CREATE TABLE subscriptions (
  id                    uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id            uuid NOT NULL REFERENCES companies(id) UNIQUE,
  plan                  billing_plan NOT NULL DEFAULT 'free',
  stakeholder_limit     int NOT NULL DEFAULT 10,            -- free: 10, pro: 50, growth: unlimited (NULL)
  bonus_slots           int NOT NULL DEFAULT 0,             -- from referrals, cap at 20
  stripe_subscription_id text,
  stripe_customer_id    text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
```

Effective stakeholder limit = `stakeholder_limit + bonus_slots` (`NULL` plan limit = unlimited).

### 2.10 Supporting tables

**`vesting_schedules`** — for custom (non-standard) vesting only. Default vesting lives denormalized on `securities`.
```sql
CREATE TABLE vesting_schedules (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  security_id       uuid NOT NULL REFERENCES securities(id),
  events            jsonb NOT NULL,                        -- array of {date, quantity, reason} entries
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

**`referrals`** — tracking the viral loop.
```sql
CREATE TABLE referrals (
  id                   uuid PRIMARY KEY DEFAULT uuidv7(),
  referrer_account_id  uuid NOT NULL REFERENCES accounts(id),
  referred_account_id  uuid REFERENCES accounts(id),
  signup_at            timestamptz,
  company_created_at   timestamptz,                        -- when referral credit is earned
  bonus_credited       boolean NOT NULL DEFAULT false,
  via_stakeholder_portal boolean NOT NULL DEFAULT false,   -- did they come via a portal footer link
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_account_id);
```

**`invitations`** — pending magic-link invitations (members + stakeholders).
```sql
CREATE TYPE invitation_kind AS ENUM ('member', 'stakeholder');

CREATE TABLE invitations (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id          uuid NOT NULL REFERENCES companies(id),
  email               citext NOT NULL,
  kind                invitation_kind NOT NULL,
  role                membership_role,                     -- only for kind=member
  stakeholder_id      uuid REFERENCES stakeholders(id),    -- only for kind=stakeholder
  token_hash          bytea NOT NULL UNIQUE,
  expires_at          timestamptz NOT NULL,
  accepted_at         timestamptz,
  invited_by_account_id uuid NOT NULL REFERENCES accounts(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitations_company ON invitations(company_id);
CREATE INDEX idx_invitations_email ON invitations(email) WHERE accepted_at IS NULL;
```

**`scenarios`** — saved simulator scenarios.
```sql
CREATE TABLE scenarios (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id          uuid NOT NULL REFERENCES companies(id),
  name                text NOT NULL,
  inputs              jsonb NOT NULL,                      -- round size, pre-money, etc.
  share_token         text UNIQUE,                          -- if shareable read-only
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by_account_id uuid NOT NULL REFERENCES accounts(id)
);
```

### 2.11 i18n / translation registry

UI strings live in code (typed translation keys). What lives in the DB is *user-generated* localized content — e.g. the founder's personal note to a stakeholder, the company name.

```sql
-- Most user content is single-language. For the few cases where a company needs
-- bilingual content (e.g., share class names shown in both Danish and English on
-- exports), we use a JSONB column:
--    legal_name jsonb  -- { "default": "Acme ApS", "en": "Acme ApS", "da": "Acme ApS" }
-- Not a separate table — keeps it simple.
```

Translation keys for UI live in `/locales/{en,da,no,sv,de}.json` files in the application, not in the DB.

---

## 3. Row-Level Security (multi-tenancy enforcement)

The point of RLS: even if application code has a bug, a SELECT can't accidentally cross tenant boundaries. Belt and suspenders.

**Session context.** Every DB session sets two GUC variables before any query:
```sql
SET LOCAL app.current_account_id = '...uuid...';
SET LOCAL app.current_company_id = '...uuid...';  -- if scoped
SET LOCAL app.is_staff = false;                    -- true only for admin.capframe.app
```

**Example policy — `securities` table:**
```sql
ALTER TABLE securities ENABLE ROW LEVEL SECURITY;

-- Read access: members of the company can read
CREATE POLICY securities_select_member ON securities
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM memberships
      WHERE account_id = current_setting('app.current_account_id')::uuid
      AND deleted_at IS NULL
    )
    OR current_setting('app.is_staff', true)::boolean = true
  );

-- Stakeholder access: stakeholders can only read securities where they are
-- the linked account_id
CREATE POLICY securities_select_stakeholder ON securities
  FOR SELECT
  USING (
    stakeholder_id IN (
      SELECT id FROM stakeholders
      WHERE account_id = current_setting('app.current_account_id')::uuid
    )
  );

-- Write access: Admins/Editors only
CREATE POLICY securities_write_admin_editor ON securities
  FOR INSERT, UPDATE, DELETE
  USING (
    company_id IN (
      SELECT company_id FROM memberships
      WHERE account_id = current_setting('app.current_account_id')::uuid
      AND role IN ('admin', 'editor')
      AND deleted_at IS NULL
    )
  );
```

Every tenanted table gets the same pattern: SELECT for members + linked stakeholders + staff, WRITE for Admin/Editor only.

**Staff override:** the admin app sets `app.is_staff = true` before reads (impersonation uses a narrower override that we'll spec in admin app design).

---

## 4. Migration strategy

- **Tool:** application's standard migration framework (Prisma Migrate / golang-migrate / Phoenix Ecto / whichever matches the stack chosen).
- **Migrations are forward-only.** No DOWN migrations in production. Reverts happen via new forward migrations.
- **Two-phase column drops:** to remove column `foo`:
  1. Migration A: stop reading/writing `foo` in app code.
  2. Deploy A.
  3. Migration B: drop the column.
  This avoids the 30-second window where prod is half-deployed and SELECT * is broken.
- **All migrations tested on a production-data clone** in staging before prod. PII-redacted.
- **No long-running migrations on prod tables.** ALTER TABLE that requires a full rewrite (changing column type) is done via add-new-column → backfill → swap → drop pattern, never as one ALTER.
- **Migration metadata:** each migration logs to a `schema_migrations` table; the app refuses to start if pending migrations exist (fail-loud).

---

## 5. Indexes — beyond what's defined above

Initial set above covers obvious access patterns. Additional indexes to add based on profiling, not preemptively:
- Full-text search on stakeholder names (when search starts feeling slow): `pg_trgm` GIN index.
- Cap-table-as-of-date queries (when historical views are slow): may need a materialized view per company.
- Audit log queries by entity (when staff support gets slow): composite index on `(entity_type, entity_id, occurred_at)`.

Don't add these in v1. Profile first; add when needed.

---

## 6. Backups & recovery

- **PITR enabled with WAL archiving to S3.** Recovery point: 1 second precision. Recovery time: 30 minutes for full restore.
- **Retention:** 7 days hot (Free tier), 30 days hot (Pro+). 1 year cold (S3 glacier-equivalent) for all.
- **Daily snapshot to a different region.** EU primary → backup to EU secondary; US primary → backup to US secondary. Cross-region within the same regulatory zone only.
- **Quarterly restore drill:** actually restore to a sandbox cluster, query for a known transaction, confirm row count and `sha256_hash` integrity on documents. Documented in a runbook. **If we don't drill, our backups don't exist.**

---

## 7. Encryption

| Layer | What |
|---|---|
| In transit | TLS 1.3 to all endpoints (app, DB, S3, internal). HSTS on web. |
| DB at rest | Postgres TDE via cloud provider (AWS RDS encryption / Cloud SQL encryption); doesn't replace application encryption for sensitive fields. |
| App-level encryption | `totp_secret_encrypted`, `recovery_codes_hash` use envelope encryption: per-tenant DEK encrypted by master KEK in KMS. Means rotating the master key doesn't require re-encrypting every row. |
| Object storage | Per-tenant DEK for documents. Document bytes encrypted client-side before upload. |
| Backups | Encrypted at rest with separate keys from prod (key separation). |

---

## 8. Open items

1. **ORM / query layer choice.** Depends on tech stack (TypeScript: Prisma vs Drizzle vs Kysely; Python: SQLAlchemy vs SQLModel; Go: sqlc; Ruby: ActiveRecord). RLS support varies — Prisma's RLS support is recent and not great; Kysely + raw SQL works well; sqlc is excellent.
2. **`uuidv7()` source.** The `pg_uuidv7` extension is reasonable; application-side generation (Node has `uuidv7` packages) is also fine. Pick one and stick to it.
3. **Audit log replication to S3 object-lock.** Logical replication, Debezium, or a periodic batch job? Lowest-complexity option for v1 is a Postgres job that batches rows older than 24h to S3 with object lock; debezium / CDC for v2.
4. **Multi-region failover.** EU and US are independent regions, not active-active. If EU goes down, EU customers can't use the product until EU comes back. Acceptable for v1; might rethink at scale.
5. **Currency conversion for cross-currency cap tables.** A UK Ltd. accepting NOK from a Norwegian VC. Today: store both with their native currency. Future: snapshotted FX rates per transaction for reporting. Out of v1 unless customer asks.
6. **GDPR data deletion mechanics.** Soft delete is default. Hard delete (account.delete request) needs a separate workflow that purges PII while preserving audit metadata. Spec deferred.

---

## 9. Currency handling

Already enforced at the column level (every money column paired with `*_currency`). Two additional pieces:

**`fx_rates` table** — daily snapshot of ECB reference rates:
```sql
CREATE TABLE fx_rates (
  rate_date         date NOT NULL,
  base_currency     char(3) NOT NULL,                    -- always 'EUR' for ECB
  quote_currency    char(3) NOT NULL,
  rate              numeric(20, 8) NOT NULL,
  source            text NOT NULL DEFAULT 'ecb',
  PRIMARY KEY (rate_date, base_currency, quote_currency)
);
CREATE INDEX idx_fx_rates_quote_date ON fx_rates(quote_currency, rate_date DESC);
```

- Loaded daily via a job pulling ECB reference rates (`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`).
- Cross-rate computation (e.g., GBP→NOK) goes via EUR: `rate(GBP→NOK) = rate(EUR→NOK) / rate(EUR→GBP)`.
- Historical retention: forever. Cheap to store; expensive to lose.

**FX rate snapshotting on transactions:** when a transaction is created in a non-company-primary currency, the FX rate to the company's primary currency is computed and stored on the transaction:
```sql
ALTER TABLE transactions ADD COLUMN fx_rate_to_company_primary numeric(20, 8);
ALTER TABLE transactions ADD COLUMN fx_rate_date date;
```
This rate is **never re-fetched.** A 2026 SAFE issued in NOK to a GBP company shows the same converted value in 2030 as it did on the day it was recorded.

## 10. Timezone handling

- All `timestamptz` stored UTC. Postgres does this natively as long as you never use plain `timestamp` (without TZ).
- Account-level preference: `accounts.display_timezone text NOT NULL DEFAULT 'UTC'` (IANA name, e.g. `Europe/Copenhagen`).
- Date-only fields (vesting start, transaction effective date, incorporation date) use `date`, not `timestamptz`. They are timezone-independent.
- Application layer renders timestamps in the viewer's TZ. SQL queries that need TZ awareness use `AT TIME ZONE`:
  ```sql
  SELECT occurred_at AT TIME ZONE accounts.display_timezone
  FROM audit_events
  JOIN accounts ON accounts.id = $1;
  ```

**Scheduled email job:** runs every 15 minutes scanning for emails due within the next 30 minutes in the recipient's local time. Recipients in `Europe/Oslo` get their daily vest update at 08:00 Oslo; recipients in `America/Los_Angeles` get it at 08:00 PT — the same job, different fire times.

**Statutory deadline computation** (83(b), EMI notification, etc.) uses the company's *jurisdiction TZ*, displayed alongside the viewer's TZ when they differ:
- 83(b): 30 days from grant in `America/New_York` (IRS doesn't quibble about state TZ, but ET is the safe default for federal).
- EMI notification: 92 days in `Europe/London`.
- Opsjonsskatteordningen notification: 1 month in `Europe/Oslo`.

## 11. Cross-company stakeholder query patterns

The portfolio dashboard (§5.23 of the main scope) needs queries that span companies. The data model handles this naturally because Stakeholder rows are joined to a single Account.

**Example: portfolio summary for the signed-in Account.**
```sql
-- All companies in which I (current account) have a stakeholder row,
-- with my latest grant in each.
SELECT
  c.id              AS company_id,
  c.display_name,
  c.jurisdiction,
  c.entity_type,
  c.currency        AS company_currency,
  s.id              AS stakeholder_id,
  s.type            AS stakeholder_type,
  COUNT(sec.id)     AS active_securities,
  SUM(CASE WHEN sec.category = 'equity_unit' THEN sec.quantity ELSE 0 END) AS owned_units,
  SUM(CASE WHEN sec.category = 'option_like' THEN sec.quantity ELSE 0 END) AS option_units
FROM stakeholders s
JOIN companies c ON c.id = s.company_id AND c.deleted_at IS NULL
LEFT JOIN securities sec ON sec.stakeholder_id = s.id
  AND sec.status = 'active'
  AND sec.deleted_at IS NULL
WHERE s.account_id = current_setting('app.current_account_id')::uuid
  AND s.deleted_at IS NULL
GROUP BY c.id, c.display_name, c.jurisdiction, c.entity_type, c.currency,
         s.id, s.type
ORDER BY c.display_name;
```

**RLS implication:** this query crosses tenant boundaries (multiple `company_id` values). RLS policies on `stakeholders` and `securities` must permit reading rows where the Account is linked as the stakeholder:

```sql
-- stakeholders SELECT policy already supports this via the stakeholder-account link.
-- Add to securities:
CREATE POLICY securities_select_own_stakeholder ON securities
  FOR SELECT
  USING (
    stakeholder_id IN (
      SELECT id FROM stakeholders
      WHERE account_id = current_setting('app.current_account_id')::uuid
        AND deleted_at IS NULL
    )
  );
```

This policy is ANDed with the existing member-based policy, so an Account can see a security if EITHER they're a member of the company OR they're the linked stakeholder.

**Privacy guarantee:** the portfolio query returns only rows where the Account is the stakeholder. It does *not* return other stakeholders' rows in those companies. A stakeholder's portfolio view doesn't leak who else is on the table.

**Companies don't see each other through stakeholders.** Acme querying its stakeholder list gets `account_id IS NOT NULL` rows but cannot dereference the account to enumerate other memberships. The `accounts` table RLS prevents this — admins of Company A can only see Account fields for accounts who are members or stakeholders of A.

---

## 12. Summary: tables and rough row counts at v1 launch scale

Assuming 10k companies × ~25 stakeholders × ~50 transactions over their lifetime:

| Table | Rough row count | Notes |
|---|---|---|
| accounts | ~50k | Founders + stakeholders + staff |
| companies | ~10k | |
| memberships | ~30k | Avg 3 admin/editor/viewer per company |
| stakeholders | ~250k | |
| securities | ~250k | Roughly one per stakeholder per grant |
| transactions | ~500k | |
| documents | ~250k | |
| audit_events | ~50M | The big one. Every UI action, every login. |
| subscriptions | ~10k | |
| invitations | ~100k | Pending + accepted |
| referrals | ~5k | |

Trivial scale for Postgres on a modest cloud instance (db.r7g.large or equivalent). Profile-then-tune; do not preemptively shard.

---
