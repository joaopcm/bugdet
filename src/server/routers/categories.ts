import { MAX_TRANSACTIONS_PREVIEW } from '@/constants/categories'
import { db } from '@/db'
import { category, transaction } from '@/db/schema'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingCategory(id: string, userId: string) {
  const [existingCategory] = await db
    .select({
      id: category.id,
    })
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, userId)))

  if (!existingCategory) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Category not found.',
    })
  }

  return existingCategory
}

export const categoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
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
      .where(eq(category.userId, ctx.user.id))
      .groupBy(category.id, category.name, category.createdAt)
      .orderBy(desc(category.createdAt))

    return categories
  }),
  preview: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const existingCategory = await getExistingCategory(input.id, ctx.user.id)

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
      const existingCategory = await getExistingCategory(input.id, ctx.user.id)

      await db.delete(category).where(eq(category.id, existingCategory.id))
    }),
})
