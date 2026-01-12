import UploadCompletedEmail from '@/components/emails/templates/upload-completed'
import { resend } from '@/lib/resend'
import { logger, task } from '@trigger.dev/sdk/v3'

export const sendUploadCompletedTask = task({
  id: 'send-upload-completed',
  run: async (
    payload: {
      to: string
      fileName: string
      transactionCount: number
      categoriesCreated: number
      rulesApplied: number
      lowConfidenceCount: number
      uploadsLink: string
    },
    { ctx },
  ) => {
    logger.info(`Sending upload completed email to ${payload.to}...`, {
      payload,
      ctx,
    })
    const email = await resend.sendEmail({
      to: payload.to,
      subject: 'Your bank statement has been processed',
      react: (
        <UploadCompletedEmail
          fileName={payload.fileName}
          transactionCount={payload.transactionCount}
          categoriesCreated={payload.categoriesCreated}
          rulesApplied={payload.rulesApplied}
          lowConfidenceCount={payload.lowConfidenceCount}
          uploadsLink={payload.uploadsLink}
        />
      ),
    })
    logger.info(`Email sent to ${payload.to}`, { email })

    return { success: true }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })
  },
})
