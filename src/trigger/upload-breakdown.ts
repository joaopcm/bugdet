import { db } from '@/db'
import { upload } from '@/db/schema'
import { logger, task } from '@trigger.dev/sdk/v3'
import { eq } from 'drizzle-orm'
import { reviewBankStatementTask } from './review-bank-statement'

export const uploadBreakdownTask = task({
  id: 'upload-breakdown',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Processing upload ${payload.uploadId}...`, { payload, ctx })

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
        })
        .where(eq(upload.id, payload.uploadId))

      return { success: true }
    }

    logger.info(
      `Bank statement ${payload.uploadId} is valid. Breaking it down into smaller batches to import transactions...`,
    )

    return { success: true }
  },
})
