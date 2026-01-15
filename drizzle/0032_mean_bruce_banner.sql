DROP INDEX "budget_category_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "budget_category_unique_idx" ON "budget_category" USING btree ("budget_id","category_id");