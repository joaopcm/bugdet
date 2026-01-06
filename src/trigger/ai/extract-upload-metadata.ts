import { db } from '@/db'
import { upload } from '@/db/schema'
import { type PdfPageImage, convertPdfToImages } from '@/lib/pdf'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

const schema = z
  .object({
    documentType: z
      .string()
      .optional()
      .describe(
        'The type of financial document (e.g., "Credit Card Statement", "Checking Account Statement", "Savings Account Statement", "Investment Account Statement").',
      ),
    bankName: z
      .string()
      .optional()
      .describe(
        'The name of the financial institution exactly as it appears on the document (e.g., "Bank of America", "Nubank", "Chase", "Itaú").',
      ),
    statementPeriod: z
      .object({
        startDate: z
          .string()
          .optional()
          .describe(
            'The start date of the statement period in the format "DD MMM YYYY" (e.g., "01 JAN 2025", "14 ABR 2025").',
          ),
        endDate: z
          .string()
          .optional()
          .describe(
            'The end date of the statement period in the format "DD MMM YYYY" (e.g., "31 JAN 2025", "14 MAI 2025").',
          ),
      })
      .optional()
      .describe('The billing or statement period covered by this document.'),
    accountNumber: z
      .string()
      .optional()
      .describe(
        'The last 4 digits of the account number if visible (e.g., "****1234").',
      ),
    extraInformation: z
      .array(
        z.object({
          key: z
            .string()
            .describe(
              'The key in English (e.g., "Credit Limit", "Interest Rate", "Minimum Payment", "Due Date", "Account Holder Name", "Previous Balance", "Total Due").',
            ),
          value: z
            .string()
            .describe(
              'The value in the original language/format from the statement (e.g., "R$ 1.000,00", "10.5%", "USD 500.00").',
            ),
        }),
      )
      .max(5)
      .optional()
      .describe(
        'Up to 5 key financial details from the statement header/summary. Focus on: credit limit, due date, minimum payment, previous balance, total due.',
      ),
  })
  .describe('Metadata extracted from a bank statement for indexing and search.')

function buildImageContent(images: PdfPageImage[]) {
  // Use first 2 pages for metadata (header info is usually on page 1)
  const pagesToCheck = images.slice(0, 2)

  return pagesToCheck.map((img) => ({
    type: 'image' as const,
    image: Buffer.from(img.base64, 'base64'),
    mimeType: img.mimeType,
  }))
}

export const extractUploadMetadataTask = task({
  id: 'extract-upload-metadata',
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string }) => {
    logger.info(`Extracting metadata from upload ${payload.uploadId}...`)

    const presignedUrl = await getBankStatementPresignedUrlTask
      .triggerAndWait({
        uploadId: payload.uploadId,
      })
      .unwrap()

    if (!presignedUrl.url) {
      throw new AbortTaskRunError(
        `Failed to get presigned URL for upload ${payload.uploadId}`,
      )
    }

    logger.info(
      `Downloading bank statement for upload ${payload.uploadId} via presigned URL...`,
    )
    const response = await retry.fetch(presignedUrl.url, {
      method: 'GET',
    })
    const fileBuffer = await response.arrayBuffer()

    logger.info('Converting PDF to images...')
    const images = await convertPdfToImages(fileBuffer)
    logger.info(`Converted ${images.length} pages to images`)

    if (images.length === 0) {
      throw new AbortTaskRunError(
        `No images extracted from PDF for upload ${payload.uploadId}`,
      )
    }

    logger.info('Extracting metadata with Gemini Vision...')
    const result = await generateObject({
      model: 'google/gemini-2.5-flash',
      mode: 'json',
      schemaName: 'extract-upload-metadata',
      schemaDescription:
        'Metadata extracted from a bank statement for indexing and search.',
      schema,
      messages: [
        {
          role: 'system',
          content: `You are a financial document analyst. Extract key metadata from bank statements and credit card statements.

Focus on extracting:
1. The EXACT bank/institution name as shown (including any logos you can identify)
2. The document type (credit card, checking, savings, etc.)
3. The statement period (start and end dates)
4. Account number (last 4 digits only for privacy)
5. Key financial summary information (credit limit, due date, balances, etc.)

Be precise with dates and numbers. Preserve the original formatting of monetary values.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the metadata from this bank statement. Focus on the header and summary sections.',
            },
            ...buildImageContent(images),
          ],
        },
      ],
    })
    logger.info('AI analysis complete', result.object)

    await db
      .update(upload)
      .set({
        metadata: result.object,
      })
      .where(eq(upload.id, payload.uploadId))

    return { success: true }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })

    return {
      skipRetrying: true,
    }
  },
})
