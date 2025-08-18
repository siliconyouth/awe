#!/usr/bin/env node

/**
 * Backup Environment Files Script
 * 
 * Creates backups of existing .env.local files before running setup
 */

const { existsSync, copyFileSync, readFileSync } = require('fs')
const { join } = require('path')
const chalk = require('chalk')

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

const envFiles = [
  { path: '.env.local', name: 'root' },
  { path: 'apps/web/.env.local', name: 'web' },
  { path: 'packages/database/.env.local', name: 'database' }
]

console.log(chalk.cyan.bold('📦 Backing up environment files...\n'))

let backedUp = 0

for (const file of envFiles) {
  const sourcePath = join(process.cwd(), file.path)
  
  if (existsSync(sourcePath)) {
    const backupPath = `${sourcePath}.backup-${timestamp}`
    
    try {
      copyFileSync(sourcePath, backupPath)
      console.log(chalk.green(`✓ Backed up ${file.name}: ${file.path}`))
      console.log(chalk.gray(`  → ${backupPath}`))
      backedUp++
    } catch (error) {
      console.error(chalk.red(`✗ Failed to backup ${file.name}: ${error.message}`))
    }
  } else {
    console.log(chalk.yellow(`⊘ Skipped ${file.name}: file doesn't exist`))
  }
}

if (backedUp > 0) {
  console.log(chalk.green.bold(`\n✅ Backed up ${backedUp} file(s) successfully!`))
  console.log(chalk.cyan('\nYou can now safely run the setup script.'))
  console.log(chalk.gray('To restore a backup, rename it back to .env.local'))
} else {
  console.log(chalk.yellow('\n⚠️  No files to backup'))
}

// Also create a combined backup with all variables
if (backedUp > 0) {
  console.log(chalk.cyan('\n📄 Creating combined variables list...'))
  
  const allVars = {}
  
  for (const file of envFiles) {
    const sourcePath = join(process.cwd(), file.path)
    
    if (existsSync(sourcePath)) {
      try {
        const content = readFileSync(sourcePath, 'utf8')
        const lines = content.split('\n')
        
        console.log(chalk.gray(`\nFrom ${file.path}:`))
        
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const [key] = line.split('=')
            if (key) {
              const keyName = key.trim()
              if (!allVars[keyName]) {
                allVars[keyName] = file.name
                console.log(chalk.gray(`  • ${keyName}`))
              }
            }
          }
        }
      } catch (error) {
        console.error(chalk.red(`Failed to read ${file.path}`))
      }
    }
  }
  
  console.log(chalk.cyan(`\n📊 Total unique variables found: ${Object.keys(allVars).length}`))
}