import { db } from '@/db'
import { category, merchantCategory, transaction } from '@/db/schema'
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
  list: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
          confidence: transaction.confidence,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
        })
        .from(transaction)
        .leftJoin(category, eq(transaction.categoryId, category.id))
        .where(
          and(
            eq(transaction.userId, ctx.user.id),
            eq(transaction.deleted, false),
            input.categoryId
              ? eq(transaction.categoryId, input.categoryId)
              : undefined,
          ),
        )
        .orderBy(desc(transaction.date), desc(transaction.id))

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
        .where(
          and(
            eq(transaction.id, existingTransaction.id),
            eq(transaction.userId, ctx.user.id),
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
      await db.insert(transaction).values({
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTransaction = await getExistingTransaction(
        input.id,
        ctx.user.id,
      )

      await db.transaction(async (tx) => {
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
            return
          }

          await tx.insert(merchantCategory).values({
            merchantName: input.merchantName,
            userId: ctx.user.id,
            categoryId: input.categoryId,
          })
        }
      })
    }),
})
