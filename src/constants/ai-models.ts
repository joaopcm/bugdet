export const AI_TASK_SLOTS = {
  statementExtraction: {
    label: "Statement extraction",
    description: "Extracts every transaction from uploaded bank statements.",
    defaultModel: "google/gemini-3.1-pro-preview",
    requiresVision: true,
  },
  documentAnalysis: {
    label: "Document analysis",
    description:
      "Validates uploads and extracts metadata (bank name, type, period).",
    defaultModel: "google/gemini-3-flash",
    requiresVision: true,
  },
  categorization: {
    label: "Transaction categorization",
    description:
      "Assigns categories to transactions and generates initial category suggestions.",
    defaultModel: "google/gemini-3-flash",
    requiresVision: false,
  },
} as const;

export type AITaskSlot = keyof typeof AI_TASK_SLOTS;
