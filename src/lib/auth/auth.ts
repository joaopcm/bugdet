import { db } from '@/db'
import {
  account,
  session,
  twoFactor as twoFactorSchema,
  user,
  verification,
  waitlist,
} from '@/db/schema'
import { env } from '@/env'
import { sendAccountConfirmationTask } from '@/trigger/emails/send-account-confirmation'
import { sendPasswordRecoveryTask } from '@/trigger/emails/send-password-recovery'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { haveIBeenPwned, twoFactor } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'

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
      twoFactor: twoFactorSchema,
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
    minPasswordLength: 6,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 1_800, // 30 minutes in seconds
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordRecoveryTask.trigger({
        to: user.email,
        url,
      })
    },
  },
  plugins: [twoFactor({ issuer: 'bugdet.co' }), haveIBeenPwned()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        const email = ctx.body?.email?.toLowerCase().trim()
        if (!email) return

        const [entry] = await db
          .select({ grantedAccess: waitlist.grantedAccess })
          .from(waitlist)
          .where(eq(waitlist.email, email))
          .limit(1)

        if (!entry) {
          throw new APIError('NOT_FOUND', {
            message:
              "You're not on the waitlist. Please join the waitlist to get access.",
          })
        }

        if (!entry?.grantedAccess) {
          throw new APIError('FORBIDDEN', {
            message:
              "You're on the waitlist. We'll notify you when access is granted.",
          })
        }
      }
    }),
  },
  advanced: {
    cookiePrefix: 'bugdet',
    useSecureCookies: env.NODE_ENV === 'production',
  },
})
