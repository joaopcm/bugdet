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
import { type PdfPageImage, convertPdfToImages } from '@/lib/pdf'
import { applyRules } from '@/lib/rules/apply-rules'
import { sendUploadCompletedTask } from '@/trigger/emails/send-upload-completed'
import { sendUploadFailedTask } from '@/trigger/emails/send-upload-failed'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

const transactionSchema = z.object({
  transactions: z.array(
    z.object({
      date: z
        .string()
        .describe(
          'Transaction date in ISO format YYYY-MM-DD (e.g., "2025-01-15"). Parse dates carefully from the statement.',
        ),
      merchantName: z
        .string()
        .describe(
          'Merchant name EXACTLY as shown on statement. Keep prefixes like "Ifd*", "Pag*", "MP*". Only remove: installment suffixes (1/3, PARC 01/12) and payment method indicators at the end. Example: "Ifd*Japakitos 2/3" → "Ifd*Japakitos".',
        ),
      description: z
        .string()
        .optional()
        .describe(
          'Additional transaction details if present (e.g., "Online purchase", "ATM withdrawal", installment info "2/6").',
        ),
      amount: z
        .number()
        .describe(
          'Amount in CENTS as integer. POSITIVE for money OUT (purchases, payments, withdrawals, fees). NEGATIVE for money IN (deposits, refunds, cashback, interest received). Example: $10.50 expense = 1050, $25.00 refund = -2500.',
        ),
      currency: z
        .string()
        .describe(
          'ISO 4217 currency code (e.g., "USD", "BRL", "EUR"). Use the statement\'s primary currency.',
        ),
      category: z
        .string()
        .nullable()
        .describe(
          'Suggested category from provided list, or a new descriptive category. Use null if uncertain.',
        ),
      confidence: z
        .number()
        .describe(
          'Confidence score 0-100. BE CONSERVATIVE. 90-100: ONLY for exact merchant match in learned mappings. 70-89: Clear text, category is obvious (e.g., "Netflix" → Entertainment). 50-69: Category is a guess based on merchant name. Below 50: Uncertain category or unclear text.',
        ),
    }),
  ),
  statementCurrency: z
    .string()
    .describe('Primary currency of the statement (ISO 4217 code).'),
  openingBalance: z
    .number()
    .optional()
    .describe('Opening/previous balance in cents if clearly visible.'),
  closingBalance: z
    .number()
    .optional()
    .describe('Closing/ending balance in cents if clearly visible.'),
})

function buildImageContent(images: PdfPageImage[]) {
  return images.map((img) => ({
    type: 'image' as const,
    image: Buffer.from(img.base64, 'base64'),
    mimeType: img.mimeType,
  }))
}

function buildSystemPrompt() {
  return `You are an expert financial document analyst specializing in extracting transactions from bank statements and credit card statements.

## YOUR TASK
Analyze the provided bank statement images and extract ALL transactions into a structured format.

## CRITICAL RULES

### Transaction Identification
- Extract EVERY transaction row from the transaction table/list
- Look for transactions across ALL pages - they may span multiple pages
- Transactions typically have: date, description/merchant, and amount columns
- Watch for page headers that repeat - don't extract them as transactions

### Date Parsing
- Convert all dates to ISO format: YYYY-MM-DD
- Handle various formats: "Jan 15", "15/01/2025", "01-15-25", etc.
- Use the statement period to infer the year if not explicitly shown

### Merchant Name (KEEP AS-IS)
Keep the merchant name EXACTLY as shown on the statement. Preserve all prefixes and identifiers.

KEEP prefixes like:
- "Ifd*", "Pag*", "MP*", "PAG*", "SQ*", etc.

Some transactions may have prefixes and we want to keep them as they are.

ONLY REMOVE:
- Installment suffixes at the end (1/3, 2/6, PARC 01/12)
- Payment method indicators at the very end

Examples:
- "Ifd*Japakitos 2/3" → "Ifd*Japakitos"
- "PAG*JoePizza" → "PAG*JoePizza"
- "MP*Uber PARC 01/06" → "MP*Uber"
- "NETFLIX.COM" → "NETFLIX.COM"

### Amount Sign Convention (IMPORTANT!)
- POSITIVE amounts = Money leaving the account (expenses, purchases, payments, fees, withdrawals)
- NEGATIVE amounts = Money entering the account (deposits, refunds, credits, interest, cashback)
- Convert to cents: $10.50 = 1050, R$ 25,00 = 2500

### Deduplication
- Same date + same merchant + same amount = likely duplicate, extract only once
- Watch for "pending" and "posted" versions of the same transaction

### Confidence Scoring (BE CONSERVATIVE!)
The confidence score should reflect how certain you are about the CATEGORY assignment, not just the extraction.

- 90-100: ONLY if merchant EXACTLY matches one from the "LEARNED MERCHANT MAPPINGS" list
- 70-89: Category is very obvious from merchant name (e.g., "NETFLIX" → Entertainment, "UBER" → Transportation)
- 50-69: Category is a reasonable guess but not certain
- 30-49: Category is uncertain, merchant name is ambiguous
- Below 30: No idea what category this should be

Most transactions should be in the 50-70 range unless there's an exact match in the learned mappings.`
}

