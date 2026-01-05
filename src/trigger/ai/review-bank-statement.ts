import { AbortTaskRunError, logger, retry, task } from '@trigger.dev/sdk/v3'
import { Output, generateText } from 'ai'
import { z } from 'zod'
import { getBankStatementPresignedUrlTask } from './get-bank-statement-presigned-url'

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

    logger.info('Analyzing bank statement with AI...')
    const result = await generateText({
      model: 'google/gemini-2.5-flash',
      output: Output.object({
        schema,
      }),
      messages: [
        {
          role: 'system',
          content:
            'You are a bank statement expert. You are given a file and you need to determine if it looks like a bank statement. If it is not a valid bank statement, you need to provide a reason why it is not a valid bank statement.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Is this file a bank statement?',
            },
            {
              type: 'file',
              data: fileBuffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    })
    logger.info('AI analysis complete', result.output)

    return result.output
  },
})
