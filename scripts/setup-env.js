#!/usr/bin/env node

/**
 * AWE Environment Setup Script
 * 
 * Interactive script to configure all environment variables for AWE development.
 * Creates .env.local files with proper configuration for web app, CLI, and database.
 */

const { default: inquirer } = require('inquirer')
const chalk = require('chalk')
const { writeFileSync, mkdirSync, existsSync, readFileSync } = require('fs')
const { join } = require('path')

console.log(chalk.cyan.bold('🔧 AWE Environment Setup v2.1.0\n'))
console.log(chalk.gray('This script will help you configure environment variables for AWE development.\n'))

async function main() {
  try {
    // Check existing files
    const envPaths = {
      root: join(process.cwd(), '.env.local'),
      web: join(process.cwd(), 'apps', 'web', '.env.local'),
      database: join(process.cwd(), 'packages', 'database', '.env.local')
    }
    
    const existingFiles = Object.entries(envPaths).filter(([_, path]) => existsSync(path))
    
    let mergeMode = false
    
    if (existingFiles.length > 0) {
      console.log(chalk.yellow('📁 Found existing .env.local files:'))
      existingFiles.forEach(([name, path]) => {
        console.log(chalk.gray(`  • ${name}: ${path}`))
      })
      
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔄 Merge with existing (keep non-empty values, update empty ones)', value: 'merge' },
          { name: '📝 Overwrite all (fresh setup)', value: 'overwrite' },
          { name: '❌ Cancel', value: 'cancel' }
        ],
        default: 'merge'
      }])
      
      if (action === 'cancel') {
        console.log(chalk.yellow('Setup cancelled. Existing files preserved.'))
        return
      }
      
      mergeMode = action === 'merge'
      
      if (mergeMode) {
        console.log(chalk.green('✓ Will merge with existing configuration (keeping non-empty values)'))
      }
    }

    console.log(chalk.cyan('\n📋 Please provide the following information:\n'))

    // Gather configuration
    const config = await gatherConfiguration(mergeMode, envPaths)
    
    // Generate environment files
    await generateEnvironmentFiles(config, mergeMode)
    
    console.log(chalk.green.bold('\n✅ Environment setup complete!\n'))
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.gray('  1. Review generated .env.local files'))
    console.log(chalk.gray('  2. Run: pnpm db:generate'))
    console.log(chalk.gray('  3. Run: pnpm db:push (if using Supabase)'))
    console.log(chalk.gray('  4. Run: pnpm dev'))
    console.log(chalk.gray('  5. Visit: http://localhost:3000\n'))
    
    console.log(chalk.yellow('📚 Documentation:'))
    console.log(chalk.gray('  • See ENV_SETUP.md for detailed variable descriptions'))
    console.log(chalk.gray('  • See .env.sample for all available options\n'))

  } catch (error) {
    console.error(chalk.red('Setup failed:'), error.message)
    process.exit(1)
  }
}

async function gatherConfiguration(mergeMode, envPaths) {
  const config = {}
  
  // If merging, load existing values first
  let existingValues = {}
  if (mergeMode && existsSync(envPaths.root)) {
    try {
      const content = readFileSync(envPaths.root, 'utf8')
      existingValues = parseEnvFile(content)
    } catch (error) {
      console.warn(chalk.yellow('Could not parse existing .env.local'))
    }
  }
  
  // Basic setup
  const { setupType } = await inquirer.prompt([{
    type: 'list',
    name: 'setupType',
    message: 'Setup type:',
    choices: [
      { name: '🚀 Quick Setup (essential variables only)', value: 'quick' },
      { name: '⚙️  Full Setup (all features)', value: 'full' },
      { name: '🎯 Custom Setup (choose what to configure)', value: 'custom' }
    ],
    default: mergeMode ? 'quick' : 'full'
  }])
  
  config.setupType = setupType
  
  // Environment
  const { environment } = await inquirer.prompt([{
    type: 'list',
    name: 'environment',
    message: 'Environment type:',
    choices: [
      { name: '💻 Development (local)', value: 'development' },
      { name: '🧪 Testing', value: 'test' },
      { name: '🌍 Production', value: 'production' }
    ],
    default: existingValues.NODE_ENV || 'development'
  }])
  
  config.environment = environment
  
  // Gather configurations based on setup type
  if (setupType === 'quick') {
    Object.assign(config, await gatherEssentialConfig(existingValues))
  } else if (setupType === 'full') {
    Object.assign(config, await gatherFullConfig(existingValues))
  } else {
    Object.assign(config, await gatherCustomConfig(existingValues))
  }
  
  return config
}