function buildUserPrompt(
  categories: { name: string }[],
  merchantMappings: { merchantName: string; categoryName: string | null }[],
) {
  const categoryList =
    categories.length > 0
      ? categories.map((c) => `- ${c.name}`).join('\n')
      : '(No categories defined yet)'

  const merchantList =
    merchantMappings.length > 0
      ? merchantMappings
          .slice(0, 100) // Limit to avoid token overflow
          .map(
            (m) =>
              `- "${m.merchantName}" → ${m.categoryName ?? 'Uncategorized'}`,
          )
          .join('\n')
      : '(No merchant mappings yet)'

  return `## AVAILABLE CATEGORIES
Use these existing categories when appropriate:
${categoryList}

You may suggest new categories if none fit well.

## LEARNED MERCHANT MAPPINGS
When you see these merchants, use the mapped category:
${merchantList}

## INSTRUCTIONS
1. Examine ALL pages of the bank statement
2. Extract EVERY transaction from the transaction table(s)
3. Keep merchant names as shown (preserve prefixes like "Ifd*", "Pag*")
4. Apply correct sign convention (positive = expense, negative = income)
5. Use categories from the list above when they match
6. Provide confidence scores based on extraction certainty

## EXAMPLE OUTPUT FORMAT
\`\`\`json
{
  "transactions": [
    {
      "date": "2025-01-15",
      "merchantName": "Ifd*Japakitos",
      "description": "2/3",
      "amount": 2500,
      "currency": "BRL",
      "category": "Food & Dining",
      "confidence": 65
    },
    {
      "date": "2025-01-14",
      "merchantName": "NETFLIX.COM",
      "amount": 3990,
      "currency": "BRL",
      "category": "Entertainment",
      "confidence": 85
    },
    {
      "date": "2025-01-10",
      "merchantName": "TED RECEBIDO",
      "description": "Salary deposit",
      "amount": -500000,
      "currency": "BRL",
      "category": "Income",
      "confidence": 70
    }
  ],
  "statementCurrency": "BRL",
  "openingBalance": 150000,
  "closingBalance": 125000
}
\`\`\`

Now analyze the statement images and extract all transactions.`
}

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

    logger.info('Converting PDF to images...')
    const images = await convertPdfToImages(fileBuffer)
    logger.info(`Converted ${images.length} pages to images`)

    if (images.length === 0) {
      throw new AbortTaskRunError('No pages could be extracted from the PDF')
    }

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
      .where(and(eq(category.userId, userId), eq(category.deleted, false)))
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
    logger.info(
      `Found ${rules.length} categorization rules for user ${userId}`,
      {
        rules,
      },
    )

    logger.info('Extracting transactions with GPT-5 Vision...')
    const result = await generateObject({
      model: 'openai/gpt-5-mini',
      mode: 'json',
      schemaName: 'categorize-and-import-transactions',
      schemaDescription:
        'Transactions extracted from a bank statement with categorization.',
      schema: transactionSchema,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildUserPrompt(categories, merchantCategories),
            },
            ...buildImageContent(images),
          ],
        },
      ],
    })
    logger.info('AI analysis complete', {
      transactionCount: result.object.transactions.length,
      statementCurrency: result.object.statementCurrency,
      openingBalance: result.object.openingBalance,
      closingBalance: result.object.closingBalance,
    })

    let totalRulesApplied = 0
    const processedTransactions = result.object.transactions
      .map((tx) => {
        // Normalize confidence: if model returned 0-1, convert to 0-100
        const normalizedConfidence =
          tx.confidence <= 1 ? Math.round(tx.confidence * 100) : tx.confidence
        // Ensure amount is an integer (cents)
        const normalizedAmount = Math.round(tx.amount)

        const ruleResult = applyRules(
          { merchantName: tx.merchantName, amount: normalizedAmount },
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
          amount: ruleResult.overrides.amount ?? normalizedAmount,
          confidence: Math.min(100, Math.max(0, normalizedConfidence)),
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
