import { db } from '@/db'
import {
  categorizationRule,
  category,
  merchantCategory,
  transaction,
  upload,
  user,
} from '@/db/schema'
import { env } from '@/env'
import { extractTextFromPdf } from '@/lib/pdf'
import { applyRules } from '@/lib/rules/apply-rules'
import { sendUploadCompletedTask } from '@/trigger/emails/send-upload-completed'
import { sendUploadFailedTask } from '@/trigger/emails/send-upload-failed'
import { openai } from '@ai-sdk/openai'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
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

    logger.info('Extracting text from PDF...')
    const pdfText = await extractTextFromPdf(fileBuffer)
    logger.info(`Extracted ${pdfText.length} characters from PDF`)

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

    const merchantCategories = await db
      .select({
        merchantName: merchantCategory.merchantName,
        categoryName: category.name,
      })
      .from(merchantCategory)
      .leftJoin(category, eq(merchantCategory.categoryId, category.id))
      .where(eq(merchantCategory.userId, userId))
      .orderBy(desc(merchantCategory.updatedAt))
    logger.info(
      `Found ${merchantCategories.length} merchant categories for the user ${userId}:`,
      {
        merchantCategories,
      },
    )

    const rules = await db
      .select()
      .from(categorizationRule)
      .where(
        and(
          eq(categorizationRule.userId, userId),
          eq(categorizationRule.deleted, false),
          eq(categorizationRule.enabled, true),
        ),
      )
      .orderBy(desc(categorizationRule.priority), categorizationRule.createdAt)
    logger.info(`Found ${rules.length} categorization rules for user ${userId}`)

    logger.info('Extracting transactions from bank statement with AI...')
    const schema = z.object({
      transactions: z.array(
        z.object({
          date: z
            .string()
            .date()
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
            "You are a bank statement expert. You are given the text content extracted from a bank statement and you need to extract the transactions from it following a JSON schema. Avoid extracting duplicated transactions. In the merchant name, do not include any unrelated information like the date, installments, etc. Only include the merchant's name.",
        },
        {
          role: 'user',
          content: `Hello! Before you start, I would like to give you some information about the categories I have already created so you can use them to categorize the transactions:

${categories.map((category) => `- ${category.name}`).join('\n')}

But don't worry to stick to them if you don't find a good match. Feel free to create new categories if you think they are missing.

Also, remember to stick to the following categories whenever you find a merchant name that matches one of the following:
${merchantCategories.map((merchantCategory) => `- Merchant name: ${merchantCategory.merchantName} → Category: ${merchantCategory.categoryName ?? 'N/A'}`).join('\n')}

Now, here is the text content extracted from the bank statement:

${pdfText}`,
        },
      ],
    })
    logger.info('AI analysis complete', { transactions: result.object })

    let totalRulesApplied = 0
    const processedTransactions = result.object.transactions
      .map((tx) => {
        const ruleResult = applyRules(
          { merchantName: tx.merchantName, amount: tx.amount },
          rules,
        )
        totalRulesApplied += ruleResult.rulesApplied
        if (ruleResult.skip) {
          logger.info(
            `Skipping transaction "${tx.merchantName}" due to ignore rule`,
          )
          return null
        }
        return {
          ...tx,
          amount: ruleResult.overrides.amount ?? tx.amount,
          ruleCategoryId: ruleResult.overrides.categoryId,
        }
      })
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

    logger.info(
      `Processed ${processedTransactions.length} transactions after applying rules (${result.object.transactions.length - processedTransactions.length} skipped)`,
    )

    let transactionCount = 0
    let categoriesCreated = 0
    let uploadUserId: string | null = null
    let uploadFileName: string | null = null

    await db.transaction(async (tx) => {
      const [upToDateUpload] = await tx
        .select({
          status: upload.status,
          userId: upload.userId,
          fileName: upload.fileName,
        })
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
          processedTransactions
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
        processedTransactions.map((txn) => ({
          uploadId: payload.uploadId,
          userId: upToDateUpload.userId,
          categoryId:
            txn.ruleCategoryId ??
            (txn.category
              ? (categoryNameToId.get(txn.category) ?? null)
              : null),
          date: txn.date,
          merchantName: txn.merchantName,
          amount: txn.amount,
          currency: txn.currency,
          confidence: txn.confidence,
        })),
      )
      logger.info(
        `Imported ${processedTransactions.length} transactions to the database for upload ${payload.uploadId}.`,
      )

      await tx
        .update(upload)
        .set({
          status: 'completed',
        })
        .where(eq(upload.id, payload.uploadId))

      transactionCount = processedTransactions.length
      categoriesCreated = newCategories.length
      uploadUserId = upToDateUpload.userId
      uploadFileName = upToDateUpload.fileName
    })

    if (uploadUserId && uploadFileName) {
      const [uploadUser] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, uploadUserId))

      if (uploadUser) {
        await sendUploadCompletedTask.trigger({
          to: uploadUser.email,
          fileName: uploadFileName,
          transactionCount,
          categoriesCreated,
          rulesApplied: totalRulesApplied,
          uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
        })
      }
    }

    return {
      success: true,
    }
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
