CREATE TABLE "budget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_amount" integer NOT NULL,
	"currency" text NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_tenant_id_user_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user_tenant"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_category" ADD CONSTRAINT "budget_category_budget_id_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_category" ADD CONSTRAINT "budget_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_tenant_id_idx" ON "budget" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "budget_deleted_idx" ON "budget" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "budget_category_budget_id_idx" ON "budget_category" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "budget_category_category_id_idx" ON "budget_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budget_category_unique_idx" ON "budget_category" USING btree ("budget_id","category_id");