import { db } from '@/db'
import { upload, user } from '@/db/schema'
import { env } from '@/env'
import { sendUploadFailedTask } from '@/trigger/emails/send-upload-failed'
import { logger, task } from '@trigger.dev/sdk/v3'
import { and, eq, ne } from 'drizzle-orm'
import { categorizeAndImportTransactionsTask } from './categorize-and-import-transactions'
import { extractUploadMetadataTask } from './extract-upload-metadata'
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

      const [failedUpload] = await db
        .select({ fileName: upload.fileName, userId: upload.userId })
        .from(upload)
        .where(eq(upload.id, payload.uploadId))

      await db
        .update(upload)
        .set({
          status: 'failed',
          failedReason: review.reason,
        })
        .where(eq(upload.id, payload.uploadId))

      if (failedUpload) {
        const [uploadUser] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, failedUpload.userId))

        if (uploadUser) {
          await sendUploadFailedTask.trigger({
            to: uploadUser.email,
            fileName: failedUpload.fileName,
            uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
          })
        }
      }

      return { success: true }
    }

    logger.info(
      `Bank statement ${payload.uploadId} is valid. Extracting its metadata in background...`,
    )
    await extractUploadMetadataTask.trigger({
      uploadId: payload.uploadId,
    })

    logger.info(
      `Sending upload ${payload.uploadId} to the categorize and import transactions task...`,
    )
    await categorizeAndImportTransactionsTask.trigger({
      uploadId: payload.uploadId,
    })

    return { success: true }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

    const [failedUpload] = await db
      .select({ fileName: upload.fileName, userId: upload.userId })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))

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

    if (failedUpload) {
      const [uploadUser] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, failedUpload.userId))

      if (uploadUser) {
        await sendUploadFailedTask.trigger({
          to: uploadUser.email,
          fileName: failedUpload.fileName,
          uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
        })
      }
    }

    return {
      skipRetrying: true,
    }
  },
})
