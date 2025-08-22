import { db } from '@/db'
import { upload } from '@/db/schema'
import { openai } from '@ai-sdk/openai'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

export const extractUploadMetadataTask = task({
  id: 'extract-upload-metadata',
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string }) => {
    logger.info(`Enhancing content of upload ${payload.uploadId}...`)

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

    const schema = z
      .object({
        documentType: z
          .string()
          .optional()
          .describe(
            'The type of document (e.g. "Credit Card", "Checking Account", "Savings", etc.).',
          ),
        bankName: z
          .string()
          .optional()
          .describe(
            'The name of the bank (e.g. "Bank of America", "Nubank", etc.).',
          ),
        statementPeriod: z
          .object({
            startDate: z
              .string()
              .optional()
              .describe(
                'The start date of the statement period following the format "14 ABR 2025".',
              ),
            endDate: z
              .string()
              .optional()
              .describe(
                'The end date of the statement period following the format "14 ABR 2025".',
              ),
          })
          .optional()
          .describe('The period of the statement.'),
        extraInformation: z
          .array(
            z.object({
              key: z
                .string()
                .describe(
                  'The key of the extra information (e.g. "Credit Limit", "Interest Rate", "Minimum Payment", "Issue Date", "Due Date", "Account Holder Name", etc.). Keys must always be in English.',
                ),
              value: z
                .string()
                .describe(
                  'The value of the extra information (e.g. "R$ 1000.00", "10%", "R$ 100.00", etc.). Values must always be in the same language as the statement.',
                ),
            }),
          )
          .optional()
          .describe(
            'Extra information not covered by the other fields. Useful to find the bank statement by its most important characteristics. Up to 5 extra information are allowed.',
          ),
      })
      .describe(
        'Relevant information about the file. Useful to find the file by its most important characteristics.',
      )

    logger.info('Analyzing bank statement with AI...')
    const result = await generateObject({
      model: openai('gpt-5-mini'),
      mode: 'json',
      schemaName: 'extract-upload-metadata',
      schemaDescription:
        'A JSON schema to represent the metadata of a submitted file.',
      output: 'object',
      schema,
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given a file and you need to find relevant financial information about it. The file is a bank statement.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Here is the file:',
            },
            {
              type: 'file',
              data: fileBuffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    })
    logger.info('AI analysis complete', result.object)

    await db
      .update(upload)
      .set({
        metadata: result.object,
      })
      .where(eq(upload.id, payload.uploadId))

    return { success: true }
  },
  handleError: async (payload, error, { ctx }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

    return {
      skipRetrying: true,
      error,
    }
  },
})
