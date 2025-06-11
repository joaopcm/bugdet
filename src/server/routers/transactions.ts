import { db } from '@/db'
import { category, transaction } from '@/db/schema'
import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
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
  list: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await db
      .select({
        id: transaction.id,
        uploadId: transaction.uploadId,
        categoryId: transaction.categoryId,
        categoryName: category.name,
        date: transaction.date,
        merchantName: transaction.merchantName,
        amount: transaction.amount,
        currency: transaction.currency,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .leftJoin(category, eq(transaction.categoryId, category.id))
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.deleted, false),
        ),
      )
      .orderBy(desc(transaction.date))

    return transactions
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingTransaction = await getExistingTransaction(
        input.id,
        ctx.user.id,
      )

      await db
        .update(transaction)
        .set({ deleted: true })
        .where(eq(transaction.id, existingTransaction.id))
    }),
})
