import { db } from '@/db'
import { transaction, upload } from '@/db/schema'
import { logger, task } from '@trigger.dev/sdk/v3'
import { and, eq, ne } from 'drizzle-orm'
import { categorizeAndImportTransactionsTask } from './categorize-and-import-transactions'
import { reviewBankStatementTask } from './review-bank-statement'

export const uploadBreakdownTask = task({
  id: 'upload-breakdown',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Processing upload ${payload.uploadId}...`, { payload, ctx })

    await db
      .update(upload)
      .set({
        status: 'processing',
      })
      .where(eq(upload.id, payload.uploadId))

    const review = await reviewBankStatementTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

    if (!review.isValid) {
      logger.warn(
        `Stopping processing upload ${payload.uploadId} because the bank statement is not valid`,
        { review },
      )

      await db
        .update(upload)
        .set({
          status: 'failed',
          failedReason: review.reason,
          metadata: review.metadata,
        })
        .where(eq(upload.id, payload.uploadId))

      return { success: true }
    }

    logger.info(
      `Bank statement ${payload.uploadId} is valid. Sending it to the categorize and import transactions task...`,
    )

    await db
      .update(upload)
      .set({
        metadata: review.metadata,
      })
      .where(eq(upload.id, payload.uploadId))

    const { transactions } = await categorizeAndImportTransactionsTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

    await db.transaction(async (tx) => {
      const [upToDateUpload] = await tx
        .select({ status: upload.status, userId: upload.userId })
        .from(upload)
        .where(eq(upload.id, payload.uploadId))

      if (upToDateUpload.status !== 'processing') {
        logger.warn(
          `Stopping processing upload ${payload.uploadId} because it is not in a processing status anymore.`,
        )
        return { success: true }
      }

      const uniqueCategories = [
        ...new Set(transactions.map((transaction) => transaction.category)),
      ]
      logger.info('Unique categories found:', {
        uniqueCategories,
      })

      await tx.insert(transaction).values(
        transactions.map((transaction) => ({
          uploadId: payload.uploadId,
          userId: upToDateUpload.userId,
          date: transaction.date,
          merchantName: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          metadata: transaction.metadata,
        })),
      )
      logger.info(
        `Imported ${transactions.length} transactions to the database for upload ${payload.uploadId}.`,
      )

      await tx
        .update(upload)
        .set({
          status: 'completed',
        })
        .where(eq(upload.id, payload.uploadId))
    })

    return { success: true }
  },
  handleError: async (payload, error, { ctx }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

    await db
      .update(upload)
      .set({
        status: 'failed',
        failedReason:
          "I'm sorry, I had a hard time processing your request. Please try again later.",
      })
      .where(
        and(eq(upload.id, payload.uploadId), ne(upload.status, 'cancelled')),
      )

    return {
      skipRetrying: true,
    }
  },
})
