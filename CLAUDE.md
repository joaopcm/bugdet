# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                    # start next (turbopack) + trigger.dev concurrently
pnpm build                  # production build
pnpm lint                   # biome lint (next lint)
pnpm email                  # react-email dev server

# database
pnpm db:start               # docker compose up (postgres + redis)
pnpm db:stop                # docker compose down
pnpm db:generate            # drizzle-kit generate
pnpm db:migrate             # drizzle-kit migrate

# trigger.dev
pnpm trigger:dev            # local trigger dev
pnpm deploy:trigger:staging
pnpm deploy:trigger:production
```

## Architecture

Next.js 15 app with App Router. Route groups:
- `(marketing)` - public landing
- `(app)/(auth)` - sign-in, sign-up, forgot/reset password
- `(app)/(logged-in)` - dashboard, transactions, categories, uploads, settings

### Data Flow

```
Client <-> tRPC (src/server) <-> Drizzle ORM <-> PostgreSQL
                                      |
                                 src/db/schema.ts
```

- **tRPC**: `src/server/trpc.ts` defines context, procedures; routers in `src/server/routers/`
- **Auth**: better-auth with email/password + 2FA; config in `src/lib/auth/auth.ts`, client in `src/lib/auth/client.ts`
- **DB**: Drizzle + node-postgres; schema at `src/db/schema.ts`, migrations in `drizzle/`
- **Background jobs**: Trigger.dev tasks in `src/trigger/` (AI processing, emails)
- **Storage**: Supabase for file uploads
- **Rate limiting**: Upstash Redis

### Key Tables

- `user`, `session`, `account`, `verification`, `two_factor` - auth (better-auth managed)
- `upload` - bank statement uploads with status enum (queued/processing/completed/failed/cancelled)
- `transaction` - financial transactions with category, confidence score, metadata
- `category` - user-defined categories
- `merchant_category` - merchant-to-category mappings for AI categorization

### Environment

Type-safe env via `@t3-oss/env-nextjs` in `src/env.ts`. Required vars defined there.

### Conventions

- Path alias: `@/*` maps to `src/*`
- UI: shadcn/ui components in `src/components/ui/`
- Pre-commit: Biome check via lefthook (auto-fix on staged files)
- Formatting: spaces, single quotes, trailing commas, no semicolons
