CREATE TABLE "user_tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id_hash" text NOT NULL,
	"user_id_encrypted" text NOT NULL,
	"dek_encrypted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tenant_tenant_id_unique" UNIQUE("tenant_id"),
	CONSTRAINT "user_tenant_user_id_hash_unique" UNIQUE("user_id_hash")
);
--> statement-breakpoint
ALTER TABLE "categorization_rule" DROP CONSTRAINT "categorization_rule_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "upload" DROP CONSTRAINT "upload_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "categorization_rule_user_id_idx";--> statement-breakpoint
DROP INDEX "category_user_id_idx";--> statement-breakpoint
DROP INDEX "transaction_user_id_idx";--> statement-breakpoint
DROP INDEX "upload_user_id_idx";--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "user_tenant_tenant_id_idx" ON "user_tenant" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_tenant_user_id_hash_idx" ON "user_tenant" USING btree ("user_id_hash");--> statement-breakpoint
ALTER TABLE "categorization_rule" ADD CONSTRAINT "categorization_rule_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categorization_rule_tenant_id_idx" ON "categorization_rule" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "category_tenant_id_idx" ON "category" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "transaction_tenant_id_idx" ON "transaction" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "upload_tenant_id_idx" ON "upload" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "categorization_rule" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "upload" DROP COLUMN "user_id";