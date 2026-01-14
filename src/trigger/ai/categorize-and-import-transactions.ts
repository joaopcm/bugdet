import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'
import { db } from '@/db'
import {
  categorizationRule,
  category,
  transaction,
  upload,
  user,
} from '@/db/schema'
import { env } from '@/env'
import { generateTransactionFingerprint } from '@/lib/fingerprint'
import { applyRules } from '@/lib/rules/apply-rules'
import { createLambdaClient } from '@/lib/supabase/server'
import { getUserIdFromTenant } from '@/lib/tenant'
import { sendUploadCompletedTask } from '@/trigger/emails/send-upload-completed'
import { sendUploadFailedTask } from '@/trigger/emails/send-upload-failed'
import { logger, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { z } from 'zod'
import type { ExtractedTransaction } from './extract-transactions'
import { secondPassCategorizationTask } from './second-pass-categorization'

const categorizationSchema = z.object({
  categorizedTransactions: z.array(
    z.object({
      index: z
        .number()
        .describe('The index of the transaction in the input array (0-based).'),
      category: z
        .string()
        .nullable()
        .describe(
          'Suggested category from provided list, or a new descriptive category. Use null if uncertain.',
        ),
      confidence: z
        .number()
        .describe(
          'Confidence score 0-100. BE CONSERVATIVE. 90-100: ONLY for exact merchant match in learned mappings. 70-89: Clear category is obvious (e.g., "Netflix" → Entertainment). 50-69: Category is a guess based on merchant name. Below 50: Uncertain category.',
        ),
    }),
  ),
})

function buildSystemPrompt() {
  return `You are an expert financial analyst specializing in categorizing transactions from bank statements.

## YOUR TASK
Analyze the provided transactions and assign appropriate categories to each one.

## CRITICAL RULES

### Category Assignment
- Use existing categories from the provided list when they fit
- You may suggest new categories if none of the existing ones fit well
- Use null for the category if you are truly uncertain

### Confidence Scoring (BE CONSERVATIVE!)
The confidence score should reflect how certain you are about the CATEGORY assignment.

- 80-100: Category is very obvious from merchant name (e.g., "NETFLIX" → Entertainment, "UBER" → Transportation)
- 50-79: Category is a reasonable guess but not certain
- 30-49: Category is uncertain, merchant name is ambiguous
- Below 30: No idea what category this should be

### Important Guidelines
- Consider the merchant name, description, and amount when categorizing
- Negative amounts (income) often have different categories than expenses
- Be consistent with categorization across similar merchants`
}

function buildUserPrompt(
  transactions: ExtractedTransaction[],
  categories: { name: string }[],
) {
  const categoryList =
    categories.length > 0
      ? categories.map((c) => `- ${c.name}`).join('\n')
      : '(No categories defined yet)'

  const transactionsList = transactions
    .map(
      (tx, i) =>
        `${i}. ${tx.date} | ${tx.merchantName}${tx.description ? ` (${tx.description})` : ''} | ${tx.amount > 0 ? 'Expense' : 'Income'}: ${Math.abs(tx.amount)} cents (${tx.currency})`,
    )
    .join('\n')

  return `## AVAILABLE CATEGORIES
Use these existing categories when appropriate:
${categoryList}

You may suggest new categories if none fit well.

## TRANSACTIONS TO CATEGORIZE
${transactionsList}

## INSTRUCTIONS
For each transaction, provide:
1. The index (0-based)
2. The suggested category (from the list above or a new one)
3. Your confidence score (0-100)

Return categorizations for ALL transactions.

## EXAMPLE OUTPUT
\`\`\`json
{
  "categorizedTransactions": [
    { "index": 0, "category": "Entertainment", "confidence": 95 },
    { "index": 1, "category": "Transportation", "confidence": 85 },
    { "index": 2, "category": null, "confidence": 25 }
  ]
}
\`\`\``
}

export interface CategorizeAndImportPayload {
  uploadId: string
  tenantId: string
  transactions: ExtractedTransaction[]
  statementCurrency: string
  openingBalance?: number
  closingBalance?: number
}

export const categorizeAndImportTransactionsTask = task({
  id: 'categorize-and-import-transactions',
  run: async (payload: CategorizeAndImportPayload, { ctx }) => {
    logger.info(
      `Categorizing and importing ${payload.transactions.length} transactions for upload ${payload.uploadId}...`,
      {
        payload: {
          ...payload,
          transactions: `[${payload.transactions.length} items]`,
        },
        ctx,
      },
    )

    if (payload.transactions.length === 0) {
      logger.warn('No transactions to import')

      await db
        .update(upload)
        .set({ status: 'completed' })
        .where(eq(upload.id, payload.uploadId))

      const [uploadData] = await db
        .select({
          fileName: upload.fileName,
          tenantId: upload.tenantId,
          filePath: upload.filePath,
        })
        .from(upload)
        .where(eq(upload.id, payload.uploadId))

      if (uploadData) {
        logger.info(`Deleting original PDF for upload ${payload.uploadId}...`)
        const supabase = createLambdaClient()
        const { error: deleteError } = await supabase.storage
          .from('bank-statements')
          .remove([uploadData.filePath])

        if (deleteError) {
          logger.warn(`Failed to delete original PDF: ${deleteError.message}`)
        } else {
          await db
            .update(upload)
            .set({ pdfDeleted: true })
            .where(eq(upload.id, payload.uploadId))
        }

        const userId = await getUserIdFromTenant(uploadData.tenantId)
        if (userId) {
          const [uploadUser] = await db
            .select({ email: user.email })
            .from(user)
            .where(eq(user.id, userId))

          if (uploadUser) {
            await sendUploadCompletedTask.trigger({
              to: uploadUser.email,
              fileName: uploadData.fileName,
              transactionCount: 0,
              categoriesCreated: 0,
              rulesApplied: 0,
              lowConfidenceCount: 0,
              uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
            })
          }
        }
      }

      return { success: true }
    }

    const categories = await db
      .select({ id: category.id, name: category.name })
      .from(category)
      .where(
        and(
          eq(category.tenantId, payload.tenantId),
          eq(category.deleted, false),
        ),
      )
    logger.info(`Found ${categories.length} categories for tenant`)

    const rules = await db
      .select()
      .from(categorizationRule)
      .where(
        and(
          eq(categorizationRule.tenantId, payload.tenantId),
          eq(categorizationRule.deleted, false),
          eq(categorizationRule.enabled, true),
        ),
      )
      .orderBy(desc(categorizationRule.priority), categorizationRule.createdAt)
    logger.info(`Found ${rules.length} categorization rules`)

    logger.info('Categorizing transactions with AI...')
    const categorizationResult = await generateObject({
      model: 'anthropic/claude-haiku-4.5',
      mode: 'json',
      schemaName: 'categorize-transactions',
      schemaDescription: 'Category assignments for extracted transactions.',
      schema: categorizationSchema,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: buildUserPrompt(payload.transactions, categories),
        },
      ],
    })
    logger.info('Categorization complete', {
      categorizedCount:
        categorizationResult.object.categorizedTransactions.length,
    })

    const categorizationMap = new Map(
      categorizationResult.object.categorizedTransactions.map((c) => [
        c.index,
        { category: c.category, confidence: c.confidence },
      ]),
    )

    const transactionsWithCategories = payload.transactions.map((tx, index) => {
      const categorization = categorizationMap.get(index)
      return {
        ...tx,
        category: categorization?.category ?? null,
        confidence: categorization?.confidence ?? 50,
      }
    })

    let totalRulesApplied = 0
    const processedTransactions = transactionsWithCategories
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
        // If a rule set the category, confidence is 100%
        const finalConfidence = ruleResult.overrides.categoryId
          ? 100
          : Math.min(100, Math.max(0, tx.confidence))

        return {
          ...tx,
          amount: ruleResult.overrides.amount ?? tx.amount,
          confidence: finalConfidence,
          ruleCategoryId: ruleResult.overrides.categoryId,
        }
      })
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

    logger.info(
      `Processed ${processedTransactions.length} transactions after applying rules (${transactionsWithCategories.length - processedTransactions.length} skipped)`,
    )

    let transactionCount = 0
    let categoriesCreated = 0
    let lowConfidenceCount = 0
    let uploadTenantId: string | null = null
    let uploadFileName: string | null = null
    let uploadFilePath: string | null = null

    await db.transaction(async (tx) => {
      const [upToDateUpload] = await tx
        .select({
          status: upload.status,
          tenantId: upload.tenantId,
          fileName: upload.fileName,
          filePath: upload.filePath,
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
      logger.info('Unique categories used:', { uniqueCategories })

      const existingCategories = await tx
        .select({ id: category.id, name: category.name })
        .from(category)
        .where(
          and(
            eq(category.tenantId, upToDateUpload.tenantId),
            eq(category.deleted, false),
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
              tenantId: upToDateUpload.tenantId,
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

      const transactionsWithFingerprints = processedTransactions.map((txn) => ({
        ...txn,
        fingerprint: generateTransactionFingerprint({
          tenantId: upToDateUpload.tenantId,
          date: txn.date,
          merchantName: txn.merchantName,
          amount: txn.amount,
          currency: txn.currency,
        }),
      }))

      const fingerprints = transactionsWithFingerprints.map(
        (t) => t.fingerprint,
      )
      const existingFingerprints = new Set(
        (
          await tx
            .select({ fingerprint: transaction.fingerprint })
            .from(transaction)
            .where(
              and(
                eq(transaction.tenantId, upToDateUpload.tenantId),
                eq(transaction.deleted, false),
                inArray(transaction.fingerprint, fingerprints),
              ),
            )
        )
          .map((r) => r.fingerprint)
          .filter((fp): fp is string => fp !== null),
      )

      const newTransactions = transactionsWithFingerprints.filter(
        (txn) => !existingFingerprints.has(txn.fingerprint),
      )

      const skippedCount =
        transactionsWithFingerprints.length - newTransactions.length
      if (skippedCount > 0) {
        logger.info(`Skipped ${skippedCount} duplicate transactions`)
      }

      if (newTransactions.length > 0) {
        await tx.insert(transaction).values(
          newTransactions.map((txn) => ({
            uploadId: payload.uploadId,
            tenantId: upToDateUpload.tenantId,
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
            fingerprint: txn.fingerprint,
          })),
        )
        logger.info(
          `Imported ${newTransactions.length} transactions to the database for upload ${payload.uploadId}.`,
        )
      } else {
        logger.info(
          `All transactions are duplicates, nothing to import for upload ${payload.uploadId}.`,
        )
      }

      await tx
        .update(upload)
        .set({
          status: 'completed',
        })
        .where(eq(upload.id, payload.uploadId))

      transactionCount = newTransactions.length
      categoriesCreated = newCategories.length
      lowConfidenceCount = newTransactions.filter(
        (txn) => txn.confidence < CONFIDENCE_THRESHOLD,
      ).length
      uploadTenantId = upToDateUpload.tenantId
      uploadFileName = upToDateUpload.fileName
      uploadFilePath = upToDateUpload.filePath
    })

    if (uploadFilePath) {
      logger.info(`Deleting original PDF for upload ${payload.uploadId}...`)
      const supabase = createLambdaClient()
      const { error: deleteError } = await supabase.storage
        .from('bank-statements')
        .remove([uploadFilePath])

      if (deleteError) {
        logger.warn(`Failed to delete original PDF: ${deleteError.message}`)
      } else {
        await db
          .update(upload)
          .set({ pdfDeleted: true })
          .where(eq(upload.id, payload.uploadId))
      }
    }

    if (uploadTenantId && uploadFileName) {
      const userId = await getUserIdFromTenant(uploadTenantId)
      if (userId) {
        const [uploadUser] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId))

        if (uploadUser) {
          await sendUploadCompletedTask.trigger({
            to: uploadUser.email,
            fileName: uploadFileName,
            transactionCount,
            categoriesCreated,
            rulesApplied: totalRulesApplied,
            lowConfidenceCount,
            uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
          })
        }
      }

      if (lowConfidenceCount > 0) {
        logger.info(
          `Triggering second-pass categorization for ${lowConfidenceCount} low-confidence transactions in upload ${payload.uploadId}...`,
        )
        await secondPassCategorizationTask.trigger({
          uploadId: payload.uploadId,
          tenantId: uploadTenantId,
        })
      } else {
        logger.info(
          'No low-confidence transactions to re-evaluate, skipping second-pass categorization',
        )
      }
    }

    return {
      success: true,
    }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload: {
        ...payload,
        transactions: `[${payload.transactions?.length ?? 0} items]`,
      },
      error,
    })

    const [failedUpload] = await db
      .select({ fileName: upload.fileName, tenantId: upload.tenantId })
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
      const userId = await getUserIdFromTenant(failedUpload.tenantId)
      if (userId) {
        const [uploadUser] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId))

        if (uploadUser) {
          await sendUploadFailedTask.trigger({
            to: uploadUser.email,
            fileName: failedUpload.fileName,
            uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
          })
        }
      }
    }

    return {
      skipRetrying: true,
    }
  },
})
