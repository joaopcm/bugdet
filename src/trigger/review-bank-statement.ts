import { google } from '@ai-sdk/google'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

export const reviewBankStatementTask = task({
  id: 'review-bank-statement',
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string }) => {
    logger.info(`Reviewing upload ${payload.uploadId}...`)

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

    const schema = z.object({
      metadata: z
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
                  'The start date of the statement period (e.g. "14 ABR 2025").',
                ),
              endDate: z
                .string()
                .optional()
                .describe(
                  'The end date of the statement period (e.g. "14 MAI 2025").',
                ),
            })
            .required()
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
            .max(4)
            .describe(
              'Extra information not covered by the other fields. Useful to find the bank statement by its most important characteristics.',
            ),
        })
        .describe(
          'Relevant information about the file. Useful to find the file by its most important characteristics.',
        ),
      isValid: z
        .boolean()
        .describe(
          'Whether the file matches the expected format of a bank statement.',
        ),
      reason: z
        .string()
        .describe(
          'The reason for the validity of the file. This is only set if isValid is false. E.g. "The file is not a bank statement. It looks like a screenshot of a webpage."',
        )
        .optional(),
    })

    logger.info('Analyzing bank statement with AI...')
    const result = await generateObject({
      model: google('gemini-2.5-flash-preview-04-17', {
        structuredOutputs: true,
      }),
      output: 'object',
      schemaName: 'review-bank-statement',
      schema,
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given a bank statement and you need to determine if it is a valid bank statement. If it is not a valid bank statement, you need to provide a reason why it is not a valid bank statement. The bank statement is sent as a file by the user.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Is my bank statement valid?',
            },
            {
              type: 'file',
              data: fileBuffer,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
    })
    logger.info('AI analysis complete', result.object)

    return result.object
  },
})
