import { db } from '@/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { uploadsRouter } from './routers/uploads'
import { router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({
  uploads: uploadsRouter,
})

export type AppRouter = typeof appRouter
