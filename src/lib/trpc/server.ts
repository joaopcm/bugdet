import { appRouter } from '@/server'
import { createCallerFactory, createTRPCContext } from '@/server/trpc'
import { headers } from 'next/headers'

function createContext(opts: { headers: Headers }) {
  return createTRPCContext({
    headers: opts.headers,
  })
}

const createCaller = createCallerFactory(appRouter)

export const serverClient = await createCaller(
  await createContext({
    headers: await headers(),
  }),
)
