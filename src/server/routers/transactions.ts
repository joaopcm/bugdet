import {
  DEFAULT_LIMIT_PER_PAGE,
  MAX_LIMIT_PER_PAGE,
} from '@/constants/pagination'
import { SUGGESTED_TRANSACTION_FILTERS_DAYS } from '@/constants/suggested-transaction-filters'
import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'
import { db } from '@/db'
import {
  categorizationRule,
  category,
  merchantCategory,
  transaction,
} from '@/db/schema'
import { TRPCError } from '@trpc/server'
import { format, subDays } from 'date-fns'
import {
  and,
  between,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingTransaction(id: string, userId: string) {
  const [existingTransaction] = await db
    .select({
      id: transaction.id,
      deleted: transaction.deleted,
    })
    .from(transaction)
    .where(and(eq(transaction.id, id), eq(transaction.userId, userId)))

  if (!existingTransaction || existingTransaction.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Transaction not found.',
    })
  }

  return existingTransaction
}

export const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          ids: z.array(z.string().uuid()).nullable(),
          categoryId: z.string().uuid().nullable(),
          uploadId: z.string().uuid().nullable(),
          from: z.string().date().nullable(),
          to: z.string().date().nullable(),
          query: z.string().min(1).max(255).nullable(),
        }),
        pagination: z.object({
          page: z.number().min(1).default(1),
          limit: z
            .number()
            .min(1)
            .max(MAX_LIMIT_PER_PAGE)
            .default(DEFAULT_LIMIT_PER_PAGE),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClauses = [
        eq(transaction.userId, ctx.user.id),
        eq(transaction.deleted, false),
      ]

      if (input.filters.ids && input.filters.ids.length > 0) {
        whereClauses.push(inArray(transaction.id, input.filters.ids))
      }

      if (input.filters.categoryId) {
        whereClauses.push(eq(transaction.categoryId, input.filters.categoryId))
      }

      if (input.filters.uploadId) {
        whereClauses.push(eq(transaction.uploadId, input.filters.uploadId))
      }

      if (input.filters.from && input.filters.to) {
        whereClauses.push(
          between(transaction.date, input.filters.from, input.filters.to),
        )
      }

      if (input.filters.query) {
        whereClauses.push(
          ilike(transaction.merchantName, `%${input.filters.query}%`),
        )
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit

      const transactions = await ctx.db
        .select({
          id: transaction.id,
          uploadId: transaction.uploadId,
          categoryId: transaction.categoryId,
          categoryName: category.name,
          date: transaction.date,
          merchantName: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          confidence: transaction.confidence,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
        })
        .from(transaction)
        .leftJoin(
          category,
          and(
            eq(transaction.categoryId, category.id),
            eq(category.deleted, false),
          ),
        )
        .where(and(...whereClauses))
        .orderBy(desc(transaction.date), desc(transaction.id))
        .limit(input.pagination.limit + 1)
        .offset(offset)

      return {
        data: transactions.slice(0, input.pagination.limit),
        hasMore: transactions.length > input.pagination.limit,
      }
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        deleteRelatedTransactions: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTransaction = await getExistingTransaction(
        input.id,
        ctx.user.id,
      )

      await ctx.db
        .update(transaction)
        .set({ deleted: true })
        .where(
          and(
            eq(transaction.id, existingTransaction.id),
            eq(transaction.userId, ctx.user.id),
          ),
        )
    }),
  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(transaction)
        .set({ deleted: true })
        .where(
          and(
            inArray(transaction.id, input.ids),
            eq(transaction.userId, ctx.user.id),
            eq(transaction.deleted, false),
          ),
        )
    }),
  create: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullable(),
        date: z.string().date(),
        merchantName: z.string().min(1).max(255),
        amount: z.number().max(Number.MAX_SAFE_INTEGER / 100),
        currency: z.string().min(3).max(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(transaction).values({
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        merchantName: input.merchantName,
        currency: input.currency,
        confidence: 100,
        userId: ctx.user.id,
      })
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        categoryId: z.string().uuid().nullable(),
        date: z.string().date(),
        merchantName: z.string().min(1).max(255),
        amount: z.number().max(Number.MAX_SAFE_INTEGER / 100),
        updateCategoryForSimilarTransactions: z.boolean().optional(),
        createCategorizationRule: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTransaction = await getExistingTransaction(
        input.id,
        ctx.user.id,
      )

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(transaction)
          .set({
            ...input,
            confidence: 100,
          })
          .where(
            and(
              eq(transaction.id, existingTransaction.id),
              eq(transaction.userId, ctx.user.id),
            ),
          )

        if (input.updateCategoryForSimilarTransactions) {
          await tx
            .update(transaction)
            .set({
              categoryId: input.categoryId,
            })
            .where(
              and(
                eq(transaction.merchantName, input.merchantName),
                eq(transaction.userId, ctx.user.id),
                eq(transaction.deleted, false),
              ),
            )
        }

        if (input.categoryId) {
          const [existingMerchantCategory] = await tx
            .select()
            .from(merchantCategory)
            .where(
              and(
                eq(merchantCategory.merchantName, input.merchantName),
                eq(merchantCategory.userId, ctx.user.id),
              ),
            )

          if (existingMerchantCategory) {
            await tx
              .update(merchantCategory)
              .set({ categoryId: input.categoryId })
              .where(
                and(
                  eq(merchantCategory.id, existingMerchantCategory.id),
                  eq(merchantCategory.userId, ctx.user.id),
                ),
              )
          } else {
            await tx.insert(merchantCategory).values({
              merchantName: input.merchantName,
              userId: ctx.user.id,
              categoryId: input.categoryId,
            })
          }
        }

        if (input.createCategorizationRule && input.categoryId) {
          await tx.insert(categorizationRule).values({
            userId: ctx.user.id,
            name: `Auto: ${input.merchantName}`,
            conditions: [
              {
                field: 'merchant_name',
                operator: 'contains',
                value: input.merchantName,
              },
            ],
            actions: [
              {
                type: 'set_category',
                value: input.categoryId,
              },
            ],
          })
        }
      })
    }),
  countToReview: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.db
      .select({ id: transaction.id })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
          lt(transaction.confidence, CONFIDENCE_THRESHOLD),
        ),
      )

    return transactions
  }),
  getMostFrequentMerchant: protectedProcedure.query(async ({ ctx }) => {
    const dateRange = subDays(new Date(), SUGGESTED_TRANSACTION_FILTERS_DAYS)

    const result = await ctx.db
      .select({
        merchantName: transaction.merchantName,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
          gte(transaction.date, format(dateRange, 'yyyy-MM-dd')),
        ),
      )
      .groupBy(transaction.merchantName)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(1)

    return result[0] || null
  }),
  getMostFrequentCategory: protectedProcedure.query(async ({ ctx }) => {
    const dateRange = subDays(new Date(), SUGGESTED_TRANSACTION_FILTERS_DAYS)

    const result = await ctx.db
      .select({
        categoryId: transaction.categoryId,
        categoryName: category.name,
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
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
          gte(transaction.date, format(dateRange, 'yyyy-MM-dd')),
          isNotNull(transaction.categoryId),
        ),
      )
      .groupBy(transaction.categoryId, category.name)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(1)

    return result[0] || null
  }),
  getMostExpensiveMerchant: protectedProcedure.query(async ({ ctx }) => {
    const dateRange = subDays(new Date(), SUGGESTED_TRANSACTION_FILTERS_DAYS)

    const result = await ctx.db
      .select({
        merchantName: transaction.merchantName,
        totalAmount: sql<number>`sum(${transaction.amount})`,
        currency: transaction.currency,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
          gte(transaction.date, format(dateRange, 'yyyy-MM-dd')),
        ),
      )
      .groupBy(transaction.merchantName, transaction.currency)
      .orderBy(desc(sql<number>`sum(${transaction.amount})`))
      .limit(1)

    return result[0] || null
  }),
  getMostExpensiveCategory: protectedProcedure.query(async ({ ctx }) => {
    const dateRange = subDays(new Date(), 45)

    const result = await db
      .select({
        categoryId: transaction.categoryId,
        categoryName: category.name,
        totalAmount: sql<number>`sum(${transaction.amount})`,
        currency: transaction.currency,
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
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
          gte(transaction.date, format(dateRange, 'yyyy-MM-dd')),
        ),
      )
      .groupBy(transaction.categoryId, category.name, transaction.currency)
      .orderBy(desc(sql<number>`sum(${transaction.amount})`))
      .limit(1)

    return result[0] || null
  }),
})
