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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled"),
});

export const workTypeEnum = pgEnum("work_type", [
  "employed",
  "self_employed",
  "business_owner",
  "student",
  "retired",
  "unemployed",
]);

export const primaryUseEnum = pgEnum("primary_use", [
  "personal",
  "business",
  "both",
]);

export type UserProfile = typeof userProfile.$inferSelect;

export const userProfile = pgTable("user_profile", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  workType: workTypeEnum("work_type"),
  primaryUse: primaryUseEnum("primary_use"),
  industry: text("industry"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type UserTenant = typeof userTenant.$inferSelect;

export const userTenant = pgTable(
  "user_tenant",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    tenantId: uuid("tenant_id").notNull().unique(),
    userIdHash: text("user_id_hash").notNull().unique(),
    userIdEncrypted: text("user_id_encrypted").notNull(),
    dekEncrypted: text("dek_encrypted").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("user_tenant_tenant_id_idx").on(table.tenantId),
    userIdHashIdx: index("user_tenant_user_id_hash_idx").on(table.userIdHash),
  })
);

export type Waitlist = typeof waitlist.$inferSelect;

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    email: text("email").notNull().unique(),
    grantedAccess: boolean("granted_access").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    grantedAt: timestamp("granted_at"),
  },
  (table) => ({
    emailIdx: index("waitlist_email_idx").on(table.email),
    grantedAccessIdx: index("waitlist_granted_access_idx").on(
      table.grantedAccess
    ),
  })
);

export const uploadStatusEnum = pgEnum("upload_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "waiting_for_password",
]);

export interface UploadMetadata {
  documentType?: string | null;
  bankName?: string | null;
  statementPeriod?: {
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  extraInformation?:
    | {
        key: string;
        value: string;
      }[]
    | null;
}

export type Upload = typeof upload.$inferSelect;

export const upload = pgTable(
  "upload",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => userTenant.tenantId, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    status: uploadStatusEnum("status").notNull().default("queued"),
    encryptedPassword: text("encrypted_password"),
    failedReason: text("failed_reason"),
    metadata: jsonb("metadata").$type<UploadMetadata>(),
    pageCount: integer("page_count"),
    pdfDeleted: boolean("pdf_deleted").notNull().default(false),
    retryCount: integer("retry_count").notNull().default(0),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tenantIdIdx: index("upload_tenant_id_idx")
      .on(table.tenantId)
      .concurrently(),
    deletedIdx: index("upload_deleted_idx").on(table.deleted).concurrently(),
  })
);

export type Category = typeof category.$inferSelect;

export const category = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    name: text("name").notNull(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => userTenant.tenantId, { onDelete: "cascade" }),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tenantIdIdx: index("category_tenant_id_idx")
      .on(table.tenantId)
      .concurrently(),
    deletedIdx: index("category_deleted_idx").on(table.deleted).concurrently(),
  })
);

export type Transaction = typeof transaction.$inferSelect;

export interface TransactionMetadata {
  originalCurrency?: string | null;
  originalAmount?: number | null;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
}

export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    uploadId: uuid("upload_id").references(() => upload.id, {
      onDelete: "set null",
    }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => userTenant.tenantId, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    merchantName: text("merchant_name").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    confidence: integer("confidence").notNull().default(100),
    metadata: jsonb("metadata").$type<TransactionMetadata>(),
    fingerprint: text("fingerprint"),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tenantIdIdx: index("transaction_tenant_id_idx")
      .on(table.tenantId)
      .concurrently(),
    uploadIdIdx: index("transaction_upload_id_idx")
      .on(table.uploadId)
      .concurrently(),
    categoryIdIdx: index("transaction_category_id_idx")
      .on(table.categoryId)
      .concurrently(),
    confidenceIdx: index("transaction_confidence_idx")
      .on(table.confidence)
      .concurrently(),
    dateIdx: index("transaction_date_idx").on(table.date).concurrently(),
    deletedIdx: index("transaction_deleted_idx")
      .on(table.deleted)
      .concurrently(),
    merchantNameIdx: index("transaction_merchant_name_idx")
      .on(table.merchantName)
      .concurrently(),
    fingerprintIdx: index("transaction_fingerprint_idx").on(table.fingerprint),
  })
);

export interface RuleCondition {
  field: "merchant_name" | "amount";
  operator: "contains" | "neq" | "gt" | "lt" | "gte" | "lte" | "eq";
  value: string | number;
}

export interface RuleAction {
  type: "set_sign" | "set_category" | "ignore";
  value?: "positive" | "negative" | string;
}

export type CategorizationRule = typeof categorizationRule.$inferSelect;

export const categorizationRule = pgTable(
  "categorization_rule",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => userTenant.tenantId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priority: integer("priority").notNull().default(0),
    logicOperator: text("logic_operator")
      .$type<"and" | "or">()
      .notNull()
      .default("and"),
    conditions: jsonb("conditions").$type<RuleCondition[]>().notNull(),
    actions: jsonb("actions").$type<RuleAction[]>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tenantIdIdx: index("categorization_rule_tenant_id_idx").on(table.tenantId),
    priorityIdx: index("categorization_rule_priority_idx").on(table.priority),
    deletedIdx: index("categorization_rule_deleted_idx").on(table.deleted),
  })
);

export type Budget = typeof budget.$inferSelect;

export const budget = pgTable(
  "budget",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => userTenant.tenantId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: integer("target_amount").notNull(),
    currency: text("currency").notNull(),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tenantIdIdx: index("budget_tenant_id_idx").on(table.tenantId),
    deletedIdx: index("budget_deleted_idx").on(table.deleted),
  })
);

export type BudgetCategory = typeof budgetCategory.$inferSelect;

export const budgetCategory = pgTable(
  "budget_category",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budget.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    budgetIdIdx: index("budget_category_budget_id_idx").on(table.budgetId),
    categoryIdIdx: index("budget_category_category_id_idx").on(
      table.categoryId
    ),
    uniqueBudgetCategory: uniqueIndex("budget_category_unique_idx").on(
      table.budgetId,
      table.categoryId
    ),
  })
);
