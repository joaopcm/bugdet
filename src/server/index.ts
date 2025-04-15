import { publicProcedure, router } from './trpc'

export const appRouter = router({
  greeting: publicProcedure.query(() => {
    return 'Hello, world!'
  }),
})

export type AppRouter = typeof appRouter
