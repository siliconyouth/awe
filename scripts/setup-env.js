#!/usr/bin/env node

/**
 * AWE Environment Setup Script
 * 
 * Interactive script to configure all environment variables for AWE development.
 * Creates .env.local files with proper configuration for both web app and CLI.
 */

const inquirer = require('inquirer')
const chalk = require('chalk')
const { writeFileSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')

console.log(chalk.cyan.bold('🔧 AWE Environment Setup\n'))
console.log(chalk.gray('This script will help you configure environment variables for AWE development.\n'))

async function main() {
  try {
    // Check if .env.local already exists
    const envPath = join(process.cwd(), '.env.local')
    const webEnvPath = join(process.cwd(), 'apps', 'web', '.env.local')
    
    if (existsSync(envPath) || existsSync(webEnvPath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: '.env.local files already exist. Overwrite them?',
        default: false
      }])
      
      if (!overwrite) {
        console.log(chalk.yellow('Setup cancelled. Existing files preserved.'))
        return
      }
    }

    console.log(chalk.cyan('📋 Please provide the following information:\n'))

    // Gather configuration
    const config = await gatherConfiguration()
    
    // Generate environment files
    await generateEnvironmentFiles(config)
    
    console.log(chalk.green.bold('\n✅ Environment setup complete!\n'))
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.gray('  1. Run: pnpm db:generate'))
    console.log(chalk.gray('  2. Run: pnpm db:push (if using Supabase)'))
    console.log(chalk.gray('  3. Run: pnpm dev'))
    console.log(chalk.gray('  4. Visit: http://localhost:3000\n'))

  } catch (error) {
    console.error(chalk.red('Setup failed:'), error.message)
    process.exit(1)
  }
}

async function gatherConfiguration() {
  const questions = [
    {
      type: 'list',
      name: 'environment',
      message: 'Environment type:',
      choices: [
        { name: '🚀 Development (recommended)', value: 'development' },
        { name: '🧪 Testing', value: 'test' },
        { name: '🌍 Production', value: 'production' }
      ],
      default: 'development'
    },
    {
      type: 'confirm',
      name: 'useSupabase',
      message: 'Do you want to configure Supabase? (recommended for full features)',
      default: true
    }
  ]

  const basicConfig = await inquirer.prompt(questions)
  
  let supabaseConfig = {}
  if (basicConfig.useSupabase) {
    supabaseConfig = await gatherSupabaseConfig()
  }

  const advancedConfig = await gatherAdvancedConfig(basicConfig.environment)

  return {
    ...basicConfig,
    ...supabaseConfig,
    ...advancedConfig
  }
}

async function gatherSupabaseConfig() {
  console.log(chalk.yellow('\n🔗 Supabase Configuration'))
  console.log(chalk.gray('Get these from: https://app.supabase.com/project/_/settings/api\n'))

  const questions = [
    {
      type: 'input',
      name: 'supabaseUrl',
      message: 'Supabase Project URL:',
      validate: (input) => {
        if (!input) return 'URL is required'
        if (!input.startsWith('https://')) return 'URL must start with https://'
        if (!input.includes('supabase.co')) return 'Must be a valid Supabase URL'
        return true
      }
    },
    {
      type: 'password',
      name: 'supabaseAnonKey',
      message: 'Supabase Anonymous Key:',
      mask: '*',
      validate: (input) => {
        if (!input) return 'Anonymous key is required'
        if (input.length < 20) return 'Key appears to be too short'
        return true
      }
    },
    {
      type: 'confirm',
      name: 'hasServiceKey',
      message: 'Do you have a Service Role Key? (enables admin features)',
      default: true
    }
  ]

  const config = await inquirer.prompt(questions)

  if (config.hasServiceKey) {
    const { supabaseServiceKey } = await inquirer.prompt([{
      type: 'password',
      name: 'supabaseServiceKey',
      message: 'Supabase Service Role Key:',
      mask: '*',
      validate: (input) => {
        if (!input) return 'Service key is required'
        if (input.length < 20) return 'Key appears to be too short'
        return true
      }
    }])
    config.supabaseServiceKey = supabaseServiceKey
  }

  return config
}

async function gatherAdvancedConfig(environment) {
  console.log(chalk.yellow('\n⚙️  Advanced Configuration (optional)'))
  
  const questions = [
    {
      type: 'input',
      name: 'appUrl',
      message: 'Application URL:',
      default: environment === 'development' ? 'http://localhost:3000' : 'https://your-app.vercel.app'
    },
    {
      type: 'confirm',
      name: 'enableAnalytics',
      message: 'Enable analytics?',
      default: environment === 'production'
    },
    {
      type: 'confirm',
      name: 'enableExperimentalFeatures',
      message: 'Enable experimental features?',
      default: environment === 'development'
    }
  ]

  return await inquirer.prompt(questions)
}

async function generateEnvironmentFiles(config) {
  console.log(chalk.yellow('\n📝 Generating environment files...'))

  // Generate DATABASE_URL
  const databaseUrl = config.supabaseUrl 
    ? generateSupabaseDatabaseUrl(config.supabaseUrl, config.supabaseServiceKey)
    : 'postgresql://localhost:5432/awe_dev'

  // Root .env.local
  const rootEnvContent = generateRootEnvContent(config, databaseUrl)
  
  // Web app .env.local
  const webEnvContent = generateWebEnvContent(config, databaseUrl)

  // Write files
  writeFileSync(join(process.cwd(), '.env.local'), rootEnvContent)
  console.log(chalk.green('  ✓ Created .env.local'))

  // Ensure apps/web directory exists
  const webDir = join(process.cwd(), 'apps', 'web')
  if (!existsSync(webDir)) {
    mkdirSync(webDir, { recursive: true })
  }
  
  writeFileSync(join(webDir, '.env.local'), webEnvContent)
  console.log(chalk.green('  ✓ Created apps/web/.env.local'))

  // Security reminder
  console.log(chalk.yellow('\n🔒 Security Note:'))
  console.log(chalk.gray('  • .env.local files are gitignored for security'))
  console.log(chalk.gray('  • Never commit environment files to version control'))
  console.log(chalk.gray('  • Use Vercel dashboard for production environment variables'))
}

function generateSupabaseDatabaseUrl(supabaseUrl, serviceKey) {
  // Extract project ID from Supabase URL
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (projectId && serviceKey) {
    // This is a simplified example - in reality, you'd need the actual DB credentials
    return `postgresql://postgres.${projectId}:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
  }
  
  return 'postgresql://localhost:5432/awe_dev'
}

function generateRootEnvContent(config, databaseUrl) {
  return `# AWE Environment Configuration
# Generated by setup-env.js on ${new Date().toISOString()}

# Environment
NODE_ENV="${config.environment}"

# Database
DATABASE_URL="${databaseUrl}"

# Supabase${config.useSupabase ? '' : ' (disabled)'}
${config.supabaseUrl ? `SUPABASE_URL="${config.supabaseUrl}"` : '# SUPABASE_URL="https://your-project.supabase.co"'}
${config.supabaseAnonKey ? `SUPABASE_ANON_KEY="${config.supabaseAnonKey}"` : '# SUPABASE_ANON_KEY="your-anon-key"'}
${config.supabaseServiceKey ? `SUPABASE_SERVICE_KEY="${config.supabaseServiceKey}"` : '# SUPABASE_SERVICE_KEY="your-service-key"'}

# AWE Specific
AWE_SUPABASE_URL="${config.supabaseUrl || ''}"
AWE_SUPABASE_ANON_KEY="${config.supabaseAnonKey || ''}"
AWE_SUPABASE_SERVICE_KEY="${config.supabaseServiceKey || ''}"

# Performance
AWE_CACHE_SIZE="1000"
AWE_MAX_CONCURRENCY="10"
AWE_API_TIMEOUT="30000"
AWE_API_RETRIES="3"

# Features
AWE_FEATURES="aiAnalysis,templateGeneration,backgroundSync,vectorSearch"
AWE_OFFLINE_MODE="${!config.useSupabase}"

# Privacy
AWE_TELEMETRY_ENABLED="${config.enableAnalytics || false}"
AWE_CRASH_REPORTING="${config.enableAnalytics || false}"

# Development
AWE_DEBUG="${config.environment === 'development'}"
AWE_LOG_LEVEL="${config.environment === 'development' ? 'debug' : 'info'}"
`
}

function generateWebEnvContent(config, databaseUrl) {
  return `# AWE Web App Environment Configuration
# Generated by setup-env.js on ${new Date().toISOString()}

# Environment
NODE_ENV="${config.environment}"
NEXT_PUBLIC_APP_URL="${config.appUrl}"

# Database
DATABASE_URL="${databaseUrl}"

# Supabase
${config.supabaseUrl ? `SUPABASE_URL="${config.supabaseUrl}"` : '# SUPABASE_URL="https://your-project.supabase.co"'}
${config.supabaseAnonKey ? `SUPABASE_ANON_KEY="${config.supabaseAnonKey}"` : '# SUPABASE_ANON_KEY="your-anon-key"'}
${config.supabaseServiceKey ? `SUPABASE_SERVICE_KEY="${config.supabaseServiceKey}"` : '# SUPABASE_SERVICE_KEY="your-service-key"'}

# Public Environment Variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL="${config.supabaseUrl || ''}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${config.supabaseAnonKey || ''}"

# Analytics & Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS="${config.enableAnalytics || false}"
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES="${config.enableExperimentalFeatures || false}"

# Optional: Vercel Analytics (add your ID when available)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""

# Optional: Other monitoring services
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
`
}

// Add required dependencies check
async function checkDependencies() {
  try {
    require('inquirer')
    require('chalk')
  } catch (error) {
    console.error(chalk.red('Missing dependencies. Please run: pnpm install'))
    process.exit(1)
  }
}

if (require.main === module) {
  checkDependencies().then(() => main())
}

module.exports = { main }