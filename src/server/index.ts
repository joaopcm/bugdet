import { db } from '@/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { bankStatementRouter } from './routers/bank-statement'
import { router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({
  bankStatement: bankStatementRouter,
})

export type AppRouter = typeof appRouter
