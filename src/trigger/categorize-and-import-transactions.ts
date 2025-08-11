import { db } from '@/db'
import { category, upload } from '@/db/schema'
import { openai } from '@ai-sdk/openai'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { eq } from 'drizzle-orm'
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

    logger.info(
      `Finding categories for the user that owns the upload ${payload.uploadId}...`,
    )

    const [{ userId }] = await db
      .select({ userId: upload.userId })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))
    logger.info(`The user that owns the upload is ${userId}`)

    const categories = await db
      .select({ id: category.id, name: category.name })
      .from(category)
      .where(eq(category.userId, userId))

    logger.info(
      `Found ${categories.length} categories for the user ${userId}:`,
      {
        categories,
      },
    )

    logger.info('Extracting transactions from bank statement with AI...')

    const schema = z.object({
      transactions: z.array(
        z.object({
          metadata: z
            .object({
              originalCurrency: z
                .string()
                .optional()
                .describe(
                  'The original currency of the transaction for international transactions. Use the ISO 4217 currency code (e.g. "USD", "BRL", "EUR", etc.).',
                ),
              originalAmount: z
                .number()
                .optional()
                .describe(
                  'The original amount in cents of the transaction for international transactions. Use the amount in the original currency. (e.g. "1000" for $10.00, "100" for $1.00, "10" for $0.10, etc.). Use positive numbers for when the transaction is a debit (e.g. a purchase, a withdrawal, etc.) and negative numbers for when the transaction is a credit (e.g. a refund, a deposit, etc.).',
                ),
              installmentNumber: z
                .number()
                .optional()
                .describe(
                  'The number of the installment when the purchase was paid in installments (e.g. 1, 2, 3, etc.).',
                ),
              totalInstallments: z
                .number()
                .optional()
                .describe(
                  'The total amount of installments for this transaction, if provided (e.g. 12, 24, 36, etc.).',
                ),
            })
            .describe(
              'Relevant information about the transaction. Useful to find the transaction by its most important characteristics.',
            ),
          date: z
            .string()
            .describe('The date of the transaction (e.g. "2025-01-01").'),
          merchantName: z
            .string()
            .describe(
              "The merchant's name written in the same way as on the document.",
            ),
          amount: z
            .number()
            .describe(
              'The amount of the transaction in cents (e.g. "1000" for $10.00, "100" for $1.00, "10" for $0.10, etc.). Use positive numbers for when the transaction is a debit (e.g. a purchase, a withdrawal, etc.) and negative numbers for when the transaction is a credit (e.g. a refund, a deposit, etc.).',
            ),
          currency: z
            .string()
            .describe(
              'The effective currency of the transaction. Use the ISO 4217 currency code (e.g. "USD", "BRL", "EUR", etc.).',
            ),
          category: z
            .string()
            .nullable()
            .describe(
              'The category of the transaction based on the merchant name and relevant information (e.g. "Food", "Transportation", "Entertainment", "Shopping", "Health", "Education", "Other"). Leave null if you cannot find a category.',
            ),
        }),
      ),
    })

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      mode: 'json',
      schemaName: 'categorize-and-import-transactions',
      schemaDescription: 'A JSON schema for a categorization of transactions.',
      output: 'object',
      schema,
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given a bank statement and you need to extract the transactions from it following a JSON schema. Your main goal is to extract the transactions from the bank statement and return them in the correct format.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Hello! Before you start, I would like to give you some information about the categories that I have already created so you can use them to categorize the transactions:',
            },
            {
              type: 'text',
              text: categories
                .map((category) => `- ${category.name}`)
                .join('\n'),
            },
            {
              type: 'text',
              text: "But don't worry to stick to them if you don't find a good match. Feel free to create new categories if you think they are missing.",
            },
            {
              type: 'text',
              text: 'Now, let me give you the bank statement:',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Here is my bank statement:',
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
    logger.info('AI analysis complete', { transactions: result.object })

    return {
      transactions: result.object.transactions,
    }
  },
})
