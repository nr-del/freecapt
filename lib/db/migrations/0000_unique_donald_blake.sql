CREATE EXTENSION IF NOT EXISTS "citext";--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('active', 'archived', 'pending_deletion');--> statement-breakpoint
CREATE TYPE "public"."data_region" AS ENUM('eu-fra', 'us-east');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('dk-aps', 'dk-as', 'no-as', 'no-asa', 'uk-ltd', 'us-de-ccorp', 'us-de-llc');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_code" AS ENUM('dk', 'no', 'uk', 'us');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."stakeholder_type" AS ENUM('founder', 'employee', 'investor', 'advisor', 'entity', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" "citext" NOT NULL,
	"full_name" text,
	"language" char(2) DEFAULT 'en' NOT NULL,
	"display_timezone" text DEFAULT 'UTC' NOT NULL,
	"totp_secret_encrypted" "bytea",
	"recovery_codes_hash" text[],
	"referral_code" text NOT NULL,
	"referred_by_account_id" uuid,
	"email_verified_at" timestamp with time zone,
	"last_signed_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_email_unique" UNIQUE("email"),
	CONSTRAINT "accounts_referralCode_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"legal_name" text NOT NULL,
	"jurisdiction" "jurisdiction_code" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"pack_version" text NOT NULL,
	"registry_identifier" text,
	"registry_identifier_verified_at" timestamp with time zone,
	"incorporation_date" date,
	"data_region" "data_region" NOT NULL,
	"currency" char(3) NOT NULL,
	"authorized_units" numeric(20, 0),
	"par_value" numeric(20, 6),
	"par_value_currency" char(3),
	"status" "company_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"invited_by_account_id" uuid,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" "citext",
	"type" "stakeholder_type" NOT NULL,
	"account_id" uuid,
	"portal_invite_sent_at" timestamp with time zone,
	"portal_first_seen_at" timestamp with time zone,
	"is_entity" boolean DEFAULT false NOT NULL,
	"entity_registry_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_referred_by_account_id_accounts_id_fk" FOREIGN KEY ("referred_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_account_id_accounts_id_fk" FOREIGN KEY ("invited_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_referral_code" ON "accounts" USING btree ("referral_code") WHERE "accounts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_accounts_referred_by" ON "accounts" USING btree ("referred_by_account_id");--> statement-breakpoint
CREATE INDEX "idx_companies_jurisdiction" ON "companies" USING btree ("jurisdiction") WHERE "companies"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_companies_data_region" ON "companies" USING btree ("data_region");--> statement-breakpoint
CREATE INDEX "idx_companies_registry_id" ON "companies" USING btree ("jurisdiction","registry_identifier") WHERE "companies"."registry_identifier" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_memberships_account_company" ON "memberships" USING btree ("account_id","company_id") WHERE "memberships"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_memberships_account" ON "memberships" USING btree ("account_id") WHERE "memberships"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_memberships_company" ON "memberships" USING btree ("company_id") WHERE "memberships"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_stakeholders_company" ON "stakeholders" USING btree ("company_id") WHERE "stakeholders"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_stakeholders_account" ON "stakeholders" USING btree ("account_id") WHERE "stakeholders"."account_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_stakeholders_email" ON "stakeholders" USING btree ("company_id",lower("email")) WHERE "stakeholders"."email" IS NOT NULL AND "stakeholders"."deleted_at" IS NULL;