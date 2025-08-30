import SignUpEmail from '@/components/emails/templates/sign-up'
import { resend } from '@/lib/resend'
import { logger, task } from '@trigger.dev/sdk/v3'

export const sendAccountConfirmationTask = task({
  id: 'send-account-confirmation',
  run: async (payload: { to: string; url: string }, { ctx }) => {
    logger.info(`Sending account confirmation email to ${payload.to}...`, {
      payload,
      ctx,
    })
    const email = await resend.sendEmail({
      to: payload.to,
      subject: 'Verify your email address',
      react: <SignUpEmail confirmationLink={payload.url} />,
    })
    logger.info('Email sent to ${payload.to}', { email })

    return { success: true }
  },
  catchError: async ({ ctx, error, payload }) => {
    logger.error(`Run ${ctx.run.id} failed`, {
      payload,
      error,
    })
  },
})
