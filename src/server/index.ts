import { db } from '@/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({})

export type AppRouter = typeof appRouter
