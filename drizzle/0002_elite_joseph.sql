CREATE TYPE "public"."upload_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "upload" RENAME COLUMN "url" TO "filename";--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "status" "upload_status" DEFAULT 'pending' NOT NULL;