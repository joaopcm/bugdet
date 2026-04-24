import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { aiModel } from "@/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

const modelIdSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\w.-]+\/[\w.-]+$/, "Expected format: provider/model-id");

export const aiModelsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          requiresVision: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(aiModel)
        .where(eq(aiModel.enabled, true))
        .orderBy(asc(aiModel.provider), asc(aiModel.name));

      if (input?.requiresVision) {
        return rows.filter((r) => r.vision);
      }
      return rows;
    }),

  create: adminProcedure
    .input(
      z.object({
        modelId: modelIdSchema,
        provider: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        vision: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select({ id: aiModel.id })
        .from(aiModel)
        .where(eq(aiModel.modelId, input.modelId));

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Model ${input.modelId} already exists.`,
        });
      }

      const [created] = await db
        .insert(aiModel)
        .values({
          modelId: input.modelId,
          provider: input.provider,
          name: input.name,
          vision: input.vision,
        })
        .returning();

      return created;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        provider: z.string().min(1).max(100).optional(),
        name: z.string().min(1).max(200).optional(),
        vision: z.boolean().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update.",
        });
      }

      const [updated] = await db
        .update(aiModel)
        .set(updates)
        .where(eq(aiModel.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found.",
        });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(aiModel)
        .where(eq(aiModel.id, input.id))
        .returning({ id: aiModel.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Model not found.",
        });
      }

      return { success: true };
    }),
});
