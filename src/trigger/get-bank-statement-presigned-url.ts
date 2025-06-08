import { CANCELLABLE_STATUSES } from '@/constants/uploads'
import { db } from '@/db'
import { upload } from '@/db/schema'
import { createLambdaClient } from '@/lib/supabase/server'
import { AbortTaskRunError, logger, task } from '@trigger.dev/sdk/v3'
import { eq } from 'drizzle-orm'

type GetBankStatementPresignedUrlTaskResult =
  | { success: false; url: null }
  | { success: true; url: string }

export const getBankStatementPresignedUrlTask = task({
  id: 'get-bank-statement-presigned-url',
  retry: {
    randomize: false,
  },
  run: async (payload: {
    uploadId: string
  }): Promise<GetBankStatementPresignedUrlTaskResult> => {
    logger.info(`Getting presigned URL for upload ${payload.uploadId}...`)

    const [existingUpload] = await db
      .select({
        id: upload.id,
        status: upload.status,
        filePath: upload.filePath,
      })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))

    if (!existingUpload) {
      throw new AbortTaskRunError(`Upload ${payload.uploadId} not found.`)
    }

    if (!CANCELLABLE_STATUSES.includes(existingUpload.status)) {
      logger.warn(
        `Upload ${payload.uploadId} is not in a cancellable status. Skipping...`,
      )
      return { success: false, url: null }
    }

    const supabase = createLambdaClient()

    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('bank-statements')
        .createSignedUrl(existingUpload.filePath, 60 * 15) // 15 minutes

    if (signedUrlError) {
      throw new Error(
        `Error getting presigned URL for upload ${payload.uploadId}: ${signedUrlError.message}`,
      )
    }

    logger.info(`Got presigned URL for upload ${payload.uploadId}`, {
      url: signedUrlData.signedUrl,
    })

    return {
      success: true,
      url: signedUrlData.signedUrl,
    }
  },
})
