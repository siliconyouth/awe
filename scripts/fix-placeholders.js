#!/usr/bin/env node

/**
 * Fix placeholder values in .env.local
 */

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const chalk = require('chalk')

console.log(chalk.cyan.bold('🔧 Fixing placeholder values in .env.local\n'))

const envPath = join(process.cwd(), '.env.local')

try {
  // Read current content
  let content = readFileSync(envPath, 'utf8')
  
  // Fix Clerk Publishable Key (found in the codebase)
  const actualClerkKey = 'pk_live_Y2xlcmsuYXdlLmR1a2VsaWMuY29tJA'
  content = content.replace(
    /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="?pk_test_your-clerk-publishable-key"?/,
    `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${actualClerkKey}"`
  )
  console.log(chalk.green('✓ Fixed NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'))
  
  // Generate CRON_SECRET if it's still a placeholder
  if (content.includes('your-random-cron-secret-string')) {
    const cronSecret = require('crypto').randomBytes(32).toString('base64')
    content = content.replace(
      /CRON_SECRET="?your-random-cron-secret-string"?/,
      `CRON_SECRET="${cronSecret}"`
    )
    console.log(chalk.green('✓ Generated CRON_SECRET'))
  }
  
  // Check for database password placeholder
  if (content.includes('[YOUR-PASSWORD]')) {
    console.log(chalk.yellow('\n⚠️  DATABASE_URL still needs your Supabase password'))
    console.log(chalk.gray('   Replace [YOUR-PASSWORD] with your actual database password'))
    console.log(chalk.gray('   Get it from: https://app.supabase.com → Settings → Database\n'))
  }
  
  // Write back
  writeFileSync(envPath, content)
  
  console.log(chalk.green.bold('\n✅ Placeholder fixes applied!\n'))
  
  // Show remaining issues
  console.log(chalk.yellow('📝 Remaining manual steps:\n'))
  console.log('1. Replace [YOUR-PASSWORD] in DATABASE_URL with your Supabase password')
  console.log('   → Go to: https://app.supabase.com')
  console.log('   → Settings → Database → Connection string')
  console.log('   → Copy the password or the entire connection string\n')
  
  console.log('2. Optional services (if needed):')
  console.log('   • OPENAI_API_KEY - Only if using OpenAI features')
  console.log('   • BROWSERLESS_API_KEY - Only if using web scraping features\n')
  
} catch (error) {
  console.error(chalk.red('Error:'), error.message)
  process.exit(1)
}