import { db } from '@/db'
import {
  budget,
  categorizationRule,
  category,
  transaction,
  upload,
} from '@/db/schema'
import { createLambdaClient } from '@/lib/supabase/server'
import { logger, schedules } from '@trigger.dev/sdk/v3'
import { subDays } from 'date-fns'
import { and, eq, lt } from 'drizzle-orm'

const RETENTION_DAYS = 30

export const hardDeleteExpiredTask = schedules.task({
  id: 'hard-delete-expired',
  cron: '0 3 * * *', // Daily at 3 AM UTC
  run: async () => {
    const cutoffDate = subDays(new Date(), RETENTION_DAYS)
    logger.info(
      `Hard deleting records soft-deleted before ${cutoffDate.toISOString()}`,
    )

    const supabase = createLambdaClient()

    // Delete uploads and their associated storage files
    const uploadsToDelete = await db
      .select({
        id: upload.id,
        filePath: upload.filePath,
        pageCount: upload.pageCount,
      })
      .from(upload)
      .where(and(eq(upload.deleted, true), lt(upload.updatedAt, cutoffDate)))

    if (uploadsToDelete.length > 0) {
      const filesToRemove = uploadsToDelete.flatMap((u) => {
        const files = [u.filePath]
        if (u.pageCount && u.pageCount > 0) {
          for (let i = 1; i <= u.pageCount; i++) {
            files.push(`${u.id}/page-${i}.png`)
          }
        }
        return files
      })

      const { error: storageError } = await supabase.storage
        .from('bank-statements')
        .remove(filesToRemove)

      if (storageError) {
        logger.warn(`Failed to delete storage files: ${storageError.message}`)
      }

      const uploadIds = uploadsToDelete.map((u) => u.id)
      await db
        .delete(upload)
        .where(and(eq(upload.deleted, true), lt(upload.updatedAt, cutoffDate)))
      logger.info(`Hard deleted ${uploadIds.length} uploads`)
    }

    // Delete transactions
    const deletedTransactions = await db
      .delete(transaction)
      .where(
        and(
          eq(transaction.deleted, true),
          lt(transaction.updatedAt, cutoffDate),
        ),
      )
      .returning({ id: transaction.id })

    if (deletedTransactions.length > 0) {
      logger.info(`Hard deleted ${deletedTransactions.length} transactions`)
    }

    // Delete categories
    const deletedCategories = await db
      .delete(category)
      .where(
        and(eq(category.deleted, true), lt(category.updatedAt, cutoffDate)),
      )
      .returning({ id: category.id })

    if (deletedCategories.length > 0) {
      logger.info(`Hard deleted ${deletedCategories.length} categories`)
    }

    // Delete categorization rules
    const deletedRules = await db
      .delete(categorizationRule)
      .where(
        and(
          eq(categorizationRule.deleted, true),
          lt(categorizationRule.updatedAt, cutoffDate),
        ),
      )
      .returning({ id: categorizationRule.id })

    if (deletedRules.length > 0) {
      logger.info(`Hard deleted ${deletedRules.length} categorization rules`)
    }

    // Delete budgets (budgetCategory junction records cascade automatically)
    const deletedBudgets = await db
      .delete(budget)
      .where(and(eq(budget.deleted, true), lt(budget.updatedAt, cutoffDate)))
      .returning({ id: budget.id })

    if (deletedBudgets.length > 0) {
      logger.info(`Hard deleted ${deletedBudgets.length} budgets`)
    }

    return {
      success: true,
      deletedUploads: uploadsToDelete.length,
      deletedTransactions: deletedTransactions.length,
      deletedCategories: deletedCategories.length,
      deletedRules: deletedRules.length,
      deletedBudgets: deletedBudgets.length,
    }
  },
})
