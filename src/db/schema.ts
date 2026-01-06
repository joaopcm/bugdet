import {
  boolean,
  date,
  index,
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
  twoFactorEnabled: boolean('two_factor_enabled'),
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

export const twoFactor = pgTable('two_factor', {
  id: text('id').primaryKey(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export type Waitlist = typeof waitlist.$inferSelect

export const waitlist = pgTable(
  'waitlist',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    email: text('email').notNull().unique(),
    grantedAccess: boolean('granted_access').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    grantedAt: timestamp('granted_at'),
  },
  (table) => ({
    emailIdx: index('waitlist_email_idx').on(table.email),
    grantedAccessIdx: index('waitlist_granted_access_idx').on(
      table.grantedAccess,
    ),
  }),
)

export const uploadStatusEnum = pgEnum('upload_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'waiting_for_password',
])

export type UploadMetadata = {
  documentType?: string | null
  bankName?: string | null
  statementPeriod?: {
    startDate?: string | null
    endDate?: string | null
  } | null
  extraInformation?:
    | {
        key: string
        value: string
      }[]
    | null
}

export type Upload = typeof upload.$inferSelect

export const upload = pgTable(
  'upload',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size').notNull(),
    status: uploadStatusEnum('status').notNull().default('queued'),
    encryptedPassword: text('encrypted_password'),
    failedReason: text('failed_reason'),
    metadata: jsonb('metadata').$type<UploadMetadata>(),
    deleted: boolean('deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('upload_user_id_idx').on(table.userId).concurrently(),
    deletedIdx: index('upload_deleted_idx').on(table.deleted).concurrently(),
  }),
)

export type Category = typeof category.$inferSelect

export const category = pgTable(
  'category',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    deleted: boolean('deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('category_user_id_idx').on(table.userId).concurrently(),
    deletedIdx: index('category_deleted_idx').on(table.deleted).concurrently(),
  }),
)

export type Transaction = typeof transaction.$inferSelect

export type TransactionMetadata = {
  originalCurrency?: string | null
  originalAmount?: number | null
  installmentNumber?: number | null
  totalInstallments?: number | null
}

export const transaction = pgTable(
  'transaction',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    uploadId: uuid('upload_id').references(() => upload.id, {
      onDelete: 'set null',
    }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => category.id, {
      onDelete: 'set null',
    }),
    date: date('date').notNull(),
    merchantName: text('merchant_name').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull(),
    confidence: integer('confidence').notNull().default(100),
    metadata: jsonb('metadata').$type<TransactionMetadata>(),
    deleted: boolean('deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('transaction_user_id_idx').on(table.userId).concurrently(),
    uploadIdIdx: index('transaction_upload_id_idx')
      .on(table.uploadId)
      .concurrently(),
    categoryIdIdx: index('transaction_category_id_idx')
      .on(table.categoryId)
      .concurrently(),
    confidenceIdx: index('transaction_confidence_idx')
      .on(table.confidence)
      .concurrently(),
    dateIdx: index('transaction_date_idx').on(table.date).concurrently(),
    deletedIdx: index('transaction_deleted_idx')
      .on(table.deleted)
      .concurrently(),
    merchantNameIdx: index('transaction_merchant_name_idx')
      .on(table.merchantName)
      .concurrently(),
  }),
)

export type MerchantCategory = typeof merchantCategory.$inferSelect

export const merchantCategory = pgTable(
  'merchant_category',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    merchantName: text('merchant_name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => category.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('merchant_category_user_id_idx')
      .on(table.userId)
      .concurrently(),
    categoryIdIdx: index('merchant_category_category_id_idx')
      .on(table.categoryId)
      .concurrently(),
  }),
)

export type RuleCondition = {
  field: 'merchant_name' | 'amount'
  operator: 'contains' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
  value: string | number
}

export type RuleAction = {
  type: 'set_sign' | 'set_category' | 'ignore'
  value?: 'positive' | 'negative' | string
}

export type CategorizationRule = typeof categorizationRule.$inferSelect

export const categorizationRule = pgTable(
  'categorization_rule',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    priority: integer('priority').notNull().default(0),
    logicOperator: text('logic_operator')
      .$type<'and' | 'or'>()
      .notNull()
      .default('and'),
    conditions: jsonb('conditions').$type<RuleCondition[]>().notNull(),
    actions: jsonb('actions').$type<RuleAction[]>().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    deleted: boolean('deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('categorization_rule_user_id_idx').on(table.userId),
    priorityIdx: index('categorization_rule_priority_idx').on(table.priority),
    deletedIdx: index('categorization_rule_deleted_idx').on(table.deleted),
  }),
)
