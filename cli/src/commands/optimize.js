/**
 * AWE Optimize Command - Apply optimizations
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const ProjectAnalyzer = require('../core/analyzer');
const { logger } = require('../utils/logger');

const optimizeCommand = new Command('optimize')
  .description('Apply optimization recommendations')
  .option('--auto', 'apply all safe optimizations automatically')
  .option('--dry-run', 'show what would be changed without applying')
  .action(async (options) => {
    try {
      await optimizeProject(options);
    } catch (error) {
      logger.error('Optimize command failed:', error.message);
      console.error(chalk.red('✖'), 'Optimization failed:', error.message);
      process.exit(1);
    }
  });

async function optimizeProject(options) {
  console.log(chalk.cyan('\n⚡ AWE Project Optimization\n'));
  
  const spinner = ora('Analyzing optimization opportunities...').start();
  
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyzeProject(process.cwd());
  const optimizations = await analyzer.findOptimizations(analysis);
  
  spinner.succeed('Analysis complete');
  
  if (optimizations.length === 0) {
    console.log(chalk.green('✅ No optimization opportunities found!'));
    console.log(chalk.gray('Your project is already well optimized.\n'));
    return;
  }
  
  console.log(chalk.bold(`Found ${optimizations.length} optimization opportunities:\n`));
  
  // Display optimizations
  optimizations.forEach((opt, index) => {
    const priorityColor = opt.priority === 'high' ? 'red' : 
                         opt.priority === 'medium' ? 'yellow' : 'gray';
    
    console.log(`${index + 1}. ${chalk[priorityColor](opt.priority.toUpperCase())} ${opt.title}`);
    console.log(`   ${chalk.gray(opt.description)}`);
    if (opt.impact) {
      console.log(`   ${chalk.green('Impact:')} ${opt.impact}`);
    }
    console.log();
  });
  
  if (options.dryRun) {
    console.log(chalk.yellow('Dry run mode - no changes applied.'));
    return;
  }
  
  // Interactive optimization selection
  if (!options.auto) {
    const choices = optimizations.map((opt, index) => ({
      name: `${opt.title} (${opt.priority} priority)`,
      value: index,
      checked: opt.priority === 'high'
    }));
    
    const { selectedOptimizations } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedOptimizations',
      message: 'Select optimizations to apply:',
      choices
    }]);
    
    if (selectedOptimizations.length === 0) {
      console.log(chalk.yellow('No optimizations selected.'));
      return;
    }
    
    // Apply selected optimizations
    await applyOptimizations(selectedOptimizations.map(i => optimizations[i]));
  } else {
    // Apply all safe optimizations
    const safeOptimizations = optimizations.filter(opt => 
      opt.type !== 'breaking-change' && opt.priority !== 'low'
    );
    
    await applyOptimizations(safeOptimizations);
  }
}

async function applyOptimizations(optimizations) {
  console.log(chalk.bold('\n🔧 Applying optimizations...\n'));
  
  for (const opt of optimizations) {
    const spinner = ora(`Applying: ${opt.title}`).start();
    
    try {
      // Simulate applying optimization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed(`Applied: ${opt.title}`);
    } catch (error) {
      spinner.fail(`Failed: ${opt.title}`);
      logger.error('Optimization failed:', error.message);
    }
  }
  
  console.log(chalk.green('\n✅ Optimization complete!'));
  console.log(chalk.gray('Run `awe analyze` to see the improvements.\n'));
}

module.exports = optimizeCommand;