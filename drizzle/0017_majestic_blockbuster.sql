COMMIT;
DROP INDEX "unique_merchant_user";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "category_user_id_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "merchant_category_user_id_idx" ON "merchant_category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "merchant_category_category_id_idx" ON "merchant_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_user_id_idx" ON "transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_upload_id_idx" ON "transaction" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_category_id_idx" ON "transaction" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_confidence_idx" ON "transaction" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_date_idx" ON "transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "transaction_deleted_idx" ON "transaction" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "upload_user_id_idx" ON "upload" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "upload_deleted_idx" ON "upload" USING btree ("deleted");