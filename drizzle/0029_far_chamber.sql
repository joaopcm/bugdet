ALTER TABLE "upload" ADD COLUMN "pdf_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "upload" SET "pdf_deleted" = true WHERE "status" = 'failed';