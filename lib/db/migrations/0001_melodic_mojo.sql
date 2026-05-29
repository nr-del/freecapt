CREATE TYPE "public"."billing_plan" AS ENUM('free', 'pro', 'growth');--> statement-breakpoint
CREATE TYPE "public"."security_category" AS ENUM('equity_unit', 'option_like', 'convertible');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('incorporation', 'share_issuance', 'option_grant', 'safe_issuance', 'convertible_issuance', 'exercise', 'cancellation', 'transfer', 'conversion', 'pool_reservation', 'pool_topup', 'authorized_capital_change');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"company_id" uuid,
	"account_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"before_data" jsonb,
	"after_data" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"session_id" uuid,
	"is_staff_action" boolean DEFAULT false NOT NULL,
	"staff_reason" text,
	"impersonating_account_id" uuid
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"storage_region" "data_region" NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256_hash" "bytea" NOT NULL,
	"template_used" text,
	"signed" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp with time zone,
	"signed_by" text,
	"transaction_id" uuid,
	"stakeholder_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"stakeholder_id" uuid NOT NULL,
	"category" "security_category" NOT NULL,
	"subtype" text NOT NULL,
	"pack_version" text NOT NULL,
	"quantity" numeric(20, 0),
	"monetary_amount" numeric(20, 4),
	"monetary_currency" char(3),
	"strike_price" numeric(20, 6),
	"strike_currency" char(3),
	"cap_amount" numeric(20, 4),
	"cap_currency" char(3),
	"discount_percent" numeric(5, 2),
	"share_class" text,
	"vesting_start_date" date,
	"vesting_total_months" integer,
	"vesting_cliff_months" integer,
	"vesting_frequency" text,
	"tax_scheme" text,
	"tax_scheme_metadata" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"status_changed_at" timestamp with time zone,
	"status_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "ck_securities_quantity" CHECK (("securities"."category" = 'convertible') OR ("securities"."quantity" IS NOT NULL)),
	CONSTRAINT "ck_securities_monetary" CHECK (("securities"."category" != 'convertible') OR ("securities"."monetary_amount" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"plan" "billing_plan" DEFAULT 'free' NOT NULL,
	"stakeholder_limit" integer DEFAULT 10 NOT NULL,
	"bonus_slots" integer DEFAULT 0 NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_companyId_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"pack_version" text NOT NULL,
	"effective_date" date NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"security_id" uuid,
	"source_security_id" uuid,
	"stakeholder_id" uuid,
	"quantity" numeric(20, 0),
	"monetary_amount" numeric(20, 4),
	"monetary_currency" char(3),
	"note" text,
	"founder_personal_note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"approval_status" text DEFAULT 'recorded' NOT NULL,
	"approved_by_account_id" uuid,
	"approved_at" timestamp with time zone,
	"fx_rate_to_company_primary" numeric(20, 8),
	"fx_rate_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vesting_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"security_id" uuid NOT NULL,
	"events" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_impersonating_account_id_accounts_id_fk" FOREIGN KEY ("impersonating_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securities" ADD CONSTRAINT "securities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securities" ADD CONSTRAINT "securities_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securities" ADD CONSTRAINT "securities_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securities" ADD CONSTRAINT "securities_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_security_id_securities_id_fk" FOREIGN KEY ("source_security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_account_id_accounts_id_fk" FOREIGN KEY ("approved_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vesting_schedules" ADD CONSTRAINT "vesting_schedules_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_company_time" ON "audit_events" USING btree ("company_id","occurred_at" DESC NULLS LAST) WHERE "audit_events"."company_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_account_time" ON "audit_events" USING btree ("account_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_action_time" ON "audit_events" USING btree ("action","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_staff" ON "audit_events" USING btree ("occurred_at" DESC NULLS LAST) WHERE "audit_events"."is_staff_action";--> statement-breakpoint
CREATE INDEX "idx_documents_company" ON "documents" USING btree ("company_id") WHERE "documents"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_documents_transaction" ON "documents" USING btree ("transaction_id") WHERE "documents"."transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_documents_template" ON "documents" USING btree ("template_used") WHERE "documents"."template_used" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_securities_company" ON "securities" USING btree ("company_id") WHERE "securities"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_securities_stakeholder" ON "securities" USING btree ("stakeholder_id") WHERE "securities"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_securities_company_status" ON "securities" USING btree ("company_id","status") WHERE "securities"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_sub" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_company_date" ON "transactions" USING btree ("company_id","effective_date" DESC NULLS LAST) WHERE "transactions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_transactions_security" ON "transactions" USING btree ("security_id") WHERE "transactions"."security_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_transactions_stakeholder" ON "transactions" USING btree ("stakeholder_id") WHERE "transactions"."stakeholder_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_transactions_type" ON "transactions" USING btree ("company_id","type");