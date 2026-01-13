import 'server-only'

import { db } from '@/db'
import { userProfile } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getUserOnboardingStatus(
  userId: string,
): Promise<{ completed: boolean }> {
  const [profile] = await db
    .select({ onboardingCompleted: userProfile.onboardingCompleted })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))

  return {
    completed: profile?.onboardingCompleted ?? false,
  }
}
