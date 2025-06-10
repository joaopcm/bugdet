import { db } from '@/db'
import { category, transaction, upload } from '@/db/schema'
import { logger, task } from '@trigger.dev/sdk/v3'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { categorizeAndImportTransactionsTask } from './categorize-and-import-transactions'
import { reviewBankStatementTask } from './review-bank-statement'

export const uploadBreakdownTask = task({
  id: 'upload-breakdown',
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Processing upload ${payload.uploadId}...`, { payload, ctx })

    await db
      .update(upload)
      .set({
        status: 'processing',
      })
      .where(eq(upload.id, payload.uploadId))

    const review = await reviewBankStatementTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

    if (!review.isValid) {
      logger.warn(
        `Stopping processing upload ${payload.uploadId} because the bank statement is not valid`,
        { review },
      )

      await db
        .update(upload)
        .set({
          status: 'failed',
          failedReason: review.reason,
          metadata: review.metadata,
        })
        .where(eq(upload.id, payload.uploadId))

      return { success: true }
    }

    logger.info(
      `Bank statement ${payload.uploadId} is valid. Sending it to the categorize and import transactions task...`,
    )

    await db
      .update(upload)
      .set({
        metadata: review.metadata,
      })
      .where(eq(upload.id, payload.uploadId))

    const { transactions } = await categorizeAndImportTransactionsTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

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
          transactions
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
        transactions.map((transaction) => ({
          uploadId: payload.uploadId,
          userId: upToDateUpload.userId,
          categoryId: transaction.category
            ? (categoryNameToId.get(transaction.category) ?? null)
            : null,
          date: transaction.date,
          merchantName: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          metadata: transaction.metadata,
        })),
      )
      logger.info(
        `Imported ${transactions.length} transactions to the database for upload ${payload.uploadId}.`,
      )

      await tx
        .update(upload)
        .set({
          status: 'completed',
        })
        .where(eq(upload.id, payload.uploadId))
    })

    return { success: true }
  },
  handleError: async (payload, error, { ctx }) => {
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
