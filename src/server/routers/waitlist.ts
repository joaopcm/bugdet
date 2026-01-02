import { waitlist } from '@/db/schema'
import { env } from '@/env'
import { ratelimit } from '@/lib/ratelimit'
import { resend } from '@/lib/resend'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const waitlistRouter = router({
  join: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const ip =
        ctx.headers.get('x-forwarded-for')?.split(',')[0] ||
        ctx.headers.get('x-real-ip') ||
        'unknown'

      const { success } = await ratelimit.limit(ip)
      if (!success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        })
      }

      const email = input.email.toLowerCase().trim()

      const [existing] = await ctx.db
        .select({ id: waitlist.id })
        .from(waitlist)
        .where(eq(waitlist.email, email))
        .limit(1)

      if (existing) {
        return { success: true, message: "You're already on the waitlist!" }
      }

      await ctx.db.insert(waitlist).values({ email })

      try {
        await resend.createContactWithSegment(
          email,
          env.RESEND_WAITLIST_SEGMENT_ID,
        )
      } catch {
        // Don't fail the request if Resend fails, email is already in DB
      }

      return { success: true, message: "You're on the list!" }
    }),
})
