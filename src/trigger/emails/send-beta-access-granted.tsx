import BetaAccessGrantedEmail from '@/components/emails/templates/beta-access-granted'
import { env } from '@/env'
import { resend } from '@/lib/resend'
import { logger, task } from '@trigger.dev/sdk/v3'

export const sendBetaAccessGrantedTask = task({
  id: 'send-beta-access-granted',
  run: async (payload: { to: string }, { ctx }) => {
    logger.info(`Sending beta access granted email to ${payload.to}...`, {
      payload,
      ctx,
    })

    const signUpLink = `${env.NEXT_PUBLIC_APP_URL}/sign-up`

    const email = await resend.sendEmail({
      to: payload.to,
      subject: "You're in! Beta access granted",
      react: <BetaAccessGrantedEmail signUpLink={signUpLink} />,
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
