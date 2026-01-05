# Self-Hosting Bugdet

This guide covers how to deploy Bugdet on your own infrastructure.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [External Services](#external-services)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Trigger.dev Setup](#triggerdev-setup)
- [Production Checklist](#production-checklist)

## Overview

Bugdet is a Next.js application with background job processing. A complete deployment consists of:

1. **Next.js Application** - The main web application
2. **PostgreSQL Database** - Primary data storage
3. **Redis** - Caching and rate limiting (via Upstash)
4. **Trigger.dev** - Background job processing
5. **Supabase** - File storage for bank statements
6. **Resend** - Transactional emails

## Requirements

### Minimum Server Requirements

- **CPU**: 1 vCPU
- **RAM**: 1 GB
- **Storage**: 10 GB SSD
- **Node.js**: 22+

### Required External Services

You'll need accounts with the following services:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com/) | File storage | Yes |
| [Upstash](https://upstash.com/) | Redis (rate limiting) | Yes |
| [Resend](https://resend.com/) | Transactional emails | Yes (100/day) |
| [OpenAI](https://platform.openai.com/) | AI categorization | Pay-as-you-go |
| [Trigger.dev](https://trigger.dev/) | Background jobs | Yes |

## External Services

### Supabase Setup

1. Create a new Supabase project
2. Go to Storage and create a bucket named `bank-statements`
3. Set the bucket to private
4. Copy the following from Project Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Upstash Setup

1. Create a new Redis database at [Upstash Console](https://console.upstash.com/)
2. Copy the REST URL and token:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Resend Setup

1. Create an account at [Resend](https://resend.com/)
2. Verify your domain for sending emails
3. Create an API key:
   - `RESEND_API_KEY`
4. Create a segment for the waitlist (optional):
   - `RESEND_WAITLIST_SEGMENT_ID`

### OpenAI Setup

1. Create an account at [OpenAI Platform](https://platform.openai.com/)
2. Generate an API key:
   - `OPENAI_API_KEY`

### Trigger.dev Setup

1. Create an account at [Trigger.dev](https://trigger.dev/)
2. Create a new project
3. Get your secret key:
   - `TRIGGER_SECRET_KEY`

## Deployment Options

### Option 1: Vercel (Recommended)

The easiest way to deploy Bugdet is using Vercel:

1. **Fork the repository** to your GitHub account

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com/new)
   - Import your forked repository
   - Configure environment variables (see [Environment Configuration](#environment-configuration))

3. **Deploy Trigger.dev jobs**
   ```bash
   pnpm deploy:trigger:production
   ```

4. **Run database migrations**
   ```bash
   DATABASE_URL=your_production_url pnpm db:migrate
   ```

### Option 2: Docker

You can containerize the application for deployment:

1. **Build the Docker image**

   ```dockerfile
   # Dockerfile
   FROM node:22-alpine AS base

   # Install pnpm
   RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

   # Install dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN pnpm install --frozen-lockfile

   # Build the application
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN pnpm build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV=production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build and run**

   ```bash
   docker build -t bugdet .
   docker run -p 3000:3000 --env-file .env bugdet
   ```

### Option 3: VPS / Bare Metal

For manual deployment on a VPS:

1. **Clone and install**

   ```bash
   git clone https://github.com/joaopcm/bugdet.git
   cd bugdet
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Build the application**

   ```bash
   pnpm build
   ```

4. **Run with a process manager**

   Using PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "bugdet" -- start
   pm2 save
   pm2 startup
   ```

5. **Set up a reverse proxy** (Nginx example)

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable HTTPS** with Let's Encrypt

   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Environment Configuration

Create your production `.env` file with all required variables:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
UPLOAD_PASSWORD_ENCRYPTION_KEY=your-encryption-key-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/bugdet

# Authentication
BETTER_AUTH_SECRET=generate-a-secure-random-string
BETTER_AUTH_URL=https://yourdomain.com

# AI Services
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Resend
RESEND_API_KEY=re_...
RESEND_WAITLIST_SEGMENT_ID=...

# Trigger.dev
TRIGGER_SECRET_KEY=tr_...

# Admin
BACKOFFICE_API_KEY=generate-a-secure-api-key
```

### Generating Secrets

For `BETTER_AUTH_SECRET` and `BACKOFFICE_API_KEY`, generate secure random strings:

```bash
openssl rand -base64 32
```

## Database Setup

### Managed PostgreSQL (Recommended)

Use a managed PostgreSQL service:

- [Supabase](https://supabase.com/) - Free tier available
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Railway](https://railway.app/)
- [DigitalOcean](https://www.digitalocean.com/products/managed-databases-postgresql)

### Self-Hosted PostgreSQL

1. **Install PostgreSQL 16**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql-16
   ```

2. **Create database and user**

   ```sql
   CREATE USER bugdet WITH PASSWORD 'your-secure-password';
   CREATE DATABASE bugdet OWNER bugdet;
   ```

3. **Run migrations**

   ```bash
   DATABASE_URL=postgresql://bugdet:password@localhost:5432/bugdet pnpm db:migrate
   ```

## Trigger.dev Setup

Background jobs are essential for bank statement processing. Deploy them to Trigger.dev:

1. **Login to Trigger.dev CLI**

   ```bash
   npx trigger.dev@4.3.1 login
   ```

2. **Deploy to production**

   ```bash
   pnpm deploy:trigger:production
   ```

3. **Verify deployment**

   Check the Trigger.dev dashboard to confirm tasks are registered.

## Production Checklist

Before going live, verify:

### Security

- [ ] `BETTER_AUTH_SECRET` is a unique, secure value
- [ ] `BACKOFFICE_API_KEY` is set to a secure value
- [ ] HTTPS is enabled on your domain
- [ ] Database credentials are secure
- [ ] Environment variables are not exposed

### Configuration

- [ ] All environment variables are set
- [ ] `NEXT_PUBLIC_APP_URL` matches your domain
- [ ] `BETTER_AUTH_URL` matches your domain
- [ ] Email domain is verified in Resend
- [ ] Supabase storage bucket is configured

### Database

- [ ] Migrations have been run
- [ ] Database backups are configured
- [ ] Connection pooling is enabled (for serverless)

### Monitoring

- [ ] Error tracking is set up (e.g., Sentry)
- [ ] Logging is configured
- [ ] Uptime monitoring is in place

### Performance

- [ ] CDN is configured (Vercel provides this automatically)
- [ ] Database indexes are in place
- [ ] Caching is working via Upstash

## Troubleshooting

### Common Issues

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Check if database allows connections from your server IP
- Ensure SSL is configured if required

**Trigger.dev jobs not running**
- Verify `TRIGGER_SECRET_KEY` is correct
- Check Trigger.dev dashboard for errors
- Ensure jobs are deployed: `pnpm deploy:trigger:production`

**File uploads failing**
- Verify Supabase credentials
- Check bucket permissions
- Ensure `bank-statements` bucket exists

**Emails not sending**
- Verify Resend API key
- Check if domain is verified
- Review Resend dashboard for errors

## Support

For issues with self-hosting:

1. Check the [GitHub Issues](https://github.com/joaopcm/bugdet/issues)
2. Search for similar problems
3. Open a new issue if needed

---

Happy hosting!
