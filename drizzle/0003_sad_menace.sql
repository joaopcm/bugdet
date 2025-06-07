ALTER TABLE "upload" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "upload" ALTER COLUMN "status" SET DEFAULT 'queued'::text;--> statement-breakpoint
DROP TYPE "public"."upload_status";--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "upload" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."upload_status";--> statement-breakpoint
ALTER TABLE "upload" ALTER COLUMN "status" SET DATA TYPE "public"."upload_status" USING "status"::"public"."upload_status";