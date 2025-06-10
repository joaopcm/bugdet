import { db } from '@/db'
import { upload } from '@/db/schema'
import { logger, task } from '@trigger.dev/sdk/v3'
import { and, eq, ne } from 'drizzle-orm'
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
      `Bank statement ${payload.uploadId} is valid. Breaking it down into smaller batches to import transactions...`,
    )

    await db
      .update(upload)
      .set({
        // TODO: Instead of setting the status to completed, we should trigger another task to break down the bank statement into smaller batches and store the transactions in the database.
        status: 'completed',
        metadata: review.metadata,
      })
      .where(eq(upload.id, payload.uploadId))

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
