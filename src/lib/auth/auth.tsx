import SignUpEmail from '@/components/emails/templates/sign-up'
import { db } from '@/db'
import { account, session, user, verification } from '@/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI } from 'better-auth/plugins'
import { logger } from '../logger'
import { resend } from '../resend'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      account,
      session,
      verification,
    },
  }),
  plugins: [openAPI()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      logger.info('Sending verification email to', user.email)
      const email = await resend.sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        react: <SignUpEmail confirmationLink={url} />,
      })
      logger.info('Email sent to', user.email, email)
    },
  },
})
