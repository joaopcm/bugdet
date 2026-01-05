import z from 'zod'

const ocrTransactionItemSchema = z.object({
  date: z
    .string()
    .date()
    .describe('The date of the transaction (e.g. "2025-01-01").'),
  merchantName: z
    .string()
    .describe(
      "The merchant's name written in the same way as on the document. Do not include any unrelated information like the date, installments, etc. Only include the merchant's name.",
    ),
  amount: z
    .number()
    .describe(
      'The amount of the transaction in cents (e.g. "1000" for $10.00, "100" for $1.00, "10" for $0.10, etc.). Use positive numbers for when the transaction is a debit (e.g. a purchase, a withdrawal, etc.) and negative numbers for when the transaction is a credit (e.g. a refund, a deposit, etc.).',
    ),
  currency: z
    .string()
    .describe(
      'The effective currency of the transaction. Use the ISO 4217 currency code (e.g. "USD", "BRL", "EUR", etc.).',
    ),
})

export const ocrSchema = z.object({
  transactions: z.array(ocrTransactionItemSchema),
})

const categorizedTransactionItemSchema = ocrTransactionItemSchema
  .extend({
    category: z
      .string()
      .nullable()
      .describe(
        'The category of the transaction based on the merchant name and relevant information (e.g. "Food", "Transportation", "Entertainment", "Shopping", "Health", "Education", "Other"). Leave null if you cannot find a category.',
      ),
    confidence: z
      .number()
      .optional()
      .describe(
        'Your confidence level about the transaction being correctly extracted and categorized. Use an integer between 0 and 100. 100 is the highest confidence level.',
      ),
  })
  .describe('A transaction item extracted from the bank statement.')

export const categorizationSchema = z.object({
  transactions: z.array(categorizedTransactionItemSchema),
})
