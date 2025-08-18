# Environment Setup Guide

## 🚀 Quick Start

The project includes an interactive setup script that will help you configure all environment variables.

### Run the Setup Script

```bash
node scripts/setup-env.js
```

## 📋 What the Script Does

1. **Detects Existing Files**: Checks for existing `.env.local` files in:
   - `/` (root)
   - `/apps/web/`
   - `/packages/database/`

2. **Offers Options**:
   - **🔄 Merge**: Keep your existing values, add new variables
   - **📝 Overwrite**: Start fresh with all new values
   - **❌ Cancel**: Exit without changes

3. **Setup Types**:
   - **🚀 Quick Setup**: Essential variables only (Clerk + Database)
   - **⚙️ Full Setup**: Configure all features
   - **🎯 Custom Setup**: Choose specific features

## 📁 Files Created

The script creates three `.env.local` files:

```
awe/
├── .env.local                     # Root environment variables
├── apps/
│   └── web/
│       └── .env.local            # Web app specific
└── packages/
    └── database/
        └── .env.local            # Database package specific
```

## 🔑 Variables You'll Be Asked For

### Essential (Quick Setup):
- **Clerk Authentication**:
  - Publishable Key (`pk_test_...`)
  - Secret Key (`sk_test_...`)
  - Webhook Secret (`whsec_...`)
- **Database**:
  - Supabase URL
  - Supabase Anon Key
  - Supabase Service Key
  - PostgreSQL Database URL

### Additional (Full Setup):
- **Redis Cache**: Upstash credentials
- **AI Services**: Anthropic/OpenAI API keys
- **Web Scraping**: Browserless API
- **Cron Jobs**: Vercel cron secret
- **Application**: App URL

## 📝 Manual Setup Alternative

If you prefer to set up manually, copy `.env.sample` to `.env.local`:

```bash
cp .env.sample .env.local
```

Then edit the file with your values.

## 🔒 Important Notes

- `.env.local` files are gitignored for security
- Never commit these files to version control
- For production, add variables to Vercel Dashboard

## 🎯 Where to Get Credentials

| Service | Where to Get |
|---------|--------------|
| **Clerk** | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |
| **Supabase** | [app.supabase.com](https://app.supabase.com) → Settings → API |
| **Upstash** | [console.upstash.com](https://console.upstash.com) → Your Database → REST API |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| **Browserless** | [browserless.io](https://www.browserless.io) → Dashboard |

## ✅ Verification

After setup, verify your configuration:

```bash
# Check if environment files exist
ls -la .env.local
ls -la apps/web/.env.local
ls -la packages/database/.env.local

# Build the project
pnpm build

# Start development server
pnpm dev
```

## 🆘 Troubleshooting

### "Cannot find module 'inquirer'"
Run: `pnpm add -D -w inquirer chalk`

### Script exits immediately
The script requires an interactive terminal. Run it directly in your terminal, not through an automated script.

### Variables not loading
- Ensure `.env.local` is in the correct directory
- Restart your development server after changes
- Check that variable names match exactly (case-sensitive)

## 📚 More Information

- See `ENV_SETUP.md` for detailed variable descriptions
- See `.env.sample` for a complete template with all variables