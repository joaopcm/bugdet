import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
