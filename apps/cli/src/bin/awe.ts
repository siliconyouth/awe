/**
 * AWE CLI - TypeScript Entry Point
 * 
 * Modern TypeScript command-line interface for AWE (Awesome Workspace Engineering)
 * Provides AI-powered project analysis, optimization, and setup automation.
 */

import { Command } from 'commander'
import chalk from 'chalk'
import boxen from 'boxen'

import { initializeDatabase } from '@awe/database'
import { AWE_VERSION } from '@awe/shared'

import { AnalyzeCommand } from '../commands/analyze'
import { ConfigCommand } from '../commands/config'
import { InitCommand } from '../commands/init'
import { ScaffoldCommand } from '../commands/scaffold'
import { RecommendCommand } from '../commands/recommend'
import { SyncCommand } from '../commands/sync'

import { validateEnvironment } from '../utils/validation'
import { createLogger } from '../utils/logger'

const logger = createLogger('main')

async function main() {
  try {
    // Initialize CLI program
    const program = new Command()

    program
      .name('awe')
      .description('🤖 AWE - Intelligent Claude Code Companion')
      .version(AWE_VERSION, '-v, --version', 'display version number')
      .option('-q, --quiet', 'suppress output')
      .option('-d, --debug', 'enable debug logging')
      .hook('preAction', async (thisCommand) => {
        const options = thisCommand.opts()
        if (options.debug) {
          logger.level = 'debug'
        }
        if (options.quiet) {
          logger.level = 'error'
        }
      })

    // Validate environment
    const envValidation = await validateEnvironment()
    if (!envValidation.valid) {
      console.error(chalk.red('❌ Environment validation failed:'))
      envValidation.errors.forEach(error => {
        console.error(chalk.red(`  • ${error}`))
      })
      process.exit(1)
    }
    
    if (envValidation.warnings.length > 0) {
      envValidation.warnings.forEach(warning => {
        console.warn(chalk.yellow(`⚠️  ${warning}`))
      })
    }

    // Initialize database
    try {
      await initializeDatabase()
    } catch (error) {
      logger.warn('Database initialization failed, running in offline mode:', error)
    }

    // Add commands
    program.addCommand(new AnalyzeCommand().getCommand())
    program.addCommand(new ConfigCommand().getCommand())
    program.addCommand(new InitCommand().getCommand())
    program.addCommand(new ScaffoldCommand().getCommand())
    program.addCommand(new RecommendCommand().getCommand())
    program.addCommand(new SyncCommand().getCommand())

    // Default action for bare command
    program.action(() => {
      const welcomeMessage = chalk.cyan(`
🤖 AWE - Awesome Workspace Engineering v${AWE_VERSION}

Intelligent companion for Claude Code that provides:
• AI-powered project analysis and optimization
• Smart template recommendations and generation  
• Automated setup and configuration
• Context engineering best practices

${chalk.bold('Quick Start:')}
  ${chalk.green('awe config')}     Configure credentials and settings
  ${chalk.green('awe init')}       Initialize project with Claude.md
  ${chalk.green('awe analyze')}    Analyze current project
  ${chalk.green('awe recommend')}  Get AI-powered recommendations
  ${chalk.green('awe scaffold')}   Generate project skeleton

${chalk.bold('Learn More:')}
  ${chalk.green('awe --help')}     Show all available commands
  ${chalk.green('awe sync')}       Update knowledge base
      `)

      console.log(
        boxen(welcomeMessage, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan'
        })
      )
    })

    // Parse arguments
    await program.parseAsync(process.argv)

  } catch (error) {
    logger.error('AWE CLI Error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(chalk.red('\n❌ File or directory not found'))
        console.error(chalk.gray('Check that the path exists and you have permission to access it.'))
      } else if (error.message.includes('EACCES')) {
        console.error(chalk.red('\n❌ Permission denied'))
        console.error(chalk.gray('Check that you have the necessary permissions.'))
      } else if (error.message.includes('Database')) {
        console.error(chalk.red('\n❌ Database error'))
        console.error(chalk.gray('Try running with --debug for more information.'))
      } else {
        console.error(chalk.red('\n❌ An unexpected error occurred'))
        console.error(chalk.gray('Run with --debug for detailed error information.'))
      }
    }
    
    console.error(chalk.gray('\nFor help, run: awe --help'))
    console.error(chalk.gray('Report issues at: https://github.com/awe-team/claude-companion/issues'))
    
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason)
  console.error(chalk.red('\n❌ An unexpected error occurred (unhandled promise rejection)'))
  console.error(chalk.gray('This is likely a bug. Please report it.'))
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message)
  console.error(chalk.red('\n❌ A critical error occurred'))
  console.error(chalk.gray('The application must exit to prevent data corruption.'))
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Start the CLI
main()