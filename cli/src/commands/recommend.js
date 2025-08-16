/**
 * AWE Recommend Command - AI-powered recommendations
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');

const ProjectAnalyzer = require('../core/analyzer');
const TemplateRecommender = require('../core/recommender');
const { logger } = require('../utils/logger');

const recommendCommand = new Command('recommend')
  .description('Get AI-powered recommendations for your project')
  .option('-t, --type <type>', 'recommendation type (templates, optimizations, tools)')
  .option('-j, --json', 'output as JSON')
  .action(async (options) => {
    try {
      await getRecommendations(options);
    } catch (error) {
      logger.error('Recommend command failed:', error.message);
      console.error(chalk.red('✖'), 'Failed to get recommendations:', error.message);
      process.exit(1);
    }
  });

async function getRecommendations(options) {
  const spinner = options.json ? null : ora('Analyzing project and generating recommendations...').start();
  
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyzeProject(process.cwd());
  
  const recommender = new TemplateRecommender();
  const recommendations = await recommender.recommend(analysis);
  
  if (spinner) spinner.succeed('Recommendations ready');
  
  if (options.json) {
    console.log(JSON.stringify({ recommendations, analysis: analysis.classification }, null, 2));
  } else {
    displayRecommendations(recommendations, analysis);
  }
}

function displayRecommendations(recommendations, analysis) {
  console.log(chalk.cyan('\n🎯 AWE Recommendations\n'));
  
  console.log(`Based on your ${chalk.cyan(analysis.classification.type)} project using ${chalk.cyan(analysis.languages.primary)}:\n`);
  
  if (recommendations.length === 0) {
    console.log(chalk.yellow('No specific recommendations available at this time.'));
    return;
  }
  
  recommendations.forEach((rec, index) => {
    const confidenceColor = rec.confidence === 'high' ? 'green' : 
                           rec.confidence === 'medium' ? 'yellow' : 'gray';
    
    console.log(`${chalk.bold(`${index + 1}. ${rec.name}`)} ${chalk[confidenceColor](`(${rec.confidence} confidence)`)}`);
    console.log(`   ${chalk.gray(rec.description)}`);
    console.log(`   ${chalk.blue('Reasoning:')} ${rec.reasoning}`);
    console.log(`   ${chalk.green('Score:')} ${Math.round(rec.score)}/100\n`);
  });
  
  console.log(chalk.gray('Use `awe init --template <name>` to apply a recommended template.'));
}

module.exports = recommendCommand;