import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

export const categorizeAndImportTransactionsTask = task({
  id: 'categorize-and-import-transactions',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(
      `Categorizing and importing transactions for upload ${payload.uploadId}...`,
      { payload, ctx },
    )

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
      `Downloading bank statement for upload ${payload.uploadId} via presigned URL...`,
    )
    const response = await retry.fetch(presignedUrl.url, {
      method: 'GET',
    })
    const fileBuffer = await response.arrayBuffer()

    const schema = z.array(z.object({}))
  },
})
