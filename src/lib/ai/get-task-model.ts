import { and, eq } from "drizzle-orm";
import { AI_TASK_SLOTS, type AITaskSlot } from "@/constants/ai-models";
import { db } from "@/db";
import { aiModel, aiPreferences } from "@/db/schema";

const SLOT_TO_COLUMN = {
  statementExtraction: aiPreferences.statementExtractionModel,
  documentAnalysis: aiPreferences.documentAnalysisModel,
  categorization: aiPreferences.categorizationModel,
} as const;

export async function getTaskModel(
  tenantId: string,
  slot: AITaskSlot
): Promise<string> {
  const column = SLOT_TO_COLUMN[slot];

  const [row] = await db
    .select({ modelId: column })
    .from(aiPreferences)
    .where(eq(aiPreferences.tenantId, tenantId));

  const stored = row?.modelId ?? null;
  if (!stored) {
    return AI_TASK_SLOTS[slot].defaultModel;
  }

  const [model] = await db
    .select({ modelId: aiModel.modelId })
    .from(aiModel)
    .where(and(eq(aiModel.modelId, stored), eq(aiModel.enabled, true)));

  return model?.modelId ?? AI_TASK_SLOTS[slot].defaultModel;
}
