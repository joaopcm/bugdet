ALTER TABLE "upload" RENAME COLUMN "filename" TO "file_name";--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "file_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "file_size" integer NOT NULL;