async function gatherEssentialConfig(existing = {}) {
  console.log(chalk.yellow('\n🔑 Essential Configuration'))
  
  const config = {}
  
  // Clerk Authentication
  console.log(chalk.cyan('\n1️⃣  Clerk Authentication'))
  console.log(chalk.gray('Get these from: https://dashboard.clerk.com\n'))
  
  // Show existing values if present
  if (existing.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && existing.CLERK_SECRET_KEY) {
    console.log(chalk.green('  ✓ Existing Clerk configuration found'))
    const { updateClerk } = await inquirer.prompt([{
      type: 'confirm',
      name: 'updateClerk',
      message: 'Update Clerk configuration?',
      default: false
    }])
    
    if (!updateClerk) {
      config.clerkPublishableKey = existing.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      config.clerkSecretKey = existing.CLERK_SECRET_KEY
      config.clerkWebhookSecret = existing.CLERK_WEBHOOK_SECRET
    }
  }
  
  if (!config.clerkPublishableKey) {
    const clerkConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'clerkPublishableKey',
        message: 'Clerk Publishable Key:',
        default: existing.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        validate: input => !input || input.startsWith('pk_') || 'Should start with pk_'
      },
      {
        type: 'password',
        name: 'clerkSecretKey',
        message: 'Clerk Secret Key:',
        mask: '*',
        default: existing.CLERK_SECRET_KEY,
        validate: input => !input || input.startsWith('sk_') || 'Should start with sk_'
      },
      {
        type: 'confirm',
        name: 'hasWebhookSecret',
        message: 'Do you have a Clerk Webhook Secret? (for user sync)',
        default: !!existing.CLERK_WEBHOOK_SECRET
      }
    ])
    
    if (clerkConfig.hasWebhookSecret) {
      const { clerkWebhookSecret } = await inquirer.prompt([{
        type: 'password',
        name: 'clerkWebhookSecret',
        message: 'Clerk Webhook Secret:',
        mask: '*',
        default: existing.CLERK_WEBHOOK_SECRET,
        validate: input => !input || input.startsWith('whsec_') || 'Should start with whsec_'
      }])
      clerkConfig.clerkWebhookSecret = clerkWebhookSecret
    }
    
    Object.assign(config, clerkConfig)
  }
  
  // Database
  console.log(chalk.cyan('\n2️⃣  Database Configuration'))
  console.log(chalk.gray('Get these from: https://app.supabase.com\n'))
  
  // Show existing values if present
  if (existing.DATABASE_URL && existing.NEXT_PUBLIC_SUPABASE_URL) {
    console.log(chalk.green('  ✓ Existing Database configuration found'))
    const { updateDb } = await inquirer.prompt([{
      type: 'confirm',
      name: 'updateDb',
      message: 'Update Database configuration?',
      default: false
    }])
    
    if (!updateDb) {
      config.databaseUrl = existing.DATABASE_URL
      config.supabaseUrl = existing.NEXT_PUBLIC_SUPABASE_URL
      config.supabaseAnonKey = existing.NEXT_PUBLIC_SUPABASE_ANON_KEY
      config.supabaseServiceKey = existing.SUPABASE_SERVICE_ROLE_KEY
    }
  }
  
  if (!config.databaseUrl) {
    const dbConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'Supabase Project URL:',
        default: existing.NEXT_PUBLIC_SUPABASE_URL,
        validate: input => !input || input.includes('supabase.co') || 'Must be a valid Supabase URL'
      },
      {
        type: 'password',
        name: 'supabaseAnonKey',
        message: 'Supabase Anonymous Key:',
        mask: '*',
        default: existing.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        validate: input => !input || input.length > 20 || 'Key appears too short'
      },
      {
        type: 'password',
        name: 'supabaseServiceKey',
        message: 'Supabase Service Role Key:',
        mask: '*',
        default: existing.SUPABASE_SERVICE_ROLE_KEY,
        validate: input => !input || input.length > 20 || 'Key appears too short'
      },
      {
        type: 'input',
        name: 'databaseUrl',
        message: 'Database URL (PostgreSQL):',
        default: existing.DATABASE_URL || (answers => `postgresql://postgres:[YOUR-PASSWORD]@db.${answers.supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1]}.supabase.co:5432/postgres`),
        validate: input => !input || input.startsWith('postgresql://') || 'Must be a PostgreSQL URL'
      }
    ])
    
    Object.assign(config, dbConfig)
  }
  
  return config
}

async function gatherFullConfig(existing = {}) {
  // Start with essential config
  const config = await gatherEssentialConfig(existing)
  
  console.log(chalk.yellow('\n🔧 Additional Services'))
  
  // Redis/Upstash
  const hasExistingRedis = existing.UPSTASH_REDIS_REST_URL && existing.UPSTASH_REDIS_REST_TOKEN
  
  if (hasExistingRedis) {
    console.log(chalk.green('  ✓ Existing Redis configuration found'))
    const { updateRedis } = await inquirer.prompt([{
      type: 'confirm',
      name: 'updateRedis',
      message: 'Update Redis configuration?',
      default: false
    }])
    
    if (!updateRedis) {
      config.upstashRedisUrl = existing.UPSTASH_REDIS_REST_URL
      config.upstashRedisToken = existing.UPSTASH_REDIS_REST_TOKEN
    }
  }
  
  if (!config.upstashRedisUrl) {
    const { useRedis } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useRedis',
      message: 'Configure Upstash Redis? (for rate limiting & caching)',
      default: true
    }])
    
    if (useRedis) {
      console.log(chalk.gray('Get these from: https://console.upstash.com\n'))
      const redisConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'upstashRedisUrl',
          message: 'Upstash Redis REST URL:',
          default: existing.UPSTASH_REDIS_REST_URL,
          validate: input => !input || input.includes('upstash.io') || 'Must be a valid Upstash URL'
        },
        {
          type: 'password',
          name: 'upstashRedisToken',
          message: 'Upstash Redis REST Token:',
          mask: '*',
          default: existing.UPSTASH_REDIS_REST_TOKEN
        }
      ])
      Object.assign(config, redisConfig)
    }
  }
  
  // AI Services
  const hasExistingAI = existing.ANTHROPIC_API_KEY || existing.OPENAI_API_KEY
  
  if (hasExistingAI) {
    console.log(chalk.green('  ✓ Existing AI configuration found'))
    const { updateAI } = await inquirer.prompt([{
      type: 'confirm',
      name: 'updateAI',
      message: 'Update AI configuration?',
      default: false
    }])
    
    if (!updateAI) {
      config.anthropicApiKey = existing.ANTHROPIC_API_KEY
      config.openaiApiKey = existing.OPENAI_API_KEY
    }
  }
  
  if (!config.anthropicApiKey && !config.openaiApiKey) {
    const { useAI } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useAI',
      message: 'Configure AI services?',
      default: true
    }])
    
    if (useAI) {
      const aiConfig = await inquirer.prompt([
        {
          type: 'password',
          name: 'anthropicApiKey',
          message: 'Anthropic API Key (for Claude):',
          mask: '*',
          default: existing.ANTHROPIC_API_KEY,
          validate: input => !input || input.startsWith('sk-ant-') || 'Should start with sk-ant- (or leave empty)'
        },
        {
          type: 'password',
          name: 'openaiApiKey',
          message: 'OpenAI API Key (optional, press enter to skip):',
          mask: '*',
          default: existing.OPENAI_API_KEY,
          validate: input => !input || input.startsWith('sk-') || 'Should start with sk- (or leave empty)'
        }
      ])
      Object.assign(config, aiConfig)
    }
  }
  
  // Cron Jobs
  if (!existing.CRON_SECRET) {
    const { useCron } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useCron',
      message: 'Configure Vercel Cron jobs?',
      default: true
    }])
    
    if (useCron) {
      const { cronSecret } = await inquirer.prompt([{
        type: 'input',
        name: 'cronSecret',
        message: 'Cron Secret (or press enter to generate):',
        default: () => require('crypto').randomBytes(32).toString('base64')
      }])
      config.cronSecret = cronSecret
    }
  } else {
    config.cronSecret = existing.CRON_SECRET
  }
  
  // Application URL
  const { appUrl } = await inquirer.prompt([{
    type: 'input',
    name: 'appUrl',
    message: 'Application URL:',
    default: existing.NEXT_PUBLIC_APP_URL || (config.environment === 'development' ? 'http://localhost:3000' : 'https://your-app.vercel.app')
  }])
  config.appUrl = appUrl
  
  return config
}

async function gatherCustomConfig(existing = {}) {
  const config = {}
  
  const { features } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'features',
    message: 'Select features to configure:',
    choices: [
      { name: '🔐 Clerk Authentication', value: 'clerk', checked: !existing.CLERK_SECRET_KEY },
      { name: '💾 Database (Supabase)', value: 'database', checked: !existing.DATABASE_URL },
      { name: '📊 Redis Cache (Upstash)', value: 'redis' },
      { name: '🤖 AI Services', value: 'ai' },
      { name: '🕷️ Web Scraping', value: 'scraping' },
      { name: '⏰ Cron Jobs', value: 'cron' },
      { name: '📈 Analytics', value: 'analytics' }
    ]
  }])
  
  // Configure selected features
  for (const feature of features) {
    console.log(chalk.cyan(`\nConfiguring ${feature}...`))
    
    switch (feature) {
      case 'clerk':
        Object.assign(config, await gatherClerkConfig(existing))
        break
      case 'database':
        Object.assign(config, await gatherDatabaseConfig(existing))
        break
      case 'redis':
        Object.assign(config, await gatherRedisConfig(existing))
        break
      case 'ai':
        Object.assign(config, await gatherAIConfig(existing))
        break
      case 'scraping':
        Object.assign(config, await gatherScrapingConfig(existing))
        break
      case 'cron':
        Object.assign(config, await gatherCronConfig(existing))
        break
      case 'analytics':
        Object.assign(config, await gatherAnalyticsConfig(existing))
        break
    }
  }
  
  return config
}

// Individual config gatherers
async function gatherClerkConfig(existing = {}) {
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'clerkPublishableKey',
      message: 'Clerk Publishable Key:',
      default: existing.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      validate: input => !input || input.startsWith('pk_') || 'Should start with pk_'
    },
    {
      type: 'password',
      name: 'clerkSecretKey',
      message: 'Clerk Secret Key:',
      mask: '*',
      default: existing.CLERK_SECRET_KEY,
      validate: input => !input || input.startsWith('sk_') || 'Should start with sk_'
    },
    {
      type: 'password',
      name: 'clerkWebhookSecret',
      message: 'Clerk Webhook Secret (optional):',
      mask: '*',
      default: existing.CLERK_WEBHOOK_SECRET,
      validate: input => !input || input.startsWith('whsec_') || 'Should start with whsec_'
    }
  ])
  return config
}

async function gatherDatabaseConfig(existing = {}) {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'databaseUrl',
      message: 'Database URL:',
      default: existing.DATABASE_URL,
      validate: input => !input || input.startsWith('postgresql://') || 'Must be a PostgreSQL URL'
    },
    {
      type: 'input',
      name: 'supabaseUrl',
      message: 'Supabase URL (optional):',
      default: existing.NEXT_PUBLIC_SUPABASE_URL,
      validate: input => !input || input.includes('supabase.co') || 'Must be a valid Supabase URL'
    },
    {
      type: 'password',
      name: 'supabaseAnonKey',
      message: 'Supabase Anon Key (optional):',
      mask: '*',
      default: existing.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    {
      type: 'password',
      name: 'supabaseServiceKey',
      message: 'Supabase Service Key (optional):',
      mask: '*',
      default: existing.SUPABASE_SERVICE_ROLE_KEY
    }
  ])
}

async function gatherRedisConfig(existing = {}) {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'upstashRedisUrl',
      message: 'Upstash Redis URL:',
      default: existing.UPSTASH_REDIS_REST_URL,
      validate: input => !input || input.includes('upstash.io') || 'Must be a valid Upstash URL'
    },
    {
      type: 'password',
      name: 'upstashRedisToken',
      message: 'Upstash Redis Token:',
      mask: '*',
      default: existing.UPSTASH_REDIS_REST_TOKEN
    }
  ])
}

async function gatherAIConfig(existing = {}) {
  return await inquirer.prompt([
    {
      type: 'password',
      name: 'anthropicApiKey',
      message: 'Anthropic API Key:',
      mask: '*',
      default: existing.ANTHROPIC_API_KEY
    },
    {
      type: 'password',
      name: 'openaiApiKey',
      message: 'OpenAI API Key (optional):',
      mask: '*',
      default: existing.OPENAI_API_KEY
    }
  ])
}

async function gatherScrapingConfig(existing = {}) {
  return await inquirer.prompt([
    {
      type: 'password',
      name: 'browserlessApiKey',
      message: 'Browserless API Key:',
      mask: '*',
      default: existing.BROWSERLESS_API_KEY
    },
    {
      type: 'input',
      name: 'browserlessUrl',
      message: 'Browserless URL:',
      default: existing.BROWSERLESS_URL || 'https://chrome.browserless.io'
    }
  ])
}

async function gatherCronConfig(existing = {}) {
  return await inquirer.prompt([{
    type: 'input',
    name: 'cronSecret',
    message: 'Cron Secret:',
    default: existing.CRON_SECRET || (() => require('crypto').randomBytes(32).toString('base64'))
  }])
}

async function gatherAnalyticsConfig(existing = {}) {
  return await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableAnalytics',
      message: 'Enable analytics?',
      default: true
    },
    {
      type: 'input',
      name: 'vercelAnalyticsId',
      message: 'Vercel Analytics ID (optional):',
      default: existing.NEXT_PUBLIC_VERCEL_ANALYTICS_ID
    }
  ])
}

async function generateEnvironmentFiles(config, mergeMode) {
  console.log(chalk.yellow('\n📝 Generating environment files...'))

  const envPaths = {
    root: join(process.cwd(), '.env.local'),
    web: join(process.cwd(), 'apps', 'web', '.env.local'),
    database: join(process.cwd(), 'packages', 'database', '.env.local')
  }
  
  // Load existing configs if merging
  const existing = {}
  if (mergeMode) {
    for (const [name, path] of Object.entries(envPaths)) {
      if (existsSync(path)) {
        try {
          const content = readFileSync(path, 'utf8')
          existing[name] = parseEnvFile(content)
        } catch (error) {
          console.warn(chalk.yellow(`  ⚠️  Could not parse existing ${name} .env.local`))
        }
      }
    }
  }

  // Generate root .env.local
  const rootEnvContent = generateRootEnvContent(config, existing.root || {})
  writeFileSync(envPaths.root, rootEnvContent)
  console.log(chalk.green('  ✓ Created .env.local'))

  // Generate apps/web/.env.local
  const webDir = join(process.cwd(), 'apps', 'web')
  if (!existsSync(webDir)) {
    mkdirSync(webDir, { recursive: true })
  }
  
  const webEnvContent = generateWebEnvContent(config, existing.web || {})
  writeFileSync(envPaths.web, webEnvContent)
  console.log(chalk.green('  ✓ Created apps/web/.env.local'))

  // Generate packages/database/.env.local
  const dbDir = join(process.cwd(), 'packages', 'database')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
  const dbEnvContent = generateDatabaseEnvContent(config, existing.database || {})
  writeFileSync(envPaths.database, dbEnvContent)
  console.log(chalk.green('  ✓ Created packages/database/.env.local'))

  // Security reminder
  console.log(chalk.yellow('\n🔒 Security Notes:'))
  console.log(chalk.gray('  • .env.local files are gitignored for security'))
  console.log(chalk.gray('  • Never commit environment files to version control'))
  console.log(chalk.gray('  • Use Vercel dashboard for production environment variables'))
}

function parseEnvFile(content) {
  const env = {}
  const lines = content.split('\n')
  
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        env[key.trim()] = value
      }
    }
  }
  
  return env
}

function generateRootEnvContent(config, existing) {
  // Build new values from config
  const newVars = {
    // Environment
    NODE_ENV: config.environment || existing.NODE_ENV || 'development',
    
    // Clerk Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: config.clerkPublishableKey || existing.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    CLERK_SECRET_KEY: config.clerkSecretKey || existing.CLERK_SECRET_KEY || '',
    CLERK_WEBHOOK_SECRET: config.clerkWebhookSecret || existing.CLERK_WEBHOOK_SECRET || '',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: existing.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: existing.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: existing.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: existing.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
    
    // Database
    DATABASE_URL: config.databaseUrl || existing.DATABASE_URL || '',
    DATABASE_DIRECT_URL: config.databaseUrl || existing.DATABASE_DIRECT_URL || existing.DATABASE_URL || '',
    
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl || existing.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: config.supabaseAnonKey || existing.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: config.supabaseServiceKey || existing.SUPABASE_SERVICE_ROLE_KEY || '',
    
    // Redis
    UPSTASH_REDIS_REST_URL: config.upstashRedisUrl || existing.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: config.upstashRedisToken || existing.UPSTASH_REDIS_REST_TOKEN || '',
    
    // AI Services
    ANTHROPIC_API_KEY: config.anthropicApiKey || existing.ANTHROPIC_API_KEY || '',
    OPENAI_API_KEY: config.openaiApiKey || existing.OPENAI_API_KEY || '',
    
    // Web Scraping
    BROWSERLESS_API_KEY: config.browserlessApiKey || existing.BROWSERLESS_API_KEY || '',
    BROWSERLESS_URL: config.browserlessUrl || existing.BROWSERLESS_URL || '',
    
    // Cron
    CRON_SECRET: config.cronSecret || existing.CRON_SECRET || '',
    
    // Application
    NEXT_PUBLIC_APP_URL: config.appUrl || existing.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    
    // AWE Specific (legacy compatibility)
    AWE_SUPABASE_URL: config.supabaseUrl || existing.AWE_SUPABASE_URL || existing.NEXT_PUBLIC_SUPABASE_URL || '',
    AWE_SUPABASE_ANON_KEY: config.supabaseAnonKey || existing.AWE_SUPABASE_ANON_KEY || existing.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    AWE_SUPABASE_SERVICE_KEY: config.supabaseServiceKey || existing.AWE_SUPABASE_SERVICE_KEY || existing.SUPABASE_SERVICE_ROLE_KEY || ''
  }
  
  // Include any existing variables not in our list
  const allVars = { ...existing, ...newVars }

  let content = `# AWE Environment Configuration
# Generated by setup-env.js on ${new Date().toISOString()}
# ============================================

`

  // Group variables by category
  const categories = {
    'Environment': ['NODE_ENV'],
    'Clerk Authentication': [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'CLERK_WEBHOOK_SECRET',
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL'
    ],
    'Database': ['DATABASE_URL', 'DATABASE_DIRECT_URL'],
    'Supabase': [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ],
    'Redis Cache': ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    'AI Services': ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    'Web Scraping': ['BROWSERLESS_API_KEY', 'BROWSERLESS_URL'],
    'Monitoring': ['CRON_SECRET'],
    'Application': ['NEXT_PUBLIC_APP_URL'],
    'AWE Legacy': ['AWE_SUPABASE_URL', 'AWE_SUPABASE_ANON_KEY', 'AWE_SUPABASE_SERVICE_KEY']
  }

  // Track which variables we've already written
  const writtenKeys = new Set()

  // Write categorized variables
  for (const [category, keys] of Object.entries(categories)) {
    content += `# ${category}\n`
    for (const key of keys) {
      writtenKeys.add(key)
      const value = allVars[key]
      if (value !== undefined && value !== '') {
        content += `${key}="${value}"\n`
      } else {
        content += `# ${key}=""\n`
      }
    }
    content += '\n'
  }

  // Write any custom/additional variables that weren't in our categories
  const customVars = Object.keys(allVars).filter(key => !writtenKeys.has(key))
  if (customVars.length > 0) {
    content += '# Custom/Additional Variables\n'
    for (const key of customVars) {
      const value = allVars[key]
      if (value !== undefined && value !== '') {
        content += `${key}="${value}"\n`
      }
    }
    content += '\n'
  }

  return content
}

function generateWebEnvContent(config, existing) {
  // Web app uses the same variables as root
  return generateRootEnvContent(config, existing)
}

function generateDatabaseEnvContent(config, existing) {
  const allVars = {
    DATABASE_URL: config.databaseUrl || existing.DATABASE_URL || '',
    DATABASE_DIRECT_URL: config.databaseUrl || existing.DATABASE_DIRECT_URL || existing.DATABASE_URL || '',
    SUPABASE_URL: config.supabaseUrl || existing.SUPABASE_URL || existing.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: config.supabaseAnonKey || existing.SUPABASE_ANON_KEY || existing.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_KEY: config.supabaseServiceKey || existing.SUPABASE_SERVICE_KEY || existing.SUPABASE_SERVICE_ROLE_KEY || '',
    ...existing // Include any other existing variables
  }

  let content = `# Database Package Environment Configuration
# Generated by setup-env.js on ${new Date().toISOString()}
# ============================================

`

  for (const [key, value] of Object.entries(allVars)) {
    if (value !== undefined && value !== '') {
      content += `${key}="${value}"\n`
    } else if (key.startsWith('DATABASE_') || key.startsWith('SUPABASE_')) {
      content += `# ${key}=""\n`
    }
  }

  return content
}

// Check dependencies
async function checkDependencies() {
  try {
    require('inquirer')
    require('chalk')
  } catch (error) {
    console.error('Missing dependencies. Please run: pnpm add -D -w inquirer chalk')
    process.exit(1)
  }
}

if (require.main === module) {
  checkDependencies().then(() => main())
}

module.exports = { main }