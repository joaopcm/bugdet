CREATE TYPE "public"."file_type" AS ENUM('pdf', 'csv');--> statement-breakpoint
ALTER TYPE "public"."upload_status" ADD VALUE 'waiting_for_csv_answers';--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "file_type" "file_type" DEFAULT 'pdf' NOT NULL;