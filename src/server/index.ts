import { db } from '@/db'
import { user } from '@/db/schema'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { publicProcedure, router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({
  greeting: publicProcedure.query(async () => {
    return await db.select().from(user)
  }),
})

export type AppRouter = typeof appRouter
