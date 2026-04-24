import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { AI_TASK_SLOTS } from "@/constants/ai-models";
import { db } from "@/db";
import { aiModel, aiPreferences } from "@/db/schema";
import { protectedProcedure, router } from "../trpc";

async function validateModel(
  modelId: string,
  slot: keyof typeof AI_TASK_SLOTS
) {
  const [model] = await db
    .select({ vision: aiModel.vision, enabled: aiModel.enabled })
    .from(aiModel)
    .where(eq(aiModel.modelId, modelId));

  if (!model?.enabled) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Model ${modelId} is not available.`,
    });
  }

  if (AI_TASK_SLOTS[slot].requiresVision && !model.vision) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Model ${modelId} does not support image input, which is required for ${AI_TASK_SLOTS[slot].label}.`,
    });
  }
}

export const aiPreferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({
        statementExtractionModel: aiPreferences.statementExtractionModel,
        documentAnalysisModel: aiPreferences.documentAnalysisModel,
        categorizationModel: aiPreferences.categorizationModel,
      })
      .from(aiPreferences)
      .where(eq(aiPreferences.tenantId, ctx.tenant.tenantId));

    return (
      row ?? {
        statementExtractionModel: null,
        documentAnalysisModel: null,
        categorizationModel: null,
      }
    );
  }),

  update: protectedProcedure
    .input(
      z.object({
        statementExtractionModel: z.string().nullable(),
        documentAnalysisModel: z.string().nullable(),
        categorizationModel: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.statementExtractionModel) {
        await validateModel(
          input.statementExtractionModel,
          "statementExtraction"
        );
      }
      if (input.documentAnalysisModel) {
        await validateModel(input.documentAnalysisModel, "documentAnalysis");
      }
      if (input.categorizationModel) {
        await validateModel(input.categorizationModel, "categorization");
      }

      await db
        .insert(aiPreferences)
        .values({
          tenantId: ctx.tenant.tenantId,
          statementExtractionModel: input.statementExtractionModel,
          documentAnalysisModel: input.documentAnalysisModel,
          categorizationModel: input.categorizationModel,
        })
        .onConflictDoUpdate({
          target: aiPreferences.tenantId,
          set: {
            statementExtractionModel: input.statementExtractionModel,
            documentAnalysisModel: input.documentAnalysisModel,
            categorizationModel: input.categorizationModel,
          },
        });

      return { success: true };
    }),
});
