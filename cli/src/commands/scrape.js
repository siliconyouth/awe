#!/usr/bin/env node

const { Command } = require('commander');
const IntelligentScraper = require('../core/scraper');
const logger = require('../utils/logger');
const chalk = require('chalk');

/**
 * Scrape command - Intelligent gathering of Claude Code patterns and templates
 */
const scrapeCommand = new Command('scrape')
  .description('Intelligently scrape and gather Claude Code patterns, templates, and best practices')
  .option('-s, --sources <sources>', 'Comma-separated list of sources to scrape', 'all')
  .option('-c, --categories <categories>', 'Filter by categories (frontend,backend,testing,devops)', '')
  .option('-l, --limit <number>', 'Limit number of items to scrape per source', '50')
  .option('--dry-run', 'Show what would be scraped without actually scraping')
  .option('--force', 'Force re-scraping even if data exists')
  .option('--concurrent <number>', 'Number of concurrent scraping tasks', '3')
  .option('--output <format>', 'Output format (json,table,summary)', 'summary')
  .action(async (options) => {
    try {
      await handleScrapeCommand(options);
    } catch (error) {
      logger.error('Scrape command failed:', error);
      process.exit(1);
    }
  });

async function handleScrapeCommand(options) {
  console.log(chalk.blue.bold('🔍 AWE Intelligent Scraper'));
  console.log(chalk.gray('Gathering Claude Code patterns and best practices...\n'));

  const scraper = new IntelligentScraper();
  
  // Parse sources
  const availableSources = [
    'claude-docs',
    'github-patterns', 
    'community-templates',
    'best-practices'
  ];
  
  let sourcesToScrape = availableSources;
  if (options.sources !== 'all') {
    sourcesToScrape = options.sources.split(',').map(s => s.trim());
    
    // Validate sources
    const invalidSources = sourcesToScrape.filter(s => !availableSources.includes(s));
    if (invalidSources.length > 0) {
      console.error(chalk.red(`Invalid sources: ${invalidSources.join(', ')}`));
      console.log(chalk.yellow(`Available sources: ${availableSources.join(', ')}`));
      process.exit(1);
    }
  }

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No data will be saved\n'));
    console.log('Sources to scrape:');
    sourcesToScrape.forEach(source => {
      console.log(chalk.blue(`  • ${source}`));
    });
    console.log(`\nLimit per source: ${options.limit}`);
    console.log(`Concurrent tasks: ${options.concurrent}`);
    return;
  }

  // Check existing data
  if (!options.force) {
    const existingData = await checkExistingData(scraper, sourcesToScrape);
    if (existingData.hasData) {
      console.log(chalk.yellow('⚠️  Existing scraped data found:'));
      existingData.sources.forEach(({ source, count }) => {
        console.log(chalk.gray(`   ${source}: ${count} items`));
      });
      console.log(chalk.yellow('\nUse --force to re-scrape existing data\n'));
    }
  }

  // Start scraping
  const startTime = Date.now();
  console.log(chalk.green('🚀 Starting intelligent scraping...\n'));

  try {
    const results = await scraper.scrapeAll(sourcesToScrape);
    
    // Display results
    await displayResults(results, options.output);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`\n✅ Scraping completed in ${duration}s`));
    
    // Generate insights
    await generateInsights(scraper, results);
    
  } catch (error) {
    console.error(chalk.red('❌ Scraping failed:', error.message));
    
    if (error.code === 'NETWORK_ERROR') {
      console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
      console.log(chalk.gray('  • Check your internet connection'));
      console.log(chalk.gray('  • Some sources may be temporarily unavailable'));
      console.log(chalk.gray('  • Try scraping individual sources with -s option'));
    }
    
    process.exit(1);
  }
}

async function checkExistingData(scraper, sources) {
  const db = scraper.db;
  const result = { hasData: false, sources: [] };
  
  for (const source of sources) {
    try {
      // Check patterns
      const patternCount = db.prepare('SELECT COUNT(*) as count FROM patterns WHERE source LIKE ?').get(`%${source}%`);
      
      // Check templates  
      const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates WHERE source LIKE ?').get(`%${source}%`);
      
      const totalCount = (patternCount?.count || 0) + (templateCount?.count || 0);
      
      if (totalCount > 0) {
        result.hasData = true;
        result.sources.push({ source, count: totalCount });
      }
    } catch (error) {
      // Database might not exist yet, continue
    }
  }
  
  return result;
}

