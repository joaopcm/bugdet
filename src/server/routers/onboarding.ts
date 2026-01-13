import { INDUSTRIES } from '@/constants/onboarding'
import { db } from '@/db'
import { userProfile } from '@/db/schema'
import { generateInitialCategoriesTask } from '@/trigger/ai/generate-initial-categories'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

const workTypeSchema = z.enum([
  'employed',
  'self_employed',
  'business_owner',
  'student',
  'retired',
  'unemployed',
])

const primaryUseSchema = z.enum(['personal', 'business', 'both'])

const industrySchema = z.enum(
  INDUSTRIES.map((i) => i.value) as [string, ...string[]],
)

export const onboardingRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select({ onboardingCompleted: userProfile.onboardingCompleted })
      .from(userProfile)
      .where(eq(userProfile.userId, ctx.user.id))

    return {
      completed: profile?.onboardingCompleted ?? false,
    }
  }),

  complete: protectedProcedure
    .input(
      z.object({
        workType: workTypeSchema.nullable(),
        primaryUse: primaryUseSchema.nullable(),
        industry: industrySchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(userProfile)
        .values({
          userId: ctx.user.id,
          workType: input.workType,
          primaryUse: input.primaryUse,
          industry: input.industry,
          onboardingCompleted: true,
        })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: {
            workType: input.workType,
            primaryUse: input.primaryUse,
            industry: input.industry,
            onboardingCompleted: true,
          },
        })

      await generateInitialCategoriesTask.trigger({
        userId: ctx.user.id,
      })

      return {
        success: true,
      }
    }),
})
