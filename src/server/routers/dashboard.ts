import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'
import { category, transaction } from '@/db/schema'
import { and, between, countDistinct, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

const dateRangeInput = z.object({
  from: z.string().date(),
  to: z.string().date(),
})

export const dashboardRouter = router({
  getSpendingSummary: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      // Get primary currency (most used)
      const currencyResult = await ctx.db
        .select({
          currency: transaction.currency,
          count: sql<number>`count(*)`,
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.currency)
        .orderBy(desc(sql`count(*)`))

      const primaryCurrency = currencyResult[0]?.currency ?? 'USD'
      const hasOtherCurrencies = currencyResult.length > 1

      // Get aggregates for primary currency
      const [summary] = await ctx.db
        .select({
          totalSpent: sql<number>`coalesce(sum(${transaction.amount}), 0)`,
          transactionCount: sql<number>`count(*)`,
          avgAmount: sql<number>`coalesce(avg(${transaction.amount}), 0)`,
          categoryCount: countDistinct(transaction.categoryId),
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            eq(transaction.currency, primaryCurrency),
            gt(transaction.amount, 0),
            between(transaction.date, input.from, input.to),
          ),
        )

      return {
        totalSpent: Number(summary?.totalSpent ?? 0),
        transactionCount: Number(summary?.transactionCount ?? 0),
        avgAmount: Math.round(Number(summary?.avgAmount ?? 0)),
        categoryCount: Number(summary?.categoryCount ?? 0),
        currency: primaryCurrency,
        hasOtherCurrencies,
      }
    }),

  getSpendingByCategory: protectedProcedure
    .input(
      dateRangeInput.extend({ limit: z.number().min(1).max(20).default(10) }),
    )
    .query(async ({ ctx, input }) => {
      // Get primary currency
      const [currencyResult] = await ctx.db
        .select({ currency: transaction.currency })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.currency)
        .orderBy(desc(sql`count(*)`))
        .limit(1)

      const primaryCurrency = currencyResult?.currency ?? 'USD'

      const result = await ctx.db
        .select({
          categoryId: transaction.categoryId,
          categoryName: category.name,
          totalAmount: sql<number>`sum(${transaction.amount})`,
          transactionCount: sql<number>`count(*)`,
        })
        .from(transaction)
        .leftJoin(
          category,
          and(
            eq(transaction.categoryId, category.id),
            eq(category.deleted, false),
          ),
        )
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            eq(transaction.currency, primaryCurrency),
            gt(transaction.amount, 0),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.categoryId, category.name)
        .orderBy(desc(sql`sum(${transaction.amount})`))
        .limit(input.limit)

      return {
        data: result.map((r) => ({
          categoryId: r.categoryId,
          categoryName: r.categoryName ?? 'Uncategorized',
          totalAmount: Number(r.totalAmount),
          transactionCount: Number(r.transactionCount),
        })),
        currency: primaryCurrency,
      }
    }),

  getSpendingOverTime: protectedProcedure
    .input(
      dateRangeInput.extend({
        groupBy: z.enum(['day', 'week', 'month']),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get primary currency
      const [currencyResult] = await ctx.db
        .select({ currency: transaction.currency })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.currency)
        .orderBy(desc(sql`count(*)`))
        .limit(1)

      const primaryCurrency = currencyResult?.currency ?? 'USD'

      const dateTrunc = {
        day: sql`date_trunc('day', ${transaction.date}::timestamp)`,
        week: sql`date_trunc('week', ${transaction.date}::timestamp)`,
        month: sql`date_trunc('month', ${transaction.date}::timestamp)`,
      }[input.groupBy]

      const result = await ctx.db
        .select({
          date: sql<string>`${dateTrunc}::date`,
          amount: sql<number>`sum(${transaction.amount})`,
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            eq(transaction.currency, primaryCurrency),
            gt(transaction.amount, 0),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(dateTrunc)
        .orderBy(sql`${dateTrunc}`)

      return {
        data: result.map((r) => ({
          date: String(r.date),
          amount: Number(r.amount),
        })),
        currency: primaryCurrency,
      }
    }),

  getTopMerchants: protectedProcedure
    .input(
      dateRangeInput.extend({ limit: z.number().min(1).max(10).default(5) }),
    )
    .query(async ({ ctx, input }) => {
      // Get primary currency
      const [currencyResult] = await ctx.db
        .select({ currency: transaction.currency })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.currency)
        .orderBy(desc(sql`count(*)`))
        .limit(1)

      const primaryCurrency = currencyResult?.currency ?? 'USD'

      const result = await ctx.db
        .select({
          merchantName: transaction.merchantName,
          totalAmount: sql<number>`sum(${transaction.amount})`,
          transactionCount: sql<number>`count(*)`,
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            eq(transaction.currency, primaryCurrency),
            gt(transaction.amount, 0),
            between(transaction.date, input.from, input.to),
          ),
        )
        .groupBy(transaction.merchantName)
        .orderBy(desc(sql`sum(${transaction.amount})`))
        .limit(input.limit)

      return {
        data: result.map((r) => ({
          merchantName: r.merchantName,
          totalAmount: Number(r.totalAmount),
          transactionCount: Number(r.transactionCount),
        })),
        currency: primaryCurrency,
      }
    }),

  getTransactionsToReview: protectedProcedure
    .input(
      dateRangeInput.extend({ limit: z.number().min(1).max(20).default(5) }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: transaction.id,
          date: transaction.date,
          merchantName: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          confidence: transaction.confidence,
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
            lt(transaction.confidence, CONFIDENCE_THRESHOLD),
            between(transaction.date, input.from, input.to),
          ),
        )
        .orderBy(transaction.confidence, desc(transaction.date))
        .limit(input.limit)

      return result
    }),
})
