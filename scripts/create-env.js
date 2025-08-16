#!/usr/bin/env node

/**
 * AWE Environment Setup - Basic Template Generator
 * 
 * Creates .env.local files with templates you can edit manually
 * No dependencies, no prompts, just generates the files
 */

const { writeFileSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')

function createEnvFiles() {
  console.log('🔧 Creating AWE environment files...\n')

  const timestamp = new Date().toISOString()

  // Root .env.local content
  const rootEnvContent = `# AWE Environment Configuration
# Generated on ${timestamp}
# Edit the values below with your actual credentials

# Environment
NODE_ENV="development"

# Database (update with your actual database URL)
DATABASE_URL="postgresql://localhost:5432/awe_dev"

# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_KEY="your-service-key-here"

# AWE Specific (copies of above for AWE CLI)
AWE_SUPABASE_URL="https://your-project-id.supabase.co"
AWE_SUPABASE_ANON_KEY="your-anon-key-here"
AWE_SUPABASE_SERVICE_KEY="your-service-key-here"

# Performance Settings
AWE_CACHE_SIZE="1000"
AWE_MAX_CONCURRENCY="10"
AWE_API_TIMEOUT="30000"
AWE_API_RETRIES="3"

# Feature Flags
AWE_FEATURES="aiAnalysis,templateGeneration,backgroundSync,vectorSearch"
AWE_OFFLINE_MODE="false"

# Privacy & Analytics
AWE_TELEMETRY_ENABLED="false"
AWE_CRASH_REPORTING="false"

# Development Settings
AWE_DEBUG="true"
AWE_LOG_LEVEL="debug"
`

  // Web app .env.local content
  const webEnvContent = `# AWE Web App Environment Configuration
# Generated on ${timestamp}
# Edit the values below with your actual credentials

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (update with your actual database URL)
DATABASE_URL="postgresql://localhost:5432/awe_dev"

# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_KEY="your-service-key-here"

# Public Environment Variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Analytics & Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS="false"
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES="true"

# Optional: Add these when you have them
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
`

  try {
    // Check if files exist
    const rootEnvPath = join(process.cwd(), '.env.local')
    const webEnvPath = join(process.cwd(), 'apps', 'web', '.env.local')

    if (existsSync(rootEnvPath)) {
      console.log('⚠️  .env.local already exists - creating .env.local.template instead')
      writeFileSync(join(process.cwd(), '.env.local.template'), rootEnvContent)
      console.log('✓ Created .env.local.template')
    } else {
      writeFileSync(rootEnvPath, rootEnvContent)
      console.log('✓ Created .env.local')
    }

    // Ensure apps/web directory exists
    const webDir = join(process.cwd(), 'apps', 'web')
    if (!existsSync(webDir)) {
      mkdirSync(webDir, { recursive: true })
      console.log('✓ Created apps/web directory')
    }

    if (existsSync(webEnvPath)) {
      console.log('⚠️  apps/web/.env.local already exists - creating apps/web/.env.local.template instead')
      writeFileSync(join(webDir, '.env.local.template'), webEnvContent)
      console.log('✓ Created apps/web/.env.local.template')
    } else {
      writeFileSync(webEnvPath, webEnvContent)
      console.log('✓ Created apps/web/.env.local')
    }

    console.log('\n🎉 Environment files created successfully!\n')
    
    console.log('📝 Next steps:')
    console.log('1. Edit the .env.local files with your actual Supabase credentials')
    console.log('2. Get Supabase credentials from: https://app.supabase.com/project/_/settings/api')
    console.log('3. Replace the placeholder values:')
    console.log('   - your-project-id.supabase.co → your actual Supabase URL')
    console.log('   - your-anon-key-here → your actual anonymous key')
    console.log('   - your-service-key-here → your actual service role key')
    console.log('4. Run: pnpm db:generate')
    console.log('5. Run: pnpm dev')
    console.log('6. Visit: http://localhost:3000\n')

    console.log('🔒 Security reminder:')
    console.log('• .env.local files are gitignored and safe from version control')
    console.log('• Never share your service role key publicly')
    console.log('• Use production environment variables in Vercel for deployment')

  } catch (error) {
    console.error('❌ Error creating environment files:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  createEnvFiles()
}

module.exports = { createEnvFiles }