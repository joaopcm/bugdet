import { AbortTaskRunError, logger, retry, task } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { upload } from "@/db/schema";
import { createLambdaClient } from "@/lib/supabase/server";

const extractedTransactionSchema = z.object({
  date: z
    .string()
    .describe(
      'Transaction date in ISO format YYYY-MM-DD (e.g., "2025-01-15"). Parse dates carefully from the CSV.'
    ),
  merchantName: z
    .string()
    .describe(
      'Merchant name EXACTLY as shown in CSV. Keep prefixes like "Ifd*", "Pag*", "MP*". Only remove: installment suffixes (1/3, PARC 01/12) and payment method indicators at the end.'
    ),
  description: z
    .string()
    .optional()
    .describe(
      'Additional transaction details if present (e.g., "Online purchase", "ATM withdrawal", installment info "2/6").'
    ),
  amount: z
    .number()
    .describe(
      "Amount in CENTS as integer. POSITIVE for money OUT (purchases, payments, withdrawals, fees). NEGATIVE for money IN (deposits, refunds, cashback, interest received). Example: $10.50 expense = 1050, $25.00 refund = -2500."
    ),
  currency: z
    .string()
    .describe(
      'ISO 4217 currency code (e.g., "USD", "BRL", "EUR"). Use the statement\'s primary currency.'
    ),
});

const extractionResultSchema = z.object({
  transactions: z.array(extractedTransactionSchema),
  statementCurrency: z
    .string()
    .describe("Primary currency of the statement (ISO 4217 code)."),
  openingBalance: z
    .number()
    .optional()
    .describe("Opening/previous balance in cents if clearly visible."),
  closingBalance: z
    .number()
    .optional()
    .describe("Closing/ending balance in cents if clearly visible."),
});

function buildSystemPrompt(
  answers: Record<string, string>,
  inferredMapping?: {
    dateColumn?: string;
    merchantColumn?: string;
    amountColumn?: string;
    descriptionColumn?: string;
  }
) {
  const userContext = Object.entries(answers)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  const mappingContext = inferredMapping
    ? `
## INFERRED COLUMN MAPPING
- Date column: ${inferredMapping.dateColumn ?? "Not specified"}
- Merchant/Description column: ${inferredMapping.merchantColumn ?? "Not specified"}
- Amount column: ${inferredMapping.amountColumn ?? "Not specified"}
- Description/Memo column: ${inferredMapping.descriptionColumn ?? "Not specified"}`
    : "";

  return `You are an expert financial document analyst specializing in extracting transactions from CSV bank statement exports.

## USER-PROVIDED CONTEXT
${userContext}
${mappingContext}

## YOUR TASK
Analyze the provided CSV data and extract ALL transactions into a structured format with perfect accuracy.

## CRITICAL RULES

### Transaction Identification
- Extract EVERY transaction row from the CSV
- Skip header rows and summary rows
- Watch for blank rows or separator rows - skip them
- Do NOT skip any actual transactions - completeness is critical

### Date Parsing
- Convert all dates to ISO format: YYYY-MM-DD
- Handle various formats: "Jan 15", "15/01/2025", "01-15-25", "2025-01-15", etc.
- Use the user's date format context if provided
- If year is missing, infer from context

### Merchant Name (KEEP AS-IS)
Keep the merchant name EXACTLY as shown. Preserve all prefixes and identifiers.

KEEP prefixes like:
- "Ifd*", "Pag*", "MP*", "PAG*", "SQ*", etc.

ONLY REMOVE:
- Installment suffixes at the end (1/3, 2/6, PARC 01/12)
- Payment method indicators at the very end

### Amount Sign Convention (IMPORTANT!)
Based on the user's context or your analysis of the data:
- POSITIVE amounts = Money leaving the account (expenses, purchases, payments, fees, withdrawals)
- NEGATIVE amounts = Money entering the account (deposits, refunds, credits, interest, income)

Convert to cents: $10.50 = 1050, R$ 25,00 = 2500

If the CSV has separate debit/credit columns:
- Debits → POSITIVE (expenses)
- Credits → NEGATIVE (income)

If the CSV has a single amount column, interpret based on:
- User's context about sign convention
- Column headers or indicators
- Transaction descriptions (look for "deposit", "refund", "payment", etc.)

### Deduplication
- Same date + same merchant + same amount = likely duplicate, extract only once

### Accuracy Focus
- Preserve exact spelling and formatting of merchant names
- Do not guess or infer missing data - only extract what is clearly visible`;
}

function buildUserPrompt(csvContent: string) {
  return `## CSV CONTENT
\`\`\`
${csvContent}
\`\`\`

## INSTRUCTIONS
1. Parse ALL transaction rows from the CSV
2. Keep merchant names exactly as shown (preserve prefixes)
3. Apply correct sign convention (positive = expense, negative = income)
4. Convert amounts to cents
5. Do not skip any transactions

## EXAMPLE OUTPUT FORMAT
\`\`\`json
{
  "transactions": [
    {
      "date": "2025-01-15",
      "merchantName": "Ifd*Japakitos",
      "description": "2/3",
      "amount": 2500,
      "currency": "BRL"
    },
    {
      "date": "2025-01-14",
      "merchantName": "NETFLIX.COM",
      "amount": 3990,
      "currency": "BRL"
    },
    {
      "date": "2025-01-10",
      "merchantName": "TED RECEBIDO",
      "description": "Salary deposit",
      "amount": -500000,
      "currency": "BRL"
    }
  ],
  "statementCurrency": "BRL"
}
\`\`\`

Now analyze the CSV and extract all transactions with perfect accuracy.`;
}

export const extractTransactionsCsvTask = task({
  id: "extract-transactions-csv",
  retry: { randomize: false },
  run: async (payload: { uploadId: string }, { ctx }) => {
    logger.info(`Extracting transactions from CSV ${payload.uploadId}...`, {
      payload,
      ctx,
    });

    const [uploadRecord] = await db
      .select({
        id: upload.id,
        filePath: upload.filePath,
        tenantId: upload.tenantId,
        metadata: upload.metadata,
      })
      .from(upload)
      .where(eq(upload.id, payload.uploadId));

    if (!uploadRecord) {
      throw new AbortTaskRunError(
        `Upload ${payload.uploadId} not found in database`
      );
    }

    const csvConfig = uploadRecord.metadata?.csvConfig;
    if (!csvConfig?.answers) {
      throw new AbortTaskRunError(
        `Upload ${payload.uploadId} missing CSV configuration answers`
      );
    }

    const supabase = createLambdaClient();
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("bank-statements")
        .createSignedUrl(uploadRecord.filePath, 60 * 15);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logger.error(`Failed to get signed URL for upload ${payload.uploadId}`, {
        error: signedUrlError?.message,
      });
      throw new Error("Failed to get signed URL");
    }

    logger.info(`Downloading CSV file for upload ${payload.uploadId}...`);
    const response = await retry.fetch(signedUrlData.signedUrl, {
      method: "GET",
    });
    const csvContent = await response.text();

    logger.info("Extracting transactions with AI...");
    const result = await generateObject({
      model: "anthropic/claude-sonnet-4.5",
      mode: "json",
      schemaName: "extract-transactions-csv",
      schemaDescription:
        "Transactions extracted from a CSV bank statement with high accuracy.",
      schema: extractionResultSchema,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(
            csvConfig.answers,
            csvConfig.inferredMapping
          ),
        },
        {
          role: "user",
          content: buildUserPrompt(csvContent),
        },
      ],
    });

    logger.info("CSV transaction extraction complete", {
      transactionCount: result.object.transactions.length,
      statementCurrency: result.object.statementCurrency,
      openingBalance: result.object.openingBalance,
      closingBalance: result.object.closingBalance,
    });

    const supabaseAdmin = createLambdaClient();
    const { error: deleteError } = await supabaseAdmin.storage
      .from("bank-statements")
      .remove([uploadRecord.filePath]);

    if (deleteError) {
      logger.warn(`Failed to delete CSV file: ${deleteError.message}`);
    } else {
      await db
        .update(upload)
        .set({ pdfDeleted: true })
        .where(eq(upload.id, payload.uploadId));
      logger.info(`Deleted CSV file for upload ${payload.uploadId}`);
    }

    return {
      success: true,
      uploadId: payload.uploadId,
      tenantId: uploadRecord.tenantId,
      ...result.object,
    };
  },
});
