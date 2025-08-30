import ForgotPasswordEmail from '@/components/emails/templates/forgot-password'
import { db } from '@/db'
import { account, session, user, verification } from '@/db/schema'
import { env } from '@/env'
import { sendAccountConfirmationTask } from '@/trigger/emails/send-account-confirmation'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { logger } from '../logger'
import { resend } from '../resend'

export const auth = betterAuth({
  appName: 'Bugdet.co',
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      account,
      session,
      verification,
    },
  }),
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAccountConfirmationTask.trigger({
        to: user.email,
        url,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      logger.info('Sending reset password email to', user.email)
      const email = await resend.sendEmail({
        to: user.email,
        subject: 'Reset your password',
        react: <ForgotPasswordEmail resetPasswordLink={url} />,
      })
      logger.info('Email sent to', user.email, email)
    },
  },
})
