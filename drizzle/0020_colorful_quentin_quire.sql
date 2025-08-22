COMMIT;--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_merchant_name_idx" ON "transaction" USING btree ("merchant_name");