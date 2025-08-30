import { db } from '@/db'
import { account, session, user, verification } from '@/db/schema'
import { env } from '@/env'
import { sendAccountConfirmationTask } from '@/trigger/emails/send-account-confirmation'
import { sendPasswordRecoveryTask } from '@/trigger/emails/send-password-recovery'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

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
      await sendPasswordRecoveryTask.trigger({
        to: user.email,
        url,
      })
    },
  },
})
