import { db } from '@/db'
import { upload } from '@/db/schema'
import type { PdfPageImage } from '@/lib/pdf'
import { type PageImage, getUploadImages } from '@/lib/uploads/get-page-images'
import { AbortTaskRunError, logger, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { DocumentType } from './review-bank-statement'

const extractedTransactionSchema = z.object({
  date: z
    .string()
    .describe(
      'Transaction date in ISO format YYYY-MM-DD (e.g., "2025-01-15"). Parse dates carefully from the statement.',
    ),
  merchantName: z
    .string()
    .describe(
      'Merchant name EXACTLY as shown on statement. Keep prefixes like "Ifd*", "Pag*", "MP*". Only remove: installment suffixes (1/3, PARC 01/12) and payment method indicators at the end. Example: "Ifd*Japakitos 2/3" → "Ifd*Japakitos".',
    ),
  description: z
    .string()
    .optional()
    .describe(
      'Additional transaction details if present (e.g., "Online purchase", "ATM withdrawal", installment info "2/6").',
    ),
  amount: z
    .number()
    .describe(
      'Amount in CENTS as integer. POSITIVE for money OUT (purchases, payments, withdrawals, fees). NEGATIVE for money IN (deposits, refunds, cashback, interest received). Example: $10.50 expense = 1050, $25.00 refund = -2500.',
    ),
  currency: z
    .string()
    .describe(
      'ISO 4217 currency code (e.g., "USD", "BRL", "EUR"). Use the statement\'s primary currency.',
    ),
})

const extractionResultSchema = z.object({
  transactions: z.array(extractedTransactionSchema),
  statementCurrency: z
    .string()
    .describe('Primary currency of the statement (ISO 4217 code).'),
  openingBalance: z
    .number()
    .optional()
    .describe('Opening/previous balance in cents if clearly visible.'),
  closingBalance: z
    .number()
    .optional()
    .describe('Closing/ending balance in cents if clearly visible.'),
})

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>

export type ExtractionResult = z.infer<typeof extractionResultSchema>

function buildImageContent(images: (PdfPageImage | PageImage)[]) {
  return images.map((img) => ({
    type: 'image' as const,
    image: Buffer.from(img.base64, 'base64'),
    mimeType: img.mimeType,
  }))
}

function buildSystemPrompt(documentType: DocumentType) {
  const signConventionForCheckingSavings = `### Amount Sign Convention (IMPORTANT!)
Banks may display amounts differently on checking/savings statements. YOUR OUTPUT MUST FOLLOW THIS CONVENTION:
- POSITIVE amounts = Money leaving the account (expenses, purchases, payments, fees, withdrawals, debits)
- NEGATIVE amounts = Money entering the account (deposits, refunds, credits, interest, cashback, income)

Convert to cents: $10.50 = 1050, R$ 25,00 = 2500

IMPORTANT: On the statement, banks may show:
- Debits/withdrawals as negative and credits/deposits as positive (flip the sign)
- Or debits as positive and credits as negative (keep as-is)
- Or use D/C, DR/CR, or +/- indicators

ALWAYS OUTPUT:
- Expenses/debits/withdrawals → POSITIVE
- Income/deposits/credits → NEGATIVE

Look for context clues like "debit", "credit", "withdrawal", "deposit", D, C, DR, CR, +, - symbols.`

  const signConventionForCreditCard = `### Amount Sign Convention (IMPORTANT!)
Credit card statements may display amounts differently. YOUR OUTPUT MUST FOLLOW THIS CONVENTION:
- POSITIVE amounts = Purchases and charges you made (expenses, fees, interest charges)
- NEGATIVE amounts = Payments you made to the card and refunds/credits received

Convert to cents: $10.50 = 1050, R$ 25,00 = 2500

IMPORTANT: On credit card statements:
- Purchases typically appear as positive (you owe money) - keep as positive
- Payments to the card typically appear as negative or with "CR" - convert to negative
- Refunds/credits may appear with "CR" or negative - convert to negative

ALWAYS OUTPUT:
- Purchases/charges/fees → POSITIVE (money you spent/owe)
- Payments/refunds/credits → NEGATIVE (money reducing your balance)`

  const signConvention =
    documentType === 'credit_card_statement'
      ? signConventionForCreditCard
      : signConventionForCheckingSavings

  return `You are an expert financial document analyst specializing in extracting transactions from bank statements and credit card statements.

## DOCUMENT TYPE
This is a ${documentType === 'credit_card_statement' ? 'CREDIT CARD STATEMENT' : documentType === 'checking_statement' ? 'CHECKING ACCOUNT STATEMENT' : documentType === 'savings_statement' ? 'SAVINGS ACCOUNT STATEMENT' : 'BANK STATEMENT'}.

## YOUR TASK
Analyze the provided statement images and extract ALL transactions into a structured format with perfect accuracy.

## CRITICAL RULES

### Transaction Identification
- Extract EVERY transaction row from the transaction table/list
- Look for transactions across ALL pages - they may span multiple pages
- Transactions typically have: date, description/merchant, and amount columns
- Watch for page headers that repeat - don't extract them as transactions
- Do NOT skip any transactions - completeness is critical

### Date Parsing
- Convert all dates to ISO format: YYYY-MM-DD
- Handle various formats: "Jan 15", "15/01/2025", "01-15-25", etc.
- Use the statement period to infer the year if not explicitly shown
- If a date is unclear, use context clues from surrounding transactions

### Merchant Name (KEEP AS-IS)
Keep the merchant name EXACTLY as shown on the statement. Preserve all prefixes and identifiers.

KEEP prefixes like:
- "Ifd*", "Pag*", "MP*", "PAG*", "SQ*", etc.

Some transactions may have prefixes and we want to keep them as they are.

ONLY REMOVE:
- Installment suffixes at the end (1/3, 2/6, PARC 01/12)
- Payment method indicators at the very end

Examples:
- "Ifd*Japakitos 2/3" → "Ifd*Japakitos"
- "PAG*JoePizza" → "PAG*JoePizza"
- "MP*Uber PARC 01/06" → "MP*Uber"
- "NETFLIX.COM" → "NETFLIX.COM"

${signConvention}

### Deduplication
- Same date + same merchant + same amount = likely duplicate, extract only once
- Watch for "pending" and "posted" versions of the same transaction

### Accuracy Focus
- If text is hard to read, do your best to interpret it accurately
- Preserve exact spelling and formatting of merchant names
- Do not guess or infer missing data - only extract what is clearly visible`
}

function buildUserPrompt() {
  return `## INSTRUCTIONS
1. Examine ALL pages of the bank statement carefully
2. Extract EVERY transaction from the transaction table(s)
3. Keep merchant names exactly as shown (preserve prefixes like "Ifd*", "Pag*")
4. Apply correct sign convention (positive = expense, negative = income)
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
  "statementCurrency": "BRL",
  "openingBalance": 150000,
  "closingBalance": 125000
}
\`\`\`

Now analyze the statement images and extract all transactions with perfect accuracy.`
}

export const extractTransactionsTask = task({
  id: 'extract-transactions',
  retry: {
    randomize: false,
  },
  run: async (
    payload: {
      uploadId: string
      pageCount?: number
      documentType: DocumentType
    },
    { ctx },
  ) => {
    logger.info(
      `Extracting transactions for upload ${payload.uploadId} (document type: ${payload.documentType})...`,
      {
        payload,
        ctx,
      },
    )

    const images = await getUploadImages(
      payload.uploadId,
      'all',
      payload.pageCount,
    )

    if (images.length === 0) {
      throw new AbortTaskRunError('No pages could be extracted from the PDF')
    }

    const [uploadRecord] = await db
      .select({ tenantId: upload.tenantId })
      .from(upload)
      .where(eq(upload.id, payload.uploadId))

    if (!uploadRecord) {
      throw new AbortTaskRunError(
        `Upload ${payload.uploadId} not found in database`,
      )
    }

    logger.info('Extracting transactions with AI...')
    const result = await generateObject({
      model: 'anthropic/claude-sonnet-4.5',
      mode: 'json',
      schemaName: 'extract-transactions',
      schemaDescription:
        'Transactions extracted from a bank statement with high accuracy.',
      schema: extractionResultSchema,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(payload.documentType),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildUserPrompt(),
            },
            ...buildImageContent(images),
          ],
        },
      ],
    })

    logger.info('Transaction extraction complete', {
      transactionCount: result.object.transactions.length,
      statementCurrency: result.object.statementCurrency,
      openingBalance: result.object.openingBalance,
      closingBalance: result.object.closingBalance,
    })

    return {
      success: true,
      uploadId: payload.uploadId,
      tenantId: uploadRecord.tenantId,
      ...result.object,
    }
  },
})
