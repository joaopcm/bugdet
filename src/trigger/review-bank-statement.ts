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
                .describe('The start date of the statement period.'),
              endDate: z
                .string()
                .optional()
                .describe('The end date of the statement period.'),
            })
            .required()
            .describe('The period of the statement.'),
          issueDate: z
            .string()
            .optional()
            .describe('The date of the statement.'),
          dueDate: z
            .string()
            .optional()
            .describe('The due date of the statement (for credit cards).'),
          accountHolderName: z
            .string()
            .optional()
            .describe('The name of the account holder.'),
          accountNumber: z
            .string()
            .optional()
            .describe('The number of the account.'),
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
      model: google('gemini-2.0-flash-001', {
        structuredOutputs: true,
      }),
      schemaName: 'review-bank-statement',
      schema: schema,
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
