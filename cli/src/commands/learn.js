/**
 * AWE Learn Command - Learning and adaptation
 */

const { Command } = require('commander');
const chalk = require('chalk');

const { getDatabase } = require('../core/database');
const { logger } = require('../utils/logger');

const learnCommand = new Command('learn')
  .description('Learn from interactions and improve recommendations')
  .option('--from-interaction', 'learn from current interaction')
  .option('--stats', 'show learning statistics')
  .action(async (options) => {
    try {
      await handleLearning(options);
    } catch (error) {
      logger.error('Learn command failed:', error.message);
      console.error(chalk.red('✖'), 'Learning failed:', error.message);
      process.exit(1);
    }
  });

async function handleLearning(options) {
  if (options.stats) {
    await showLearningStats();
  } else if (options.fromInteraction) {
    await learnFromInteraction();
  } else {
    console.log(chalk.cyan('\n🧠 AWE Learning System\n'));
    console.log('Available learning options:');
    console.log(chalk.gray('  --stats              Show learning statistics'));
    console.log(chalk.gray('  --from-interaction   Learn from recent interaction'));
    console.log(chalk.gray('\nAWE continuously learns from your usage patterns to improve recommendations.\n'));
  }
}

async function showLearningStats() {
  console.log(chalk.cyan('\n📊 AWE Learning Statistics\n'));
  
  try {
    const db = getDatabase();
    
    // Get interaction counts
    const interactions = db.db.prepare(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
             COUNT(CASE WHEN feedback_score >= 4 THEN 1 END) as positive_feedback
      FROM interactions
    `).get();
    
    console.log(`Total interactions: ${chalk.cyan(interactions.total)}`);
    console.log(`Successful: ${chalk.green(interactions.successful)}`);
    console.log(`Positive feedback: ${chalk.green(interactions.positive_feedback)}`);
    
    // Get template usage
    const templates = db.db.prepare(`
      SELECT name, usage_count, rating
      FROM templates 
      ORDER BY usage_count DESC 
      LIMIT 5
    `).all();
    
    if (templates.length > 0) {
      console.log(chalk.bold('\nMost used templates:'));
      templates.forEach((template, index) => {
        console.log(`  ${index + 1}. ${template.name} (${template.usage_count} uses, ${template.rating.toFixed(1)} rating)`);
      });
    }
    
    console.log(chalk.gray('\nLearning system is active and improving recommendations.\n'));
  } catch (error) {
    logger.error('Failed to show learning stats:', error.message);
    console.log(chalk.red('Failed to retrieve learning statistics.'));
  }
}

async function learnFromInteraction() {
  console.log(chalk.cyan('\n🔍 Learning from interaction...\n'));
  
  try {
    const db = getDatabase();
    
    // Record a learning interaction
    db.recordInteraction({
      sessionId: `learn-${Date.now()}`,
      projectPath: process.cwd(),
      action: 'manual_learning',
      context: { timestamp: new Date().toISOString() },
      result: { learned: true },
      success: true
    });
    
    console.log(chalk.green('✅ Interaction recorded for learning.'));
    console.log(chalk.gray('This helps improve future recommendations.\n'));
  } catch (error) {
    logger.error('Failed to record learning interaction:', error.message);
    console.log(chalk.red('Failed to record learning data.'));
  }
}

module.exports = learnCommand;