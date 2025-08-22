import { db } from '@/db'
import { category, transaction, upload } from '@/db/schema'
import { openai } from '@ai-sdk/openai'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { and, eq, inArray, ne } from 'drizzle-orm'
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
          date: z
            .string()
            .describe('The date of the transaction (e.g. "2025-01-01").'),
          merchantName: z
            .string()
            .describe(
              "The merchant's name written in the same way as on the document. Do not include any unrelated information like the date, installments, etc. Only include the merchant's name.",
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
          confidence: z
            .number()
            .optional()
            .describe(
              'Your confidence level about the transaction being correctly extracted and categorized. Use an integer between 0 and 100. 100 is the highest confidence level.',
            ),
        }),
      ),
    })

    const result = await generateObject({
      model: openai('gpt-5-mini'),
      mode: 'json',
      schemaName: 'categorize-and-import-transactions',
      schemaDescription:
        'A JSON schema for a categorization of transactions based on the merchant name and relevant information.',
      output: 'object',
      schema,
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given a bank statement and you need to extract the transactions from it following a JSON schema. Your main goal is to extract the transactions from the bank statement and return them in the correct JSON format.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Hello! Before you start, I would like to give you some information about the categories I have already created so you can use them to categorize the transactions:',
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

    await db.transaction(async (tx) => {
      const [upToDateUpload] = await tx
        .select({ status: upload.status, userId: upload.userId })
        .from(upload)
        .where(eq(upload.id, payload.uploadId))

      if (upToDateUpload.status !== 'processing') {
        logger.warn(
          `Stopping processing upload ${payload.uploadId} because it is not in a processing status anymore.`,
        )
        return { success: true }
      }

      const uniqueCategories = [
        ...new Set(
          result.object.transactions
            .map((transaction) => transaction.category)
            .filter((category): category is string => category !== null),
        ),
      ]
      logger.info('Unique categories used:', {
        uniqueCategories,
      })

      const existingCategories = await tx
        .select({ id: category.id, name: category.name })
        .from(category)
        .where(
          and(
            eq(category.userId, upToDateUpload.userId),
            inArray(category.name, uniqueCategories),
          ),
        )

      const existingCategoryNames = new Set(
        existingCategories.map((cat) => cat.name),
      )

      const categoriesToInsert = uniqueCategories.filter(
        (categoryName) => !existingCategoryNames.has(categoryName),
      )

      let newCategories: { id: string; name: string }[] = []
      if (categoriesToInsert.length > 0) {
        newCategories = await tx
          .insert(category)
          .values(
            categoriesToInsert.map((categoryName) => ({
              name: categoryName,
              userId: upToDateUpload.userId,
            })),
          )
          .returning({ id: category.id, name: category.name })
        logger.info(`Inserted ${categoriesToInsert.length} new categories`)
      } else {
        logger.info('No new categories to insert')
      }

      const categoryNameToId = new Map(
        [...existingCategories, ...newCategories].map((cat) => [
          cat.name,
          cat.id,
        ]),
      )

      await tx.insert(transaction).values(
        result.object.transactions.map((transaction) => ({
          uploadId: payload.uploadId,
          userId: upToDateUpload.userId,
          categoryId: transaction.category
            ? (categoryNameToId.get(transaction.category) ?? null)
            : null,
          date: transaction.date,
          merchantName: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          confidence: transaction.confidence,
        })),
      )
      logger.info(
        `Imported ${result.object.transactions.length} transactions to the database for upload ${payload.uploadId}.`,
      )

      await tx
        .update(upload)
        .set({
          status: 'completed',
        })
        .where(eq(upload.id, payload.uploadId))
    })

    return {
      success: true,
    }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

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

    return {
      skipRetrying: true,
    }
  },
})
