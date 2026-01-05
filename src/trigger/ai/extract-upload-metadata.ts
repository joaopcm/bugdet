import { db } from '@/db'
import { upload } from '@/db/schema'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { Output, generateText } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

const documentTypeSchema = z.enum(['Credit Card', 'Checking Account'])

export type DocumentType = z.infer<typeof documentTypeSchema>

const schema = z
  .object({
    documentType: documentTypeSchema.describe('The type of document.'),
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

    logger.info('Analyzing bank statement with AI...')
    const result = await generateText({
      model: 'google/gemini-2.5-flash',
      output: Output.object({
        schema,
      }),
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
    logger.info('AI analysis complete', result.output)

    await db
      .update(upload)
      .set({
        metadata: result.output,
      })
      .where(eq(upload.id, payload.uploadId))

    return result.output
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

    return {
      skipRetrying: true,
    }
  },
})
