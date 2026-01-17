import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categorizationRule } from "@/db/schema";
import { paginationSchema } from "@/schemas/pagination";
import { protectedProcedure, router } from "../trpc";

const ruleConditionSchema = z.object({
  field: z.enum(["merchant_name", "amount"]),
  operator: z.enum(["contains", "neq", "gt", "lt", "gte", "lte", "eq"]),
  value: z.union([z.string(), z.number()]),
});

const ruleActionSchema = z.object({
  type: z.enum(["set_sign", "set_category", "ignore"]),
  value: z.string().optional(),
});

async function getExistingRule(id: string, tenantId: string) {
  const [existingRule] = await db
    .select({
      id: categorizationRule.id,
    })
    .from(categorizationRule)
    .where(
      and(
        eq(categorizationRule.id, id),
        eq(categorizationRule.tenantId, tenantId),
        eq(categorizationRule.deleted, false)
      )
    );

  if (!existingRule) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Rule not found.",
    });
  }

  return existingRule;
}

export const categorizationRulesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          query: z.string().min(1).max(255).nullable(),
          enabled: z.boolean().nullable(),
        }),
        pagination: paginationSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClauses = [
        eq(categorizationRule.tenantId, ctx.tenant.tenantId),
        eq(categorizationRule.deleted, false),
      ];

      if (input.filters.query) {
        whereClauses.push(
          ilike(categorizationRule.name, `%${input.filters.query}%`)
        );
      }

      if (input.filters.enabled !== null) {
        whereClauses.push(
          eq(categorizationRule.enabled, input.filters.enabled)
        );
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit;

      const rules = await ctx.db
        .select({
          id: categorizationRule.id,
          name: categorizationRule.name,
          priority: categorizationRule.priority,
          logicOperator: categorizationRule.logicOperator,
          conditions: categorizationRule.conditions,
          actions: categorizationRule.actions,
          enabled: categorizationRule.enabled,
          createdAt: categorizationRule.createdAt,
        })
        .from(categorizationRule)
        .where(and(...whereClauses))
        .orderBy(
          desc(categorizationRule.priority),
          categorizationRule.createdAt
        )
        .limit(input.pagination.limit + 1)
        .offset(offset);

      return {
        data: rules.slice(0, input.pagination.limit),
        hasMore: rules.length > input.pagination.limit,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        priority: z.number().int().min(0).max(1000).default(0),
        logicOperator: z.enum(["and", "or"]).default("and"),
        conditions: z.array(ruleConditionSchema).min(1),
        actions: z.array(ruleActionSchema).min(1),
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [rule] = await ctx.db
        .insert(categorizationRule)
        .values({
          ...input,
          tenantId: ctx.tenant.tenantId,
        })
        .returning({ id: categorizationRule.id });

      return rule;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        priority: z.number().int().min(0).max(1000).optional(),
        logicOperator: z.enum(["and", "or"]).optional(),
        conditions: z.array(ruleConditionSchema).min(1).optional(),
        actions: z.array(ruleActionSchema).min(1).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingRule = await getExistingRule(input.id, ctx.tenant.tenantId);
      const { id, ...updateData } = input;

      await ctx.db
        .update(categorizationRule)
        .set(updateData)
        .where(
          and(
            eq(categorizationRule.id, existingRule.id),
            eq(categorizationRule.tenantId, ctx.tenant.tenantId)
          )
        );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRule = await getExistingRule(input.id, ctx.tenant.tenantId);

      await ctx.db
        .update(categorizationRule)
        .set({ deleted: true })
        .where(
          and(
            eq(categorizationRule.id, existingRule.id),
            eq(categorizationRule.tenantId, ctx.tenant.tenantId)
          )
        );
    }),

  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(categorizationRule)
        .set({ deleted: true })
        .where(
          and(
            inArray(categorizationRule.id, input.ids),
            eq(categorizationRule.tenantId, ctx.tenant.tenantId),
            eq(categorizationRule.deleted, false)
          )
        );
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        rules: z.array(
          z.object({
            id: z.string().uuid(),
            priority: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ruleIds = input.rules.map((r) => r.id);

      const existingRules = await ctx.db
        .select({ id: categorizationRule.id })
        .from(categorizationRule)
        .where(
          and(
            inArray(categorizationRule.id, ruleIds),
            eq(categorizationRule.tenantId, ctx.tenant.tenantId),
            eq(categorizationRule.deleted, false)
          )
        );

      if (existingRules.length !== ruleIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more rules not found.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await Promise.all(
          input.rules.map((rule) =>
            tx
              .update(categorizationRule)
              .set({ priority: rule.priority })
              .where(
                and(
                  eq(categorizationRule.id, rule.id),
                  eq(categorizationRule.tenantId, ctx.tenant.tenantId)
                )
              )
          )
        );
      });
    }),
});