async function displayResults(results, format) {
  console.log(chalk.blue.bold('\n📊 Scraping Results'));
  console.log(chalk.gray('─'.repeat(50)));

  switch (format) {
    case 'json':
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'table':
      displayResultsTable(results);
      break;
      
    case 'summary':
    default:
      displayResultsSummary(results);
      break;
  }
}

function displayResultsSummary(results) {
  let totalPatterns = 0;
  let totalTemplates = 0;
  let successfulSources = 0;
  let failedSources = 0;

  Object.entries(results).forEach(([source, result]) => {
    if (result.error) {
      failedSources++;
      console.log(chalk.red(`❌ ${source}: ${result.error}`));
    } else {
      successfulSources++;
      const patterns = result.patterns || 0;
      const templates = result.templates || 0;
      const practices = result.practices || 0;
      
      totalPatterns += patterns;
      totalTemplates += templates;
      
      console.log(chalk.green(`✅ ${source}:`));
      if (patterns > 0) console.log(chalk.gray(`   📋 ${patterns} patterns`));
      if (templates > 0) console.log(chalk.gray(`   📄 ${templates} templates`));
      if (practices > 0) console.log(chalk.gray(`   💡 ${practices} best practices`));
    }
  });

  console.log(chalk.blue('\n📈 Summary:'));
  console.log(chalk.gray(`   Successful sources: ${successfulSources}`));
  console.log(chalk.gray(`   Failed sources: ${failedSources}`));
  console.log(chalk.gray(`   Total patterns: ${totalPatterns}`));
  console.log(chalk.gray(`   Total templates: ${totalTemplates}`));
}

function displayResultsTable(results) {
  const Table = require('cli-table3');
  
  const table = new Table({
    head: ['Source', 'Status', 'Patterns', 'Templates', 'Practices'],
    colWidths: [20, 10, 10, 10, 10]
  });

  Object.entries(results).forEach(([source, result]) => {
    if (result.error) {
      table.push([source, chalk.red('Failed'), '-', '-', '-']);
    } else {
      table.push([
        source,
        chalk.green('Success'),
        result.patterns || 0,
        result.templates || 0,
        result.practices || 0
      ]);
    }
  });

  console.log(table.toString());
}

async function generateInsights(scraper, results) {
  console.log(chalk.blue.bold('\n🔍 Pattern Analysis'));
  console.log(chalk.gray('─'.repeat(50)));

  try {
    const db = scraper.db;
    
    // Most common categories
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM patterns 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 5
    `).all();
    
    if (categories.length > 0) {
      console.log(chalk.green('📊 Most Common Pattern Categories:'));
      categories.forEach(({ category, count }) => {
        console.log(chalk.gray(`   ${category}: ${count} patterns`));
      });
    }
    
    // Recent sources
    const recentSources = db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM patterns 
      WHERE created_at > datetime('now', '-1 day')
      GROUP BY source 
      ORDER BY count DESC
    `).all();
    
    if (recentSources.length > 0) {
      console.log(chalk.green('\n🕒 Recently Added Sources:'));
      recentSources.forEach(({ source, count }) => {
        const domain = new URL(source).hostname;
        console.log(chalk.gray(`   ${domain}: ${count} new patterns`));
      });
    }
    
    // Quality metrics
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM patterns').get();
    const uniqueSources = db.prepare('SELECT COUNT(DISTINCT source) as count FROM patterns').get();
    
    console.log(chalk.green('\n📈 Knowledge Base Metrics:'));
    console.log(chalk.gray(`   Total patterns: ${totalItems.count}`));
    console.log(chalk.gray(`   Unique sources: ${uniqueSources.count}`));
    console.log(chalk.gray(`   Avg patterns per source: ${(totalItems.count / uniqueSources.count).toFixed(1)}`));
    
  } catch (error) {
    console.log(chalk.yellow('Unable to generate insights - database may be empty'));
  }
}

// Export for use in other commands
module.exports = {
  scrapeCommand,
  handleScrapeCommand
};

// CLI entry point
if (require.main === module) {
  scrapeCommand.parse(process.argv);
}