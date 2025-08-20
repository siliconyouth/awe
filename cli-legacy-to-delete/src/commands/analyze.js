/**
 * AWE Analyze Command - Project analysis and optimization detection
 * 
 * Provides comprehensive analysis of projects including:
 * - Code structure and patterns
 * - Claude Code setup assessment
 * - Optimization opportunities
 * - Performance recommendations
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const path = require('path');

const ProjectAnalyzer = require('../core/analyzer');
const { getDatabase } = require('../core/database');
const { logger } = require('../utils/logger');

const analyzeCommand = new Command('analyze')
  .description('Analyze project for optimization opportunities')
  .option('-v, --verbose', 'show detailed analysis')
  .option('-j, --json', 'output as JSON')
  .option('--save', 'save analysis results to database')
  .action(async (options) => {
    try {
      await analyzeProject(options);
    } catch (error) {
      logger.error('Analyze command failed:', error.message);
      console.error(chalk.red('✖'), 'Analysis failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Main analyze function
 */
async function analyzeProject(options) {
  const projectPath = process.cwd();
  
  if (!options.json) {
    console.log(chalk.cyan('\n🔍 AWE - Project Analysis\n'));
  }

  // Analyze project
  const spinner = options.json ? null : ora('Analyzing project...').start();
  
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyzeProject(projectPath);
  const optimizations = await analyzer.findOptimizations(analysis);
  
  if (spinner) spinner.succeed('Analysis complete');

  // Save to database if requested
  if (options.save) {
    await saveAnalysis(analysis);
  }

  // Output results
  if (options.json) {
    outputJSON(analysis, optimizations);
  } else {
    outputFormatted(analysis, optimizations, options.verbose);
  }
}

/**
 * Output analysis as JSON
 */
function outputJSON(analysis, optimizations) {
  const result = {
    analysis,
    optimizations,
    timestamp: new Date().toISOString()
  };
  
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Output formatted analysis
 */
function outputFormatted(analysis, optimizations, verbose) {
  // Project Overview
  displayProjectOverview(analysis);
  
  // Technology Stack
  displayTechnologyStack(analysis);
  
  // Architecture & Patterns
  displayArchitecture(analysis);
  
  // Claude Code Assessment
  displayClaudeCodeAssessment(analysis);
  
  // Optimizations
  displayOptimizations(optimizations);
  
  // Detailed Analysis (verbose mode)
  if (verbose) {
    displayDetailedAnalysis(analysis);
  }
  
  // Summary
  displaySummary(analysis, optimizations);
}

/**
 * Display project overview
 */
function displayProjectOverview(analysis) {
  const overview = boxen(
    `${chalk.bold('Project:')} ${path.basename(analysis.path)}
${chalk.bold('Type:')} ${analysis.classification.type} ${chalk.gray(`(${analysis.classification.confidence} confidence)`)}
${chalk.bold('Files:')} ${analysis.structure.totalFiles}
${chalk.bold('Size:')} ${formatFileSize(analysis.structure.totalSize)}
${chalk.bold('Depth:')} ${analysis.structure.depth} levels`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue',
      title: '📋 Project Overview'
    }
  );
  
  console.log(overview);
}

/**
 * Display technology stack
 */
function displayTechnologyStack(analysis) {
  console.log(chalk.bold('\n🛠️  Technology Stack:'));
  
  // Languages
  if (analysis.languages.primary) {
    console.log(`  Primary Language: ${chalk.cyan(analysis.languages.primary)}`);
    
    if (Object.keys(analysis.languages.detected).length > 1) {
      const others = Object.entries(analysis.languages.detected)
        .filter(([lang]) => lang !== analysis.languages.primary)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ');
      console.log(`  Other Languages: ${chalk.gray(others)}`);
    }
  } else {
    console.log(chalk.gray('  No primary language detected'));
  }
  
  // Frameworks
  if (analysis.frameworks.detected.length > 0) {
    console.log(`  Frameworks: ${chalk.green(analysis.frameworks.detected.join(', '))}`);
    
    if (analysis.frameworks.frontend.length > 0) {
      console.log(`    Frontend: ${chalk.cyan(analysis.frameworks.frontend.join(', '))}`);
    }
    
    if (analysis.frameworks.backend.length > 0) {
      console.log(`    Backend: ${chalk.cyan(analysis.frameworks.backend.join(', '))}`);
    }
    
    if (analysis.frameworks.testing.length > 0) {
      console.log(`    Testing: ${chalk.yellow(analysis.frameworks.testing.join(', '))}`);
    }
  } else {
    console.log(chalk.gray('  No frameworks detected'));
  }
  
  // Package Manager
  if (analysis.dependencies.packageManager) {
    console.log(`  Package Manager: ${chalk.magenta(analysis.dependencies.packageManager)}`);
    console.log(`  Dependencies: ${analysis.dependencies.dependencies.length}`);
    console.log(`  Dev Dependencies: ${analysis.dependencies.devDependencies.length}`);
  }
}

/**
 * Display architecture and patterns
 */
function displayArchitecture(analysis) {
  console.log(chalk.bold('\n🏗️  Architecture & Patterns:'));
  
  if (analysis.patterns.architecture.length > 0) {
    console.log(`  Architecture: ${chalk.green(analysis.patterns.architecture.join(', '))}`);
  } else {
    console.log(chalk.gray('  No specific architecture patterns detected'));
  }
  
  // Naming conventions
  if (analysis.patterns.conventions.naming) {
    console.log(`  Naming Convention: ${chalk.cyan(analysis.patterns.conventions.naming)}`);
  }
  
  // Configuration tools
  if (analysis.configuration.tools.length > 0) {
    console.log(`  Development Tools: ${chalk.yellow(analysis.configuration.tools.join(', '))}`);
  }
  
  // Git status
  if (analysis.git.isRepository) {
    console.log(`  Git Repository: ${chalk.green('✓')} ${analysis.git.branch ? `(${analysis.git.branch})` : ''}`);
  } else {
    console.log(`  Git Repository: ${chalk.red('✗')}`);
  }
}

/**
 * Display Claude Code assessment
 */
function displayClaudeCodeAssessment(analysis) {
  const claudeCode = analysis.claudeCode;
  const completeness = claudeCode.completeness;
  
  let status, color;
  if (completeness >= 80) {
    status = 'Excellent';
    color = 'green';
  } else if (completeness >= 60) {
    status = 'Good';
    color = 'yellow';
  } else if (completeness >= 30) {
    status = 'Basic';
    color = 'orange';
  } else {
    status = 'Needs Setup';
    color = 'red';
  }
  
  console.log(chalk.bold('\n🤖 Claude Code Assessment:'));
  console.log(`  Setup Status: ${chalk[color](status)} (${completeness}%)`);
  
  if (claudeCode.hasClaudeMd) {
    console.log(`  CLAUDE.md: ${chalk.green('✓')} Found`);
  } else {
    console.log(`  CLAUDE.md: ${chalk.red('✗')} Missing`);
  }
  
  if (claudeCode.hasClaudeDir) {
    console.log(`  .claude directory: ${chalk.green('✓')} Found`);
    
    if (claudeCode.hooks.length > 0) {
      console.log(`    Hooks: ${chalk.cyan(claudeCode.hooks.length)} configured`);
    }
    
    if (claudeCode.agents.length > 0) {
      console.log(`    Agents: ${chalk.cyan(claudeCode.agents.length)} configured`);
    }
  } else {
    console.log(`  .claude directory: ${chalk.red('✗')} Missing`);
  }
}

/**
 * Display optimization opportunities
 */
function displayOptimizations(optimizations) {
  console.log(chalk.bold('\n💡 Optimization Opportunities:'));
  
  if (optimizations.length === 0) {
    console.log(chalk.green('  ✓ No major optimization opportunities found!'));
    return;
  }
  
  // Group by priority
  const grouped = {
    high: optimizations.filter(o => o.priority === 'high'),
    medium: optimizations.filter(o => o.priority === 'medium'),
    low: optimizations.filter(o => o.priority === 'low')
  };
  
  for (const [priority, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;
    
    const priorityColor = priority === 'high' ? 'red' : priority === 'medium' ? 'yellow' : 'gray';
    const priorityLabel = priority.toUpperCase();
    
    console.log(`\n  ${chalk[priorityColor](priorityLabel)} Priority:`);
    
    for (const opt of items) {
      console.log(`    ${chalk[priorityColor]('•')} ${opt.title}`);
      console.log(`      ${chalk.gray(opt.description)}`);
      if (opt.impact) {
        console.log(`      ${chalk.green('Impact:')} ${opt.impact}`);
      }
    }
  }
  
  console.log(chalk.gray('\n  Run `awe optimize` to apply automatic fixes.'));
}

/**
 * Display detailed analysis (verbose mode)
 */
function displayDetailedAnalysis(analysis) {
  console.log(chalk.bold('\n📊 Detailed Analysis:'));
  
  // File breakdown
  console.log('\n  File Types:');
  const fileTypes = {};
  for (const file of analysis.structure.files) {
    const ext = file.extension || 'no-extension';
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
  }
  
  Object.entries(fileTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([ext, count]) => {
      console.log(`    ${ext}: ${count} files`);
    });
  
  // Directory structure
  console.log('\n  Top-level Directories:');
  const topDirs = analysis.structure.directories
    .filter(d => !d.path.includes('/'))
    .slice(0, 10);
  
  for (const dir of topDirs) {
    console.log(`    ${dir.name}/`);
  }
  
  // Package.json scripts
  if (Object.keys(analysis.dependencies.scripts).length > 0) {
    console.log('\n  Available Scripts:');
    Object.entries(analysis.dependencies.scripts).forEach(([name, script]) => {
      console.log(`    ${chalk.cyan(name)}: ${chalk.gray(script)}`);
    });
  }
}

/**
 * Display summary and next steps
 */
function displaySummary(analysis, optimizations) {
  const highPriorityOptimizations = optimizations.filter(o => o.priority === 'high').length;
  const totalOptimizations = optimizations.length;
  
  let summaryColor = 'green';
  let summaryMessage = 'Project is well configured!';
  
  if (highPriorityOptimizations > 0) {
    summaryColor = 'red';
    summaryMessage = `${highPriorityOptimizations} high priority optimization${highPriorityOptimizations > 1 ? 's' : ''} found`;
  } else if (totalOptimizations > 0) {
    summaryColor = 'yellow';
    summaryMessage = `${totalOptimizations} optimization${totalOptimizations > 1 ? 's' : ''} available`;
  }
  
  const summary = boxen(
    `${chalk[summaryColor](summaryMessage)}

${chalk.bold('Next Steps:')}
${optimizations.length > 0 ? '• Run `awe optimize` to apply fixes' : ''}
${analysis.claudeCode.completeness < 50 ? '• Run `awe init` to improve Claude Code setup' : ''}
• Use `awe recommend` for ongoing suggestions
• Run `awe sync` to update knowledge base`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: summaryColor,
      title: '📝 Summary'
    }
  );
  
  console.log('\n' + summary + '\n');
}

/**
 * Save analysis to database
 */
async function saveAnalysis(analysis) {
  try {
    const db = getDatabase();
    
    const projectData = {
      path: analysis.path,
      name: path.basename(analysis.path),
      type: analysis.classification.type,
      language: analysis.languages.primary,
      framework: analysis.frameworks.detected[0] || null,
      features: analysis.frameworks,
      analysis: analysis
    };
    
    db.saveProject(projectData);
    logger.info('Analysis saved to database');
  } catch (error) {
    logger.error('Failed to save analysis:', error.message);
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = analyzeCommand;