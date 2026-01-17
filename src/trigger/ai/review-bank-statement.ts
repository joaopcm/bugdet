import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
import type { PdfPageImage } from "@/lib/pdf";
import { getUploadImages, type PageImage } from "@/lib/uploads/get-page-images";

const documentTypeEnum = z.enum([
  "checking_statement",
  "savings_statement",
  "credit_card_statement",
  "unknown",
]);

export type DocumentType = z.infer<typeof documentTypeEnum>;

const schema = z.object({
  isValid: z
    .boolean()
    .describe(
      "Whether the document is a valid bank statement or credit card statement."
    ),
  reason: z
    .string()
    .optional()
    .describe(
      'Required if isValid is false. Explain why this is not a bank statement (e.g., "This appears to be a screenshot of a website", "This is a receipt, not a bank statement", "The document is illegible or corrupted").'
    ),
  documentType: documentTypeEnum.describe(
    'The type of financial document. Use "checking_statement" for checking/current account statements, "savings_statement" for savings account statements, "credit_card_statement" for credit card statements, or "unknown" if unclear.'
  ),
  documentLanguage: z
    .string()
    .optional()
    .describe(
      'The primary language of the document (e.g., "English", "Portuguese", "Spanish").'
    ),
});

function buildImageContent(images: (PdfPageImage | PageImage)[]) {
  const pagesToCheck = images.slice(0, 5);

  return pagesToCheck.map((img) => ({
    type: "image" as const,
    image: Buffer.from(img.base64, "base64"),
    mimeType: img.mimeType,
  }));
}

export const reviewBankStatementTask = task({
  id: "review-bank-statement",
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string; pageCount?: number }) => {
    logger.info(`Reviewing upload ${payload.uploadId}...`);

    const images = await getUploadImages(
      payload.uploadId,
      { start: 1, end: 5 },
      payload.pageCount
    );

    if (images.length === 0) {
      return {
        isValid: false,
        reason:
          "The PDF file could not be processed. It may be corrupted or empty.",
        documentType: "unknown" as const,
      };
    }

    logger.info("Analyzing bank statement with AI...");
    const result = await generateObject({
      model: "anthropic/claude-haiku-4.5",
      mode: "json",
      schemaName: "review-bank-statement",
      schemaDescription:
        "Validation result for whether a document is a legitimate bank statement.",
      schema,
      messages: [
        {
          role: "system",
          content: `You are a bank statement validation expert. Analyze the provided document images and determine if this is a legitimate bank statement or credit card statement.

A VALID bank statement typically has:
- Bank name/logo clearly visible
- Account holder information
- Statement period dates
- Transaction list with dates, descriptions, and amounts
- Opening and/or closing balance
- Official formatting and letterhead

REJECT documents that are:
- Screenshots of websites or apps
- Receipts or invoices
- Spreadsheets or manually created documents
- Illegible, blurry, or corrupted images
- Partial statements missing key information
- Any document that is NOT an official bank/credit card statement

DOCUMENT TYPE IDENTIFICATION:
- "checking_statement": A checking/current account bank statement showing deposits, withdrawals, and daily transactions
- "savings_statement": A savings account statement showing deposits, interest, and withdrawals
- "credit_card_statement": A credit card bill showing purchases, payments, and credit limit information
- "unknown": If you cannot determine the document type with confidence

You will be provided with up to 5 pages of the document.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze these document pages and determine if this is a valid bank statement.

## EXAMPLE OUTPUT
\`\`\`json
{
  "isValid": true,
  "documentType": "checking_statement",
  "documentLanguage": "English"
}
\`\`\`

Or if invalid:
\`\`\`json
{
  "isValid": false,
  "reason": "This appears to be a screenshot of a banking app, not an official bank statement.",
  "documentType": "unknown",
  "documentLanguage": "English"
}
\`\`\``,
            },
            ...buildImageContent(images),
          ],
        },
      ],
    });
    logger.info("AI analysis complete", result.object);

    return result.object;
  },
});
