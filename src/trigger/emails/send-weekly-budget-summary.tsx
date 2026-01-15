import WeeklyBudgetSummaryEmail from '@/components/emails/templates/weekly-budget-summary'
import { db } from '@/db'
import {
  budget,
  budgetCategory,
  category,
  transaction,
  user,
} from '@/db/schema'
import { env } from '@/env'
import { resend } from '@/lib/resend'
import { getUserIdFromTenant } from '@/lib/tenant'
import { getMonthDateRange } from '@/lib/utils'
import { logger, schedules } from '@trigger.dev/sdk/v3'
import { format } from 'date-fns'
import { and, between, eq, gt, inArray, sql } from 'drizzle-orm'

export const sendWeeklyBudgetSummaryTask = schedules.task({
  id: 'send-weekly-budget-summary',
  cron: '0 9 * * 1', // Every Monday at 9 AM UTC
  run: async () => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const { startDate, endDate } = getMonthDateRange(currentMonth)
    const monthDisplay = format(new Date(), 'MMMM yyyy')

    logger.info(`Sending weekly budget summaries for ${monthDisplay}`)

    const tenantsWithBudgets = await db
      .selectDistinct({ tenantId: budget.tenantId })
      .from(budget)
      .where(eq(budget.deleted, false))

    logger.info(`Found ${tenantsWithBudgets.length} tenants with budgets`)

    let emailsSent = 0

    for (const { tenantId } of tenantsWithBudgets) {
      const userId = await getUserIdFromTenant(tenantId)
      if (!userId) {
        logger.warn(`Could not find user for tenant ${tenantId}`)
        continue
      }

      const [userData] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!userData?.email) {
        logger.warn(`Could not find email for user ${userId}`)
        continue
      }

      const budgets = await db
        .select({
          id: budget.id,
          name: budget.name,
          targetAmount: budget.targetAmount,
          currency: budget.currency,
        })
        .from(budget)
        .where(and(eq(budget.tenantId, tenantId), eq(budget.deleted, false)))

      const budgetsWithProgress = await Promise.all(
        budgets.map(async (b) => {
          const categories = await db
            .select({
              id: category.id,
              name: category.name,
            })
            .from(budgetCategory)
            .innerJoin(category, eq(budgetCategory.categoryId, category.id))
            .where(eq(budgetCategory.budgetId, b.id))

          const categoryIds = categories.map((c) => c.id)
          const categoryNames = categories.map((c) => c.name)

          let spentAmount = 0
          if (categoryIds.length > 0) {
            const [result] = await db
              .select({
                spent: sql<number>`coalesce(sum(${transaction.amount}), 0)`,
              })
              .from(transaction)
              .where(
                and(
                  eq(transaction.tenantId, tenantId),
                  eq(transaction.deleted, false),
                  eq(transaction.currency, b.currency),
                  inArray(transaction.categoryId, categoryIds),
                  between(transaction.date, startDate, endDate),
                  gt(transaction.amount, 0),
                ),
              )
            spentAmount = result?.spent ?? 0
          }

          const percentUsed =
            b.targetAmount > 0
              ? Math.round((spentAmount / b.targetAmount) * 100)
              : 0

          return {
            name: b.name,
            targetAmount: b.targetAmount,
            spentAmount,
            currency: b.currency,
            categories: categoryNames,
            percentUsed,
          }
        }),
      )

      if (budgetsWithProgress.length === 0) {
        continue
      }

      await resend.sendEmail({
        to: userData.email,
        subject: `Your weekly budget summary for ${monthDisplay}`,
        react: (
          <WeeklyBudgetSummaryEmail
            budgets={budgetsWithProgress}
            month={monthDisplay}
            budgetsLink={`${env.NEXT_PUBLIC_APP_URL}/budgets`}
          />
        ),
      })

      emailsSent++
      logger.info(`Sent budget summary to ${userData.email}`)
    }

    logger.info(`Weekly budget summary complete. Sent ${emailsSent} emails.`)

    return {
      success: true,
      emailsSent,
      tenantsProcessed: tenantsWithBudgets.length,
    }
  },
  catchError: async ({ ctx, error }) => {
    logger.error(`Run ${ctx.run.id} failed`, { error })
  },
})
