import { db } from '@/db'
import { waitlist } from '@/db/schema'
import { env } from '@/env'
import { ratelimit } from '@/lib/ratelimit'
import { resend } from '@/lib/resend'
import { sendBetaAccessGrantedTask } from '@/trigger/emails/send-beta-access-granted'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const grantAccessSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (apiKey !== env.BACKOFFICE_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = grantAccessSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const email = parsed.data.email.toLowerCase().trim()

  const [entry] = await db
    .select({ id: waitlist.id, grantedAccess: waitlist.grantedAccess })
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1)

  if (!entry) {
    return Response.json(
      { error: 'Email not found in waitlist' },
      { status: 404 },
    )
  }

  if (entry.grantedAccess) {
    return Response.json({ message: 'Access already granted' }, { status: 200 })
  }

  await db
    .update(waitlist)
    .set({ grantedAccess: true, grantedAt: new Date() })
    .where(eq(waitlist.id, entry.id))

  await resend.removeContactFromSegment(email, env.RESEND_WAITLIST_SEGMENT_ID)

  await sendBetaAccessGrantedTask.trigger({ to: email })

  return Response.json({ success: true, message: 'Access granted' })
}
