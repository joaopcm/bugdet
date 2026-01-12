ALTER TABLE "transaction" ADD COLUMN "fingerprint" text;--> statement-breakpoint
CREATE INDEX "transaction_fingerprint_idx" ON "transaction" USING btree ("fingerprint");