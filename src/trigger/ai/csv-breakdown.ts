import { logger, task } from "@trigger.dev/sdk/v3";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { upload, user } from "@/db/schema";
import { env } from "@/env";
import { getUserIdFromTenant } from "@/lib/tenant";
import { sendUploadFailedTask } from "@/trigger/emails/send-upload-failed";
import { categorizeAndImportTransactionsTask } from "./categorize-and-import-transactions";
import { extractTransactionsCsvTask } from "./extract-transactions-csv";

export const csvBreakdownTask = task({
  id: "csv-breakdown",
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Processing CSV upload ${payload.uploadId}...`, {
      payload,
      ctx,
    });

    const [existingUpload] = await db
      .select({
        id: upload.id,
        fileName: upload.fileName,
        filePath: upload.filePath,
        tenantId: upload.tenantId,
        metadata: upload.metadata,
      })
      .from(upload)
      .where(eq(upload.id, payload.uploadId));

    if (!existingUpload) {
      logger.error(`Upload ${payload.uploadId} not found`);
      return { success: false, reason: "Upload not found" };
    }

    const userId = await getUserIdFromTenant(existingUpload.tenantId);
    if (!userId) {
      logger.error("Tenant not found for upload");
      return { success: false, reason: "Tenant not found" };
    }

    const [uploadUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId));

    if (!uploadUser) {
      logger.error("User not found for upload");
      return { success: false, reason: "User not found" };
    }

    await db
      .update(upload)
      .set({ status: "processing" })
      .where(eq(upload.id, payload.uploadId));

    logger.info(`Extracting transactions from CSV ${payload.uploadId}...`);
    const extractionResult = await extractTransactionsCsvTask
      .triggerAndWait({ uploadId: payload.uploadId })
      .unwrap();

    logger.info(
      `Extracted ${extractionResult.transactions.length} transactions. Sending to categorize and import task...`
    );
    await categorizeAndImportTransactionsTask.trigger({
      uploadId: payload.uploadId,
      tenantId: extractionResult.tenantId,
      transactions: extractionResult.transactions,
      statementCurrency: extractionResult.statementCurrency,
      openingBalance: extractionResult.openingBalance,
      closingBalance: extractionResult.closingBalance,
    });

    return { success: true };
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, { payload, error });

    const [failedUpload] = await db
      .select({ fileName: upload.fileName, tenantId: upload.tenantId })
      .from(upload)
      .where(eq(upload.id, payload.uploadId));

    await db
      .update(upload)
      .set({
        status: "failed",
        failedReason:
          "I'm sorry, I had a hard time processing your CSV file. Please try again later.",
      })
      .where(
        and(eq(upload.id, payload.uploadId), ne(upload.status, "cancelled"))
      );

    if (failedUpload) {
      const userId = await getUserIdFromTenant(failedUpload.tenantId);
      if (userId) {
        const [uploadUser] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId));

        if (uploadUser) {
          await sendUploadFailedTask.trigger({
            to: uploadUser.email,
            fileName: failedUpload.fileName,
            uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
          });
        }
      }
    }

    return { skipRetrying: true };
  },
});
