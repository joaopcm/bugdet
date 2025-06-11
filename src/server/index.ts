import { db } from '@/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { transactionsRouter } from './routers/transactions'
import { uploadsRouter } from './routers/uploads'
import { router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({
  uploads: uploadsRouter,
  transactions: transactionsRouter,
})

export type AppRouter = typeof appRouter
