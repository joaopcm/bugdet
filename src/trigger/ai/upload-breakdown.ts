import { db } from '@/db'
import { upload, user } from '@/db/schema'
import { env } from '@/env'
import { decryptPassword } from '@/lib/crypto'
import {
  PdfIncorrectPasswordError,
  checkPdfPassword,
  decryptPdf,
} from '@/lib/pdf'
import { createLambdaClient } from '@/lib/supabase/server'
import { sendPasswordRequiredTask } from '@/trigger/emails/send-password-required'
import { sendUploadFailedTask } from '@/trigger/emails/send-upload-failed'
import { sendWrongPasswordTask } from '@/trigger/emails/send-wrong-password'
import { logger, retry, task } from '@trigger.dev/sdk/v3'
import { and, eq, ne } from 'drizzle-orm'
import { categorizeAndImportTransactionsTask } from './categorize-and-import-transactions'
import { extractTransactionsTask } from './extract-transactions'
import { extractUploadMetadataTask } from './extract-upload-metadata'
import { reviewBankStatementTask } from './review-bank-statement'

export const uploadBreakdownTask = task({
  id: 'upload-breakdown',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Processing upload ${payload.uploadId}...`, { payload, ctx })

    const [existingUpload] = await db
      .select({
        id: upload.id,
        fileName: upload.fileName,
        filePath: upload.filePath,
        userId: upload.userId,
        encryptedPassword: upload.encryptedPassword,
      })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))

    if (!existingUpload) {
      logger.error(`Upload ${payload.uploadId} not found`)
      return { success: false, reason: 'Upload not found' }
    }

    await db
      .update(upload)
      .set({
        status: 'processing',
      })
      .where(eq(upload.id, payload.uploadId))

    const [uploadUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, existingUpload.userId))

    if (!uploadUser) {
      logger.error(`User ${existingUpload.userId} not found`)
      return { success: false, reason: 'User not found' }
    }

    const supabase = createLambdaClient()
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('bank-statements')
        .createSignedUrl(existingUpload.filePath, 60 * 15)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logger.error(`Failed to get signed URL for upload ${payload.uploadId}`, {
        error: signedUrlError?.message,
      })
      throw new Error('Failed to get signed URL')
    }

    logger.info(`Downloading file for upload ${payload.uploadId}...`)
    const response = await retry.fetch(signedUrlData.signedUrl, {
      method: 'GET',
    })
    const fileBuffer = await response.arrayBuffer()

    const storedPassword = existingUpload.encryptedPassword
      ? decryptPassword(existingUpload.encryptedPassword)
      : undefined

    try {
      const pdfStatus = await checkPdfPassword(fileBuffer, storedPassword)

      if (pdfStatus.encrypted && pdfStatus.needsPassword) {
        logger.info(
          `Upload ${payload.uploadId} is password-protected, requesting password...`,
        )

        await db
          .update(upload)
          .set({ status: 'waiting_for_password' })
          .where(eq(upload.id, payload.uploadId))

        await sendPasswordRequiredTask.trigger({
          to: uploadUser.email,
          fileName: existingUpload.fileName,
          uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
        })

        return { success: true, status: 'waiting_for_password' }
      }

      if (pdfStatus.encrypted && !pdfStatus.needsPassword && storedPassword) {
        logger.info(
          `Upload ${payload.uploadId} password verified, decrypting...`,
        )

        const decryptedBuffer = await decryptPdf(fileBuffer, storedPassword)

        logger.info(
          `Replacing encrypted file with decrypted version for upload ${payload.uploadId}...`,
        )
        const { error: uploadError } = await supabase.storage
          .from('bank-statements')
          .upload(existingUpload.filePath, decryptedBuffer, {
            upsert: true,
            contentType: 'application/pdf',
          })

        if (uploadError) {
          logger.error(
            `Failed to upload decrypted file for upload ${payload.uploadId}`,
            { error: uploadError.message },
          )
          throw new Error('Failed to upload decrypted file')
        }

        await db
          .update(upload)
          .set({ encryptedPassword: null })
          .where(eq(upload.id, payload.uploadId))

        logger.info(
          `Successfully decrypted and replaced file for upload ${payload.uploadId}`,
        )
      }
    } catch (error) {
      if (error instanceof PdfIncorrectPasswordError) {
        logger.warn(
          `Incorrect password for upload ${payload.uploadId}, requesting new password...`,
        )

        await db
          .update(upload)
          .set({
            status: 'waiting_for_password',
            encryptedPassword: null,
          })
          .where(eq(upload.id, payload.uploadId))

        await sendWrongPasswordTask.trigger({
          to: uploadUser.email,
          fileName: existingUpload.fileName,
          uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
        })

        return { success: true, status: 'waiting_for_password' }
      }
      throw error
    }

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

      await sendUploadFailedTask.trigger({
        to: uploadUser.email,
        fileName: existingUpload.fileName,
        uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
      })

      return { success: true }
    }

    logger.info(
      `Bank statement ${payload.uploadId} is valid. Extracting its metadata in background...`,
    )
    await extractUploadMetadataTask.trigger({
      uploadId: payload.uploadId,
    })

    logger.info(
      `Extracting transactions from upload ${payload.uploadId} (document type: ${review.documentType})...`,
    )
    const extractionResult = await extractTransactionsTask
      .triggerAndWait({
        uploadId: payload.uploadId,
        documentType: review.documentType,
      })
      .unwrap()

    logger.info(
      `Extracted ${extractionResult.transactions.length} transactions. Sending to categorize and import task...`,
    )
    await categorizeAndImportTransactionsTask.trigger({
      uploadId: payload.uploadId,
      userId: extractionResult.userId,
      transactions: extractionResult.transactions,
      statementCurrency: extractionResult.statementCurrency,
      openingBalance: extractionResult.openingBalance,
      closingBalance: extractionResult.closingBalance,
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
