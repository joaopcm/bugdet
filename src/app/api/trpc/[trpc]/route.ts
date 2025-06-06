import { appRouter } from '@/server'
import { createTRPCContext } from '@/server/trpc'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: async ({ req }) =>
      await createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
