import { db } from '@/db'
import { auth } from '@/lib/auth/auth'
import { type TenantContext, getOrCreateTenant } from '@/lib/tenant'
import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

export async function createTRPCContext(opts: { headers: Headers }) {
  const authSession = await auth.api.getSession({
    headers: opts.headers,
  })

  return {
    db,
    headers: opts.headers,
    user: authSession?.user,
  }
}
type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
    })
  }

  const tenant = await getOrCreateTenant(ctx.user.id)

  return next({
    ctx: {
      user: ctx.user,
      tenant,
    },
  })
})

export type ProtectedContext = {
  user: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>['user']>
  tenant: TenantContext
}
