CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"share_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_account_id" uuid,
	CONSTRAINT "scenarios_shareToken_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_scenarios_company" ON "scenarios" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_share_token" ON "scenarios" USING btree ("share_token") WHERE "scenarios"."share_token" IS NOT NULL;