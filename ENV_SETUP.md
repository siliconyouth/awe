# Environment Variables Setup Guide

## Overview
AWE requires environment variables to be configured for authentication, database, caching, and external services. This guide explains where to place these variables and how to obtain them.

## File Locations

### 1. **For Local Development**
Create `.env.local` file in the root directory:
```
/Users/vladimir/projects/awe/.env.local
```

### 2. **For Vercel Deployment**
Add these variables in Vercel Dashboard:
- Go to your project → Settings → Environment Variables
- Add each variable for Production, Preview, and Development environments

## Required Environment Variables

### 🔐 **Clerk Authentication (REQUIRED)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public key for Clerk | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Secret key for Clerk | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret | [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks → Your endpoint → Signing Secret |

**Clerk URL Configuration:**
```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 💾 **Database (REQUIRED)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | [Supabase](https://app.supabase.com) → Settings → Database → Connection string |
| `DATABASE_DIRECT_URL` | Direct connection for migrations | Same as above, but use the direct connection URL |

### 🗄️ **Supabase (REQUIRED)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase](https://app.supabase.com) → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous/Public key | [Supabase](https://app.supabase.com) → Settings → API → Project anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) | [Supabase](https://app.supabase.com) → Settings → API → Service role key |

### 📊 **Redis Cache (RECOMMENDED)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `UPSTASH_REDIS_REST_URL` | Redis REST API URL | [Upstash Console](https://console.upstash.com) → Your database → REST API → URL |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | [Upstash Console](https://console.upstash.com) → Your database → REST API → Token |

### 🤖 **AI Services (REQUIRED for AI features)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | Claude API key | [Anthropic Console](https://console.anthropic.com) → API Keys |
| `OPENAI_API_KEY` | OpenAI API key (optional) | [OpenAI Platform](https://platform.openai.com/api-keys) |

### 🕷️ **Web Scraping (OPTIONAL)**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `BROWSERLESS_API_KEY` | Browserless API key | [Browserless.io](https://www.browserless.io) → Dashboard |
| `BROWSERLESS_URL` | Browserless endpoint | Default: `https://chrome.browserless.io` |

### ⏰ **Cron Jobs (REQUIRED for scheduled tasks)**

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `CRON_SECRET` | Secret for Vercel Cron authentication | Generate a random string (e.g., `openssl rand -base64 32`) |

### 🔗 **Application Config**

| Variable | Description | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_APP_URL` | Your application URL | `https://your-domain.com` (production) or `http://localhost:3000` (dev) |
| `NODE_ENV` | Environment mode | `production`, `development`, or `test` |

## Setup Instructions

### Step 1: Create Local Environment File

1. Copy the sample file:
```bash
cp .env.sample .env.local
```

2. Fill in your values in `.env.local`

### Step 2: Set Up Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to Webhooks
3. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `organization.member.created`
   - `organization.member.updated`
5. Copy the Signing Secret to `CLERK_WEBHOOK_SECRET`

### Step 3: Configure Vercel Environment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable from your `.env.local`
4. Make sure to set them for all environments (Production, Preview, Development)

### Step 4: Set Up Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/monitor/cron/hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/monitor/cron/daily",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/monitor/cron/weekly",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

## Verification Checklist

✅ **Essential Services:**
- [ ] Clerk authentication is working (can sign in/out)
- [ ] Database connection successful
- [ ] Webhooks receiving events

✅ **Optional but Recommended:**
- [ ] Redis caching enabled (faster performance)
- [ ] AI services configured (for AI features)
- [ ] Cron jobs running (for scheduled monitoring)

## Common Issues

### Issue: "CLERK_WEBHOOK_SECRET not set - webhooks will not work"
**Solution:** This warning appears during build but won't affect runtime if the variable is set in production.

### Issue: Database connection fails
**Solution:** Ensure your IP is whitelisted in Supabase (Settings → Database → Connection Pooling)

### Issue: Rate limiting not working
**Solution:** Upstash Redis credentials are optional but recommended. The app will work without them but won't have rate limiting.

## Security Notes

⚠️ **Never commit `.env.local` to git!** It's already in `.gitignore`

⚠️ **Keep these secrets secure:**
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`

⚠️ **Public variables (starting with `NEXT_PUBLIC_`) are visible in the browser**

## Support

For issues with specific services:
- **Clerk:** [Clerk Support](https://clerk.com/support)
- **Supabase:** [Supabase Support](https://supabase.com/support)
- **Upstash:** [Upstash Discord](https://upstash.com/discord)
- **Vercel:** [Vercel Support](https://vercel.com/support)