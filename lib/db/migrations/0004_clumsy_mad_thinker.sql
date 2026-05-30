CREATE TABLE "share_classes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"seniority" integer DEFAULT 0 NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"liquidation_preference_multiple" numeric(8, 2),
	"participating" boolean DEFAULT false NOT NULL,
	"votes_per_share" numeric(12, 4),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	"updated_by_account_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "share_classes" ADD CONSTRAINT "share_classes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_classes" ADD CONSTRAINT "share_classes_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_classes" ADD CONSTRAINT "share_classes_updated_by_account_id_accounts_id_fk" FOREIGN KEY ("updated_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_share_classes_company_name" ON "share_classes" USING btree ("company_id",lower("name")) WHERE "share_classes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_share_classes_company" ON "share_classes" USING btree ("company_id") WHERE "share_classes"."deleted_at" IS NULL;