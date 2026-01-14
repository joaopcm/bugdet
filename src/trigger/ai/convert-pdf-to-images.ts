import { db } from '@/db'
import { upload } from '@/db/schema'
import { decryptPassword } from '@/lib/crypto'
import { convertPdfToImages } from '@/lib/pdf'
import { createLambdaClient } from '@/lib/supabase/server'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { eq } from 'drizzle-orm'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

export const convertPdfToImagesTask = task({
  id: 'convert-pdf-to-images',
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string }) => {
    logger.info(`Converting PDF to images for upload ${payload.uploadId}...`)

    const [existingUpload] = await db
      .select({
        id: upload.id,
        filePath: upload.filePath,
        encryptedPassword: upload.encryptedPassword,
      })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))

    if (!existingUpload) {
      throw new AbortTaskRunError(
        `Upload ${payload.uploadId} not found in database`,
      )
    }

    const presignedUrl = await getBankStatementPresignedUrlTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

    if (!presignedUrl.url) {
      throw new AbortTaskRunError(
        `Failed to get presigned URL for upload ${payload.uploadId}`,
      )
    }

    logger.info(
      `Downloading PDF for upload ${payload.uploadId} via presigned URL...`,
    )
    const response = await retry.fetch(presignedUrl.url, {
      method: 'GET',
    })
    const fileBuffer = await response.arrayBuffer()

    const password = existingUpload.encryptedPassword
      ? decryptPassword(existingUpload.encryptedPassword)
      : undefined

    logger.info('Converting PDF to images...')
    const images = await convertPdfToImages(fileBuffer, password)
    logger.info(`Converted ${images.length} pages to images`)

    if (images.length === 0) {
      throw new AbortTaskRunError('No pages could be extracted from the PDF')
    }

    const supabase = createLambdaClient()

    logger.info(`Uploading ${images.length} images to storage...`)
    const uploadResults = await Promise.all(
      images.map(async (image) => {
        const imagePath = `${payload.uploadId}/page-${image.page}.png`
        const imageBuffer = Buffer.from(image.base64, 'base64')

        const { error } = await supabase.storage
          .from('bank-statements')
          .upload(imagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (error) {
          logger.error(`Failed to upload page ${image.page}`, {
            error: error.message,
          })
          throw new Error(
            `Failed to upload page ${image.page}: ${error.message}`,
          )
        }

        return { page: image.page, path: imagePath }
      }),
    )

    logger.info(`Successfully uploaded ${uploadResults.length} images`)

    await db
      .update(upload)
      .set({ pageCount: images.length })
      .where(eq(upload.id, payload.uploadId))

    logger.info(
      `PDF conversion complete for upload ${payload.uploadId}: ${images.length} pages`,
    )

    return {
      success: true,
      uploadId: payload.uploadId,
      pageCount: images.length,
    }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Convert PDF to images failed for ${payload.uploadId}`, {
      runId: ctx.run.id,
      error,
    })

    return {
      skipRetrying: true,
    }
  },
})
