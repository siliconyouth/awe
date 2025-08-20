#!/usr/bin/env node

/**
 * Test version of AWE CLI that uses mock database
 */

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');

// Use mock database instead of real one
const mockDbPath = require.resolve('../src/core/database.mock.js');
const realDbPath = require.resolve('../src/core/database.js');
require.cache[realDbPath] = require.cache[mockDbPath];

const { initializeDatabase } = require('../src/core/database.mock');
const { validateEnvironment } = require('../src/utils/validation');

const program = new Command();

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

    // Initialize mock database
    await initializeDatabase();

    // Set up CLI program
    program
      .name('awe')
      .description('🤖 AWE - Intelligent Claude Code Companion (Test Mode)')
      .version('0.1.0-test', '-v, --version', 'display version number')
      .option('-q, --quiet', 'suppress output')
      .option('-d, --debug', 'enable debug logging');

    // Simple commands for testing
    program
      .command('scaffold')
      .description('Generate project scaffold from patterns')
      .argument('[pattern]', 'scaffold pattern to use')
      .option('--dry-run', 'preview what would be created')
      .action(async (pattern, options) => {
        if (options.dryRun) {
          console.log(chalk.yellow('🔍 DRY RUN - Preview of files that would be created:\n'));
          console.log(`Pattern: ${chalk.cyan(pattern || 'web-react')}`);
          console.log(chalk.bold('Files to create:'));
          console.log(`  ${chalk.green('+')} CLAUDE.md`);
          console.log(`  ${chalk.green('+')} README.md`);
          console.log(`  ${chalk.green('+')} .gitignore`);
          console.log(chalk.gray('\nRun without --dry-run to create these files.'));
        } else {
          console.log(chalk.green('✅ Scaffolding completed (test mode)'));
        }
      });

    program
      .command('analyze')
      .description('Analyze current project')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        if (options.json) {
          console.log(JSON.stringify({ status: 'test-mode', analysis: {} }, null, 2));
        } else {
          console.log(chalk.cyan('📊 Project Analysis (Test Mode)'));
          console.log('  Type: Test Project');
          console.log('  Status: Mock analysis complete');
        }
      });

    // Show welcome message for bare command
    program.action(() => {
      const welcomeMessage = chalk.cyan(`
🤖 AWE - Awesome Workspace Engineering (Test Mode)

Intelligent companion for Claude Code that provides:
• AI-powered project analysis and optimization
• Smart template recommendations
• Automated setup and configuration
• Context engineering best practices

${chalk.bold('Quick Start:')}
  ${chalk.green('awe init')}      Initialize new project with Claude.md
  ${chalk.green('awe analyze')}   Analyze current project for optimizations
  ${chalk.green('awe scaffold')}  Generate project skeleton

${chalk.bold('Test Mode:')}
  This is a test version using mock data.
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

    // Parse arguments
    await program.parseAsync(process.argv);

  } catch (error) {
    console.error(chalk.red('❌ CLI Error:'), error.message);
    if (program.opts && program.opts().debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ An unexpected error occurred'));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ A critical error occurred'));
  process.exit(1);
});

// Start the CLI
main();