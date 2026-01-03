import PasswordRequiredEmail from '@/components/emails/templates/password-required'
import { resend } from '@/lib/resend'
import { logger, task } from '@trigger.dev/sdk/v3'

export const sendPasswordRequiredTask = task({
  id: 'send-password-required',
  run: async (
    payload: { to: string; fileName: string; uploadsLink: string },
    { ctx },
  ) => {
    logger.info(`Sending password required email to ${payload.to}...`, {
      payload,
      ctx,
    })
    const email = await resend.sendEmail({
      to: payload.to,
      subject: 'Password required for your bank statement',
      react: (
        <PasswordRequiredEmail
          fileName={payload.fileName}
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
