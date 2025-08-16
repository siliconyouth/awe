/**
 * AWE Sync Command - Knowledge base synchronization
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');

const { getDatabase } = require('../core/database');
const { logger } = require('../utils/logger');

const syncCommand = new Command('sync')
  .description('Sync knowledge base with latest patterns and templates')
  .option('--force', 'force full resync')
  .action(async (options) => {
    try {
      await syncKnowledgeBase(options);
    } catch (error) {
      logger.error('Sync command failed:', error.message);
      console.error(chalk.red('✖'), 'Sync failed:', error.message);
      process.exit(1);
    }
  });

async function syncKnowledgeBase(options) {
  console.log(chalk.cyan('\n🔄 AWE Knowledge Base Sync\n'));
  
  const spinner = ora('Syncing knowledge base...').start();
  
  try {
    const db = getDatabase();
    const result = await db.sync();
    
    spinner.succeed('Knowledge base sync complete');
    
    console.log(chalk.green('\n✅ Sync Results:'));
    console.log(`  Templates updated: ${result.synced || 0}`);
    console.log(`  Last sync: ${new Date(result.updated).toLocaleString()}`);
    console.log(chalk.gray('\nKnowledge base is up to date!\n'));
  } catch (error) {
    spinner.fail('Sync failed');
    throw error;
  }
}

module.exports = syncCommand;