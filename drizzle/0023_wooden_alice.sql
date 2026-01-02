CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"granted_access" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"granted_at" timestamp,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DROP INDEX "categorization_rule_user_id_idx";--> statement-breakpoint
DROP INDEX "categorization_rule_priority_idx";--> statement-breakpoint
DROP INDEX "categorization_rule_deleted_idx";--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_granted_access_idx" ON "waitlist" USING btree ("granted_access");--> statement-breakpoint
CREATE INDEX "categorization_rule_user_id_idx" ON "categorization_rule" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categorization_rule_priority_idx" ON "categorization_rule" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "categorization_rule_deleted_idx" ON "categorization_rule" USING btree ("deleted");