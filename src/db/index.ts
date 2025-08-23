import { env } from '@/env'
import { upstashCache } from 'drizzle-orm/cache/upstash'
import { drizzle } from 'drizzle-orm/node-postgres'

export const db = drizzle(env.DATABASE_URL, {
  cache: upstashCache({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    global: true,
  }),
})
