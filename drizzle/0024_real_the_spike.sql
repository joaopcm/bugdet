ALTER TYPE "public"."upload_status" ADD VALUE 'waiting_for_password';--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "encrypted_password" text;