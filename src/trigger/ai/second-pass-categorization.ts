import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { CONFIDENCE_THRESHOLD } from "@/constants/transactions";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";

const recategorizationSchema = z.object({
  recategorizedTransactions: z.array(
    z.object({
      transactionId: z
        .string()
        .describe("The UUID of the transaction being recategorized."),
      category: z
        .string()
        .nullable()
        .describe(
          "Suggested category from provided list. Use null if still uncertain."
        ),
      confidence: z
        .number()
        .describe(
          "Confidence score 0-100. BE CONSERVATIVE. 80-100: Category is very obvious. 50-79: Reasonable guess. Below 50: Still uncertain."
        ),
    })
  ),
});

function buildSystemPrompt() {
  return `You are an expert financial analyst specializing in categorizing transactions from bank statements.

## YOUR TASK
This is a SECOND-PASS review of low-confidence transactions. A previous AI model was uncertain about these transactions.
Your job is to analyze them more carefully and provide better categorization if possible.

## CRITICAL RULES

### Category Assignment
- Use ONLY existing categories from the provided list - do NOT suggest new categories
- If you're still uncertain about a transaction, keep the same category or use null
- Only increase confidence if you are genuinely more certain about the category

### Confidence Scoring (BE CONSERVATIVE!)
The confidence score should reflect how certain you are about the CATEGORY assignment.

- 80-100: Category is very obvious from merchant name (e.g., "NETFLIX" → Entertainment, "UBER" → Transportation)
- 50-79: Category is a reasonable guess but not certain
- 30-49: Category is uncertain, merchant name is ambiguous
- Below 30: No idea what category this should be

### Important Guidelines
- Consider the merchant name, description, and amount when categorizing
- Negative amounts (income) often have different categories than expenses
- Be consistent with categorization across similar merchants
- It's OK to keep the same confidence or category if you're not more certain`;
}

function buildUserPrompt(
  transactions: {
    id: string;
    merchantName: string;
    amount: number;
    currency: string;
    date: string;
    currentCategory: string | null;
    currentConfidence: number;
  }[],
  categories: { name: string }[]
) {
  const categoryList =
    categories.length > 0
      ? categories.map((c) => `- ${c.name}`).join("\n")
      : "(No categories defined yet)";

  const transactionsList = transactions
    .map(
      (tx) =>
        `- ID: ${tx.id}
  Merchant: ${tx.merchantName}
  Type: ${tx.amount > 0 ? "Expense" : "Income"}
  Amount: ${Math.abs(tx.amount)} cents (${tx.currency})
  Date: ${tx.date}
  Current Category: ${tx.currentCategory ?? "None"}
  Current Confidence: ${tx.currentConfidence}%`
    )
    .join("\n\n");

  return `## AVAILABLE CATEGORIES
Use ONLY these existing categories (do NOT suggest new ones):
${categoryList}

## LOW-CONFIDENCE TRANSACTIONS TO REVIEW
These transactions were flagged as low-confidence by the initial categorization.
Review each one and provide your best categorization:

${transactionsList}

## INSTRUCTIONS
For each transaction, provide:
1. The transaction ID (exactly as shown)
2. The suggested category (from the list above ONLY, or null if still uncertain)
3. Your confidence score (0-100)

Return categorizations for ALL transactions.

## EXAMPLE OUTPUT
\`\`\`json
{
  "recategorizedTransactions": [
    { "transactionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "category": "Groceries", "confidence": 85 },
    { "transactionId": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "category": null, "confidence": 30 }
  ]
}
\`\`\``;
}

export interface SecondPassCategorizationPayload {
  uploadId: string;
  tenantId: string;
}

export const secondPassCategorizationTask = task({
  id: "second-pass-categorization",
  run: async (payload: SecondPassCategorizationPayload, { ctx }) => {
    logger.info(
      `Starting second-pass categorization for upload ${payload.uploadId}...`,
      { payload, ctx }
    );

    const lowConfidenceTransactions = await db
      .select({
        id: transaction.id,
        merchantName: transaction.merchantName,
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.date,
        categoryId: transaction.categoryId,
        confidence: transaction.confidence,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.uploadId, payload.uploadId),
          eq(transaction.tenantId, payload.tenantId),
          eq(transaction.deleted, false),
          lt(transaction.confidence, CONFIDENCE_THRESHOLD)
        )
      );

    if (lowConfidenceTransactions.length === 0) {
      logger.info("No low-confidence transactions to recategorize");
      return { success: true, recategorized: 0 };
    }

    logger.info(
      `Found ${lowConfidenceTransactions.length} low-confidence transactions to recategorize`
    );

    const categories = await db
      .select({ id: category.id, name: category.name })
      .from(category)
      .where(
        and(
          eq(category.tenantId, payload.tenantId),
          eq(category.deleted, false)
        )
      );

    const categoryIdToName = new Map(
      categories.map((cat) => [cat.id, cat.name])
    );
    const categoryNameToId = new Map(
      categories.map((cat) => [cat.name, cat.id])
    );

    const transactionsForAI = lowConfidenceTransactions.map((tx) => ({
      id: tx.id,
      merchantName: tx.merchantName,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
      currentCategory: tx.categoryId
        ? (categoryIdToName.get(tx.categoryId) ?? null)
        : null,
      currentConfidence: tx.confidence,
    }));

    logger.info("Re-categorizing transactions with AI...");
    const recategorizationResult = await generateObject({
      model: "anthropic/claude-sonnet-4.5",
      mode: "json",
      schemaName: "recategorize-transactions",
      schemaDescription:
        "Second-pass category assignments for low-confidence transactions.",
      schema: recategorizationSchema,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(transactionsForAI, categories),
        },
      ],
    });

    logger.info("Second-pass categorization complete", {
      recategorizedCount:
        recategorizationResult.object.recategorizedTransactions.length,
    });

    let updatedCount = 0;
    let improvedCount = 0;

    for (const recategorized of recategorizationResult.object
      .recategorizedTransactions) {
      const originalTx = lowConfidenceTransactions.find(
        (tx) => tx.id === recategorized.transactionId
      );

      if (!originalTx) {
        logger.warn(
          `Transaction ${recategorized.transactionId} not found in original list`
        );
        continue;
      }

      const newCategoryId = recategorized.category
        ? (categoryNameToId.get(recategorized.category) ?? null)
        : null;

      const newConfidence = Math.min(
        100,
        Math.max(0, recategorized.confidence)
      );

      const hasNewCategory =
        newCategoryId !== null && newCategoryId !== originalTx.categoryId;
      const hasHigherConfidence = newConfidence > originalTx.confidence;

      if (hasNewCategory || hasHigherConfidence) {
        await db
          .update(transaction)
          .set({
            categoryId: newCategoryId ?? originalTx.categoryId,
            confidence: newConfidence,
          })
          .where(eq(transaction.id, recategorized.transactionId));

        updatedCount++;
        if (newConfidence >= CONFIDENCE_THRESHOLD) {
          improvedCount++;
        }

        logger.info(
          `Updated transaction ${recategorized.transactionId}: confidence ${originalTx.confidence} → ${newConfidence}`
        );
      }
    }

    logger.info(
      `Second-pass complete: ${updatedCount} transactions updated, ${improvedCount} now above confidence threshold`
    );

    return {
      success: true,
      totalReviewed: lowConfidenceTransactions.length,
      updated: updatedCount,
      improvedAboveThreshold: improvedCount,
    };
  },
});
