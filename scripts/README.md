# AWE Scripts

This directory contains utility scripts for AWE development, including the fast environment loader and setup tools.

## 🚀 Quick Setup

### Option 1: Interactive Node.js Script (Recommended)

```bash
# Install dependencies first
pnpm install

# Run the interactive setup
node scripts/setup-env.js
```

**Features:**
- ✅ Interactive prompts with validation
- ✅ Password masking for sensitive keys
- ✅ Smart defaults based on environment
- ✅ Comprehensive error checking
- ✅ Creates both root and web app .env.local files

### Option 2: Shell Script (Quick)

```bash
# Make executable and run
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

**Features:**
- ✅ Fast setup without Node.js dependencies
- ✅ Works in any shell environment
- ✅ Color-coded output
- ✅ Creates both .env.local files

## 📋 What Gets Configured

Both scripts will configure:

### Core Environment Variables
- `NODE_ENV` - Environment type (development/test/production)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Application URL

### Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous/public key
- `SUPABASE_SERVICE_KEY` - Service role key (optional)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key

### AWE-Specific Settings
- `AWE_CACHE_SIZE` - Memory cache size (default: 1000)
- `AWE_MAX_CONCURRENCY` - Max concurrent requests (default: 10)
- `AWE_API_TIMEOUT` - API timeout in ms (default: 30000)
- `AWE_FEATURES` - Enabled features list
- `AWE_OFFLINE_MODE` - Offline mode flag
- `AWE_DEBUG` - Debug logging flag
- `AWE_LOG_LEVEL` - Logging level

### Analytics & Monitoring
- `NEXT_PUBLIC_ENABLE_ANALYTICS` - Analytics flag
- `NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES` - Experimental features
- `AWE_TELEMETRY_ENABLED` - Telemetry flag
- `AWE_CRASH_REPORTING` - Crash reporting flag

## 🔐 Security Notes

- ✅ All `.env.local` files are gitignored automatically
- ✅ Sensitive keys are masked during input
- ✅ Files have appropriate permissions set
- ⚠️ Never commit environment files to version control
- ⚠️ Use Vercel dashboard for production variables

## 🛠️ Manual Setup

If you prefer to set up manually, copy the example files:

```bash
cp .env.sample .env.local
cp .env.sample apps/web/.env.local
```

Then edit the files with your specific values.

## 📚 Environment Variable Reference

### Required for Full Functionality
```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### Optional but Recommended
```bash
SUPABASE_SERVICE_KEY="your-service-key"
DATABASE_URL="postgresql://connection-string"
```

### Development Only
```bash
NODE_ENV="development"
AWE_DEBUG="true"
AWE_LOG_LEVEL="debug"
```

### Production Only
```bash
NODE_ENV="production"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
AWE_TELEMETRY_ENABLED="true"
```

## 🚀 After Setup

Once environment variables are configured:

1. **Generate Prisma Client:**
   ```bash
   pnpm db:generate
   ```

2. **Push Database Schema (if using Supabase):**
   ```bash
   pnpm db:push
   ```

3. **Start Development Server:**
   ```bash
   pnpm dev
   ```

4. **Visit Application:**
   - Web App: http://localhost:3000
   - API: http://localhost:3000/api

## 🆘 Troubleshooting

### Missing Dependencies
```bash
# Install required packages
pnpm install
```

### Permission Issues
```bash
# Fix script permissions
chmod +x scripts/setup-env.sh
```

### Database Connection Issues
- Verify Supabase URL format: `https://project-id.supabase.co`
- Check that keys are correctly copied (no extra spaces)
- Ensure service key has proper permissions

### Environment Not Loading
- Restart development server after changing .env files
- Check file is named `.env.local` (not `.env.local.txt`)
- Verify file is in correct directory (root and/or apps/web)

---

💡 **Tip:** Use the Node.js script for the best experience with validation and error checking!