import { db } from '@/db'
import { budget, budgetCategory, category, transaction } from '@/db/schema'
import { getMonthDateRange } from '@/lib/utils'
import { paginationSchema } from '@/schemas/pagination'
import { TRPCError } from '@trpc/server'
import { and, between, desc, eq, gt, ilike, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingBudget(id: string, tenantId: string) {
  const [existingBudget] = await db
    .select({
      id: budget.id,
      deleted: budget.deleted,
    })
    .from(budget)
    .where(and(eq(budget.id, id), eq(budget.tenantId, tenantId)))

  if (!existingBudget || existingBudget.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Budget not found.',
    })
  }

  return existingBudget
}

async function validateCategoryOwnership(
  categoryIds: string[],
  tenantId: string,
) {
  const validCategories = await db
    .select({ id: category.id })
    .from(category)
    .where(
      and(
        inArray(category.id, categoryIds),
        eq(category.tenantId, tenantId),
        eq(category.deleted, false),
      ),
    )

  if (validCategories.length !== categoryIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'One or more categories not found.',
    })
  }
}

export const budgetsRouter = router({
  getCurrencies: protectedProcedure.query(async ({ ctx }) => {
    const currencies = await db
      .selectDistinct({ currency: transaction.currency })
      .from(transaction)
      .where(
        and(
          eq(transaction.tenantId, ctx.tenant.tenantId),
          eq(transaction.deleted, false),
        ),
      )
      .orderBy(transaction.currency)

    return currencies.map((c) => c.currency)
  }),

  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          query: z.string().min(1).max(255).nullable(),
          month: z.string().regex(/^\d{4}-\d{2}$/),
        }),
        pagination: paginationSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClauses = [
        eq(budget.tenantId, ctx.tenant.tenantId),
        eq(budget.deleted, false),
      ]

      if (input.filters.query) {
        whereClauses.push(ilike(budget.name, `%${input.filters.query}%`))
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit

      const budgets = await db
        .select({
          id: budget.id,
          name: budget.name,
          targetAmount: budget.targetAmount,
          currency: budget.currency,
          createdAt: budget.createdAt,
        })
        .from(budget)
        .where(and(...whereClauses))
        .orderBy(desc(budget.createdAt))
        .limit(input.pagination.limit + 1)
        .offset(offset)

      const { startDate, endDate } = getMonthDateRange(input.filters.month)

      const budgetsWithDetails = await Promise.all(
        budgets.slice(0, input.pagination.limit).map(async (b) => {
          const categories = await db
            .select({
              id: category.id,
              name: category.name,
            })
            .from(budgetCategory)
            .innerJoin(category, eq(budgetCategory.categoryId, category.id))
            .where(eq(budgetCategory.budgetId, b.id))

          const categoryIds = categories.map((c) => c.id)

          let spentAmount = 0
          if (categoryIds.length > 0) {
            const [result] = await db
              .select({
                spent: sql<number>`coalesce(sum(${transaction.amount}), 0)`,
              })
              .from(transaction)
              .where(
                and(
                  eq(transaction.tenantId, ctx.tenant.tenantId),
                  eq(transaction.deleted, false),
                  eq(transaction.currency, b.currency),
                  inArray(transaction.categoryId, categoryIds),
                  between(transaction.date, startDate, endDate),
                  gt(transaction.amount, 0),
                ),
              )
            spentAmount = result?.spent ?? 0
          }

          return {
            ...b,
            categories,
            spentAmount,
          }
        }),
      )

      return {
        data: budgetsWithDetails,
        hasMore: budgets.length > input.pagination.limit,
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        targetAmount: z.number().int().positive(),
        currency: z.string().min(3).max(3),
        categoryIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...budgetData } = input

      await validateCategoryOwnership(categoryIds, ctx.tenant.tenantId)

      return await db.transaction(async (tx) => {
        const [newBudget] = await tx
          .insert(budget)
          .values({
            ...budgetData,
            tenantId: ctx.tenant.tenantId,
          })
          .returning({ id: budget.id })

        await tx.insert(budgetCategory).values(
          categoryIds.map((categoryId) => ({
            budgetId: newBudget.id,
            categoryId,
          })),
        )

        return newBudget
      })

      return newBudget
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255),
        targetAmount: z.number().int().positive(),
        currency: z.string().min(3).max(3),
        categoryIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingBudget = await getExistingBudget(
        input.id,
        ctx.tenant.tenantId,
      )

      const { categoryIds, id, ...budgetData } = input

      await validateCategoryOwnership(categoryIds, ctx.tenant.tenantId)

      await db.transaction(async (tx) => {
        await tx
          .update(budget)
          .set(budgetData)
          .where(
            and(
              eq(budget.id, existingBudget.id),
              eq(budget.tenantId, ctx.tenant.tenantId),
            ),
          )

        await tx
          .delete(budgetCategory)
          .where(eq(budgetCategory.budgetId, existingBudget.id))

        await tx.insert(budgetCategory).values(
          categoryIds.map((categoryId) => ({
            budgetId: existingBudget.id,
            categoryId,
          })),
        )
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingBudget = await getExistingBudget(
        input.id,
        ctx.tenant.tenantId,
      )

      await db
        .update(budget)
        .set({ deleted: true })
        .where(
          and(
            eq(budget.id, existingBudget.id),
            eq(budget.tenantId, ctx.tenant.tenantId),
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
      await db
        .update(budget)
        .set({ deleted: true })
        .where(
          and(
            inArray(budget.id, input.ids),
            eq(budget.tenantId, ctx.tenant.tenantId),
            eq(budget.deleted, false),
          ),
        )
    }),
})
