import { MAX_TRANSACTIONS_PREVIEW } from '@/constants/categories'
import {
  DEFAULT_LIMIT_PER_PAGE,
  MAX_LIMIT_PER_PAGE,
} from '@/constants/pagination'
import { db } from '@/db'
import { category, transaction } from '@/db/schema'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingCategory(id: string, tenantId: string) {
  const [existingCategory] = await db
    .select({
      id: category.id,
      deleted: category.deleted,
    })
    .from(category)
    .where(and(eq(category.id, id), eq(category.tenantId, tenantId)))

  if (!existingCategory || existingCategory.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Category not found.',
    })
  }

  return existingCategory
}

export const categoriesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
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
        eq(category.tenantId, ctx.tenant.tenantId),
        eq(category.deleted, false),
      ]

      if (input.filters.query) {
        whereClauses.push(ilike(category.name, `%${input.filters.query}%`))
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit

      const categories = await db
        .select({
          id: category.id,
          name: category.name,
          createdAt: category.createdAt,
          transactionCount: count(transaction.id),
        })
        .from(category)
        .leftJoin(
          transaction,
          and(
            eq(category.id, transaction.categoryId),
            eq(transaction.deleted, false),
          ),
        )
        .where(and(...whereClauses))
        .groupBy(category.id, category.name, category.createdAt)
        .orderBy(desc(category.createdAt))
        .limit(input.pagination.limit + 1)
        .offset(offset)

      return {
        data: categories.slice(0, input.pagination.limit),
        hasMore: categories.length > input.pagination.limit,
      }
    }),
  preview: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const existingCategory = await getExistingCategory(
        input.id,
        ctx.tenant.tenantId,
      )

      const lastTransactions = await db
        .select({
          id: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          currency: transaction.currency,
          merchantName: transaction.merchantName,
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.categoryId, existingCategory.id),
            eq(transaction.tenantId, ctx.tenant.tenantId),
            eq(transaction.deleted, false),
          ),
        )
        .orderBy(desc(transaction.date))
        .limit(MAX_TRANSACTIONS_PREVIEW)

      return lastTransactions
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingCategory = await getExistingCategory(
        input.id,
        ctx.tenant.tenantId,
      )

      await db
        .update(category)
        .set({ deleted: true })
        .where(
          and(
            eq(category.id, existingCategory.id),
            eq(category.tenantId, ctx.tenant.tenantId),
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
        .update(category)
        .set({ deleted: true })
        .where(
          and(
            inArray(category.id, input.ids),
            eq(category.tenantId, ctx.tenant.tenantId),
            eq(category.deleted, false),
          ),
        )
    }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const [newCategory] = await db
        .insert(category)
        .values({
          ...input,
          tenantId: ctx.tenant.tenantId,
        })
        .returning({ id: category.id, name: category.name })

      return newCategory
    }),
  update: protectedProcedure
    .input(
      z.object({ id: z.string().uuid(), name: z.string().min(1).max(255) }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingCategory = await getExistingCategory(
        input.id,
        ctx.tenant.tenantId,
      )

      await db
        .update(category)
        .set(input)
        .where(
          and(
            eq(category.id, existingCategory.id),
            eq(category.tenantId, ctx.tenant.tenantId),
          ),
        )
    }),
})
