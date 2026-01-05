import { extractTextFromPdf } from '@/lib/pdf'
import { openai } from '@ai-sdk/openai'
import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

export const reviewBankStatementTask = task({
  id: 'review-bank-statement',
  retry: {
    randomize: false,
  },
  run: async (payload: { uploadId: string }) => {
    logger.info(`Reviewing upload ${payload.uploadId}...`)

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

    logger.info('Extracting text from PDF...')
    const pdfText = await extractTextFromPdf(fileBuffer)
    logger.info(`Extracted ${pdfText.length} characters from PDF`)

    const schema = z.object({
      isValid: z
        .boolean()
        .describe(
          'Whether the file matches the expected format of a bank statement.',
        ),
      reason: z
        .string()
        .describe(
          'The reason for the validity of the file. This is only set if isValid is false. E.g. "The file is not a bank statement. It looks like a screenshot of a webpage."',
        )
        .optional(),
    })

    logger.info('Analyzing bank statement with AI...')
    const result = await generateObject({
      model: openai('gpt-5-mini'),
      mode: 'json',
      schemaName: 'review-bank-statement',
      schemaDescription:
        'A JSON schema to represent whether a submitted file looks like a bank statement.',
      output: 'object',
      schema,
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given the text content extracted from a document and you need to determine if it looks like a bank statement. If it is not a valid bank statement, you need to provide a reason why it is not a valid bank statement.',
        },
        {
          role: 'user',
          content: `Is this a bank statement? Here is the text content extracted from the document:\n\n${pdfText}`,
        },
      ],
    })
    logger.info('AI analysis complete', result.object)

    return result.object
  },
})
