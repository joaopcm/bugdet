import { createEnv } from '@t3-oss/env-nextjs'
import { vercel } from '@t3-oss/env-nextjs/presets-zod'
import { z } from 'zod'

export const env = createEnv({
  server: {
    AI_GATEWAY_API_KEY: z.string(),
    BACKOFFICE_API_KEY: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    DATA_ENCRYPTION_KEK: z.string().length(64),
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string(),
    RESEND_WAITLIST_SEGMENT_ID: z.string(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    SUPABASE_URL: z.string().url(),
    TRIGGER_SECRET_KEY: z.string(),
    UPLOAD_PASSWORD_ENCRYPTION_KEY: z.string().min(64),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production']),
  },
  runtimeEnv: {
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    BACKOFFICE_API_KEY: process.env.BACKOFFICE_API_KEY,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATA_ENCRYPTION_KEK: process.env.DATA_ENCRYPTION_KEK,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WAITLIST_SEGMENT_ID: process.env.RESEND_WAITLIST_SEGMENT_ID,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    UPLOAD_PASSWORD_ENCRYPTION_KEY: process.env.UPLOAD_PASSWORD_ENCRYPTION_KEY,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  },
  extends: [vercel()],
  emptyStringAsUndefined: true,
})
