COMMIT;
ALTER TABLE "category" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX CONCURRENTLY "category_deleted_idx" ON "category" USING btree ("deleted");