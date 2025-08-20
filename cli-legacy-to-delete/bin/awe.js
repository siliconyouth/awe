#!/usr/bin/env node

/**
 * AWE CLI - Intelligent Claude Code Companion
 * 
 * Entry point for the AWE command-line interface.
 * Provides AI-powered project analysis, optimization, and setup automation.
 */

// Load environment variables securely with dotenvx
require('@dotenvx/dotenvx').config({ 
  quiet: true,
  convention: 'nextjs' // Support multiple environment files
});

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const { checkForUpdates } = require('../src/utils/updater');
const { initializeDatabase } = require('../src/core/database');
const { initializeConfig } = require('../src/core/config');
const { logger } = require('../src/utils/logger');
const { validateEnvironment } = require('../src/utils/validation');

const program = new Command();

// Import commands
const initCommand = require('../src/commands/init');
const analyzeCommand = require('../src/commands/analyze');
const scaffoldCommand = require('../src/commands/scaffold');
const recommendCommand = require('../src/commands/recommend');
const syncCommand = require('../src/commands/sync');
const optimizeCommand = require('../src/commands/optimize');
const learnCommand = require('../src/commands/learn');
const { scrapeCommand } = require('../src/commands/scrape');
const { configCommand } = require('../src/commands/config');

async function main() {
  try {
    // Validate environment
    const envValidation = await validateEnvironment();
    if (!envValidation.valid) {
      console.error(chalk.red('❌ Environment validation failed:'));
      envValidation.errors.forEach(error => {
        console.error(chalk.red(`  • ${error}`));
      });
      process.exit(1);
    }
    
    if (envValidation.warnings.length > 0) {
      envValidation.warnings.forEach(warning => {
        console.warn(chalk.yellow(`⚠️  ${warning}`));
      });
    }

    // Initialize secure configuration
    await initializeConfig();
    
    // Initialize database on first run
    await initializeDatabase();

    // Set up CLI program
    program
      .name('awe')
      .description('🤖 AWE - Intelligent Claude Code Companion')
      .version('0.1.0', '-v, --version', 'display version number')
      .option('-q, --quiet', 'suppress output')
      .option('-d, --debug', 'enable debug logging')
      .hook('preAction', async (thisCommand) => {
        const options = thisCommand.opts();
        if (options.debug) {
          logger.level = 'debug';
        }
        if (options.quiet) {
          logger.level = 'error';
        }
      });

    // Add commands
    program.addCommand(initCommand);
    program.addCommand(analyzeCommand);
    program.addCommand(scaffoldCommand);
    program.addCommand(recommendCommand);
    program.addCommand(syncCommand);
    program.addCommand(optimizeCommand);
    program.addCommand(learnCommand);
    program.addCommand(scrapeCommand);
    
    // Configuration command
    program
      .command('config')
      .description('🔧 Configure AWE settings and credentials')
      .option('--setup', 'interactive credential setup')
      .option('--status', 'show configuration status')
      .option('--validate', 'validate current configuration')
      .option('--reset', 'reset to default configuration')
      .action(configCommand);

    // Show welcome message for bare command
    program.action(() => {
      const welcomeMessage = chalk.cyan(`
🤖 AWE - Awesome Workspace Engineering

Intelligent companion for Claude Code that provides:
• AI-powered project analysis and optimization
• Smart template recommendations
• Automated setup and configuration
• Context engineering best practices

${chalk.bold('Quick Start:')}
  ${chalk.green('awe config')}    Configure credentials and settings
  ${chalk.green('awe init')}      Initialize new project with Claude.md
  ${chalk.green('awe analyze')}   Analyze current project for optimizations
  ${chalk.green('awe recommend')} Get AI-powered recommendations
  ${chalk.green('awe scaffold')}  Generate project skeleton

${chalk.bold('Learn More:')}
  ${chalk.green('awe --help')}    Show all available commands
  ${chalk.green('awe sync')}      Update knowledge base with latest patterns
  ${chalk.green('awe scrape')}    Intelligently gather Claude Code patterns
      `);

      console.log(
        boxen(welcomeMessage, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan'
        })
      );
    });

    // Check for updates in background
    setImmediate(async () => {
      try {
        await checkForUpdates();
      } catch (error) {
        logger.debug('Update check failed:', error.message);
      }
    });

    // Parse arguments
    await program.parseAsync(process.argv);

  } catch (error) {
    // Enhanced error handling
    logger.error('AWE CLI Error:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error(chalk.red('\n❌ File or directory not found'));
      console.error(chalk.gray('Check that the path exists and you have permission to access it.'));
    } else if (error.code === 'EACCES') {
      console.error(chalk.red('\n❌ Permission denied'));
      console.error(chalk.gray('Check that you have the necessary permissions.'));
    } else if (error.code === 'ENOTDIR') {
      console.error(chalk.red('\n❌ Path is not a directory'));
      console.error(chalk.gray('The specified path should point to a directory.'));
    } else if (error.message.includes('Database')) {
      console.error(chalk.red('\n❌ Database error'));
      console.error(chalk.gray('Try running with --debug for more information.'));
      console.error(chalk.gray('You may need to reset the database with: rm ~/.awe/awe.db'));
    } else {
      console.error(chalk.red('\n❌ An unexpected error occurred'));
      console.error(chalk.gray('Run with --debug for detailed error information.'));
    }
    
    if (program.opts && program.opts().debug) {
      console.error(chalk.gray('\nDebug Information:'));
      console.error(error.stack);
    }
    
    console.error(chalk.gray('\nFor help, run: awe --help'));
    console.error(chalk.gray('Report issues at: https://github.com/awe-team/claude-companion/issues'));
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  console.error(chalk.red('\n❌ An unexpected error occurred (unhandled promise rejection)'));
  console.error(chalk.gray('This is likely a bug. Please report it.'));
  
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    console.error(chalk.gray('\nDebug Information:'));
    console.error('Promise:', promise);
    console.error('Reason:', reason);
  }
  
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  console.error(chalk.red('\n❌ A critical error occurred'));
  console.error(chalk.gray('The application must exit to prevent data corruption.'));
  
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    console.error(chalk.gray('\nDebug Information:'));
    console.error(error.stack);
  }
  
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the CLI
main();