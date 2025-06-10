import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const uploadStatusEnum = pgEnum('upload_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
])

export type UploadMetadata = {
  documentType?: string | null
  bankName?: string | null
  statementPeriod: {
    startDate?: string | null
    endDate?: string | null
  }
  extraInformation: {
    key: string
    value: string
  }[]
}

export const upload = pgTable('upload', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  status: uploadStatusEnum('status').notNull().default('queued'),
  failedReason: text('failed_reason'),
  metadata: jsonb('metadata').$type<UploadMetadata>(),
  deleted: boolean('deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type TransactionMetadata = {
  originalCurrency?: string | null
  originalAmount?: number | null
  installmentNumber?: number | null
  totalInstallments?: number | null
}

export const transaction = pgTable('transaction', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  uploadId: uuid('upload_id')
    .notNull()
    .references(() => upload.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  merchantName: text('merchant_name').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  metadata: jsonb('metadata').$type<TransactionMetadata>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
