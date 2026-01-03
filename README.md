# Bugdet

**AI-powered personal finance tracker that automatically categorizes your bank transactions.**

Bugdet helps you understand your spending by importing bank statements and using AI to intelligently categorize transactions. Upload your PDF bank statements, and let the AI do the heavy lifting.

## Features

- **Bank Statement Processing** - Upload PDF bank statements for automatic parsing
- **AI-Powered Categorization** - Transactions are automatically categorized using OpenAI and Google AI
- **Custom Categories** - Create and manage your own spending categories
- **Categorization Rules** - Define rules to automatically categorize recurring merchants
- **Dashboard Analytics** - Visual insights into your spending patterns
- **Bulk Operations** - Select and manage multiple transactions at once
- **Two-Factor Authentication** - Secure your account with 2FA
- **Email Notifications** - Get notified when your uploads are processed

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and Turbopack
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **API**: [tRPC](https://trpc.io/) for end-to-end type-safe APIs
- **Authentication**: [better-auth](https://www.better-auth.com/) with email/password + 2FA
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) with OpenAI and Google Generative AI
- **Background Jobs**: [Trigger.dev](https://trigger.dev/) for async processing
- **Caching**: [Upstash Redis](https://upstash.com/) for rate limiting and caching
- **File Storage**: [Supabase](https://supabase.com/) for bank statement uploads
- **Email**: [Resend](https://resend.com/) with [React Email](https://react.email/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Linting**: [Biome](https://biomejs.dev/)

## Getting Started

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for local PostgreSQL and Redis)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/joaopcm/bugdet.git
   cd bugdet
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in the required environment variables (see [Environment Variables](#environment-variables)).

4. **Start the database**

   ```bash
   pnpm db:start
   ```

5. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

6. **Start the development server**

   ```bash
   pnpm dev
   ```

   This starts both Next.js (with Turbopack) and Trigger.dev dev server concurrently.

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js + Trigger.dev development servers |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm email` | Start React Email dev server |
| `pnpm db:start` | Start PostgreSQL + Redis via Docker |
| `pnpm db:stop` | Stop database containers |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm trigger:dev` | Start Trigger.dev local development |
| `pnpm deploy:trigger:staging` | Deploy background jobs to staging |
| `pnpm deploy:trigger:production` | Deploy background jobs to production |

## Environment Variables

Create a `.env` file based on `.env.example`. Here are the required variables:

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for authentication encryption |
| `BETTER_AUTH_URL` | Base URL for auth endpoints (e.g., `http://localhost:3000`) |
| `OPENAI_API_KEY` | OpenAI API key for AI categorization |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key |
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_WAITLIST_SEGMENT_ID` | Resend segment ID for waitlist |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TRIGGER_SECRET_KEY` | Trigger.dev secret key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `BACKOFFICE_API_KEY` | API key for admin operations |
| `NEXT_PUBLIC_APP_URL` | Public application URL |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public landing page
│   ├── (app)/
│   │   ├── (auth)/         # Authentication pages
│   │   └── (logged-in)/    # Protected dashboard pages
│   └── api/                # API routes (tRPC, auth)
├── server/                 # Backend logic
│   ├── routers/            # tRPC routers
│   └── trpc.ts             # tRPC configuration
├── db/
│   └── schema.ts           # Drizzle database schema
├── trigger/                # Background job definitions
│   ├── ai/                 # AI processing tasks
│   └── emails/             # Email sending tasks
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── emails/             # React Email templates
├── lib/                    # Shared utilities
│   ├── auth/               # Authentication config
│   └── rules/              # Categorization rule engine
└── hooks/                  # React hooks
```

## Self-Hosting

For detailed self-hosting instructions, see the [Self-Hosting Guide](docs/SELF_HOSTING.md).

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- How we use GitHub Issues to manage tasks
- Setting up your development environment
- Submitting pull requests
- Code style and conventions

## License

This project is open source. See the repository for license details.

## Links

- [Documentation](docs/)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Self-Hosting Guide](docs/SELF_HOSTING.md)
