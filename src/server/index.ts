import { db } from '@/db'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { categoriesRouter } from './routers/categories'
import { categorizationRulesRouter } from './routers/categorization-rules'
import { dashboardRouter } from './routers/dashboard'
import { transactionsRouter } from './routers/transactions'
import { uploadsRouter } from './routers/uploads'
import { router } from './trpc'

migrate(db, {
  migrationsFolder: 'drizzle',
})

export const appRouter = router({
  uploads: uploadsRouter,
  transactions: transactionsRouter,
  categories: categoriesRouter,
  categorizationRules: categorizationRulesRouter,
  dashboard: dashboardRouter,
})

export type AppRouter = typeof appRouter
