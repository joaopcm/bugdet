CREATE TABLE "merchant_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_name" text NOT NULL,
	"user_id" text NOT NULL,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchant_category" ADD CONSTRAINT "merchant_category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_category" ADD CONSTRAINT "merchant_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_merchant_user" ON "merchant_category" USING btree ("merchant_name","user_id");--> statement-breakpoint
CREATE INDEX "merchant_name_idx" ON "merchant_category" USING btree ("merchant_name");