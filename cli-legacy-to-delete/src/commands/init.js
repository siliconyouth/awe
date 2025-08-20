/**
 * AWE Init Command - Interactive project initialization
 * 
 * Analyzes the current project and guides users through setting up
 * optimal Claude Code configuration with intelligent recommendations.
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');

const ProjectAnalyzer = require('../core/analyzer');
const TemplateRecommender = require('../core/recommender');
const { getDatabase } = require('../core/database');
const { logger } = require('../utils/logger');
const { validateProject, validateCommandOptions } = require('../utils/validation');

const initCommand = new Command('init')
  .description('Initialize Claude Code configuration for current project')
  .option('-y, --yes', 'skip interactive prompts and use defaults')
  .option('-t, --template <name>', 'use specific template')
  .option('--force', 'overwrite existing CLAUDE.md')
  .action(async (options) => {
    try {
      await initializeProject(options);
    } catch (error) {
      logger.error('Init command failed:', error.message);
      console.error(chalk.red('✖'), 'Failed to initialize project:', error.message);
      process.exit(1);
    }
  });

/**
 * Main initialization function
 */
async function initializeProject(options) {
  const projectPath = process.cwd();
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  console.log(chalk.cyan('\n🤖 AWE - Initializing Claude Code Configuration\n'));

  // Validate command options
  const optionValidation = validateCommandOptions('init', options);
  if (!optionValidation.valid) {
    console.error(chalk.red('❌ Invalid options:'));
    optionValidation.errors.forEach(error => {
      console.error(chalk.red(`  • ${error}`));
    });
    process.exit(1);
  }

  // Validate project directory
  const projectValidation = await validateProject(projectPath);
  if (!projectValidation.valid) {
    console.error(chalk.red('❌ Project validation failed:'));
    projectValidation.errors.forEach(error => {
      console.error(chalk.red(`  • ${error}`));
    });
    process.exit(1);
  }

  if (projectValidation.warnings.length > 0) {
    console.log(chalk.yellow('⚠️  Project validation warnings:'));
    projectValidation.warnings.forEach(warning => {
      console.log(chalk.yellow(`  • ${warning}`));
    });
    console.log(); // Empty line for spacing
  }

  // Check if CLAUDE.md already exists
  if (await fs.pathExists(claudeMdPath) && !options.force) {
    const overwrite = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'CLAUDE.md already exists. Overwrite?',
      default: false
    }]);

    if (!overwrite.overwrite) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
  }

  // Step 1: Analyze project
  const spinner = ora('Analyzing project structure...').start();
  
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyzeProject(projectPath);
  
  spinner.succeed('Project analysis complete');
  
  // Display analysis summary
  displayAnalysisSummary(analysis);

  // Step 2: Get template recommendations
  let selectedTemplate = null;
  
  if (options.template) {
    // Use specified template
    const db = getDatabase();
    selectedTemplate = db.getTemplate(options.template);
    
    if (!selectedTemplate) {
      console.error(chalk.red('✖'), `Template "${options.template}" not found`);
      process.exit(1);
    }
  } else if (!options.yes) {
    // Interactive template selection
    selectedTemplate = await selectTemplate(analysis);
  } else {
    // Auto-select best template
    const recommender = new TemplateRecommender();
    const recommendations = await recommender.recommend(analysis);
    selectedTemplate = recommendations[0] || null;
  }

  if (!selectedTemplate) {
    console.error(chalk.red('✖'), 'No suitable template found');
    process.exit(1);
  }

  // Step 3: Customize template
  let customizedContent = selectedTemplate.content;
  
  if (!options.yes) {
    customizedContent = await customizeTemplate(selectedTemplate, analysis);
  } else {
    customizedContent = await autoCustomizeTemplate(selectedTemplate, analysis);
  }

  // Step 4: Write CLAUDE.md
  await fs.writeFile(claudeMdPath, customizedContent, 'utf8');
  
  // Step 5: Save project to database
  await saveProjectData(analysis, selectedTemplate);

  // Step 6: Generate additional recommendations
  await generateAdditionalRecommendations(analysis);

  console.log(chalk.green('\n✅ Project initialization complete!'));
  console.log(chalk.cyan(`📄 Created: ${path.relative(process.cwd(), claudeMdPath)}`));
  console.log(chalk.gray('\nNext steps:'));
  console.log(chalk.gray('• Review and customize your CLAUDE.md'));
  console.log(chalk.gray('• Run `awe analyze` to check for optimizations'));
  console.log(chalk.gray('• Use `awe recommend` for ongoing suggestions\n'));
}

/**
 * Display project analysis summary
 */
function displayAnalysisSummary(analysis) {
  console.log(chalk.bold('\n📊 Project Analysis:'));
  console.log(`  Type: ${chalk.cyan(analysis.classification.type)}`);
  console.log(`  Primary Language: ${chalk.cyan(analysis.languages.primary || 'Unknown')}`);
  
  if (analysis.frameworks.detected.length > 0) {
    console.log(`  Frameworks: ${chalk.cyan(analysis.frameworks.detected.join(', '))}`);
  }
  
  if (analysis.patterns.architecture.length > 0) {
    console.log(`  Architecture: ${chalk.cyan(analysis.patterns.architecture.join(', '))}`);
  }
  
  console.log(`  Files: ${chalk.yellow(analysis.structure.totalFiles)}`);
  console.log(`  Claude Code Setup: ${chalk.yellow(analysis.claudeCode.completeness + '%')}`);
}

/**
 * Interactive template selection
 */
async function selectTemplate(analysis) {
  const spinner = ora('Getting template recommendations...').start();
  
  const recommender = new TemplateRecommender();
  const recommendations = await recommender.recommend(analysis);
  
  spinner.succeed('Template recommendations ready');

  if (recommendations.length === 0) {
    console.log(chalk.yellow('No specific recommendations found, using general template.'));
    const db = getDatabase();
    return db.getTemplate('general-template');
  }

  console.log(chalk.bold('\n🎯 Recommended Templates:'));
  
  const choices = recommendations.map((rec, index) => ({
    name: `${rec.name} ${chalk.gray(`(${rec.confidence} confidence)`)}
  ${chalk.gray(rec.reasoning)}`,
    value: rec,
    short: rec.name
  }));

  // Add option to browse all templates
  choices.push({
    name: chalk.gray('Browse all templates...'),
    value: 'browse',
    short: 'Browse all'
  });

  const { template } = await inquirer.prompt([{
    type: 'list',
    name: 'template',
    message: 'Select a template:',
    choices,
    pageSize: 10
  }]);

  if (template === 'browse') {
    return await browseAllTemplates();
  }

  return template;
}

/**
 * Browse all available templates
 */
async function browseAllTemplates() {
  const db = getDatabase();
  const allTemplates = db.getTemplates();
  
  const choices = allTemplates.map(template => ({
    name: `${template.name} ${chalk.gray(`(${template.category})`)}
  ${chalk.gray(template.description)}`,
    value: template,
    short: template.name
  }));

  const { template } = await inquirer.prompt([{
    type: 'list',
    name: 'template',
    message: 'Select from all templates:',
    choices,
    pageSize: 10
  }]);

  return template;
}

/**
 * Customize template interactively
 */
async function customizeTemplate(template, analysis) {
  console.log(chalk.bold('\n⚙️  Template Customization:'));
  
  const customizations = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(process.cwd())
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: `${analysis.classification.type} project built with ${analysis.languages.primary}`
    },
    {
      type: 'confirm',
      name: 'includeWorkflow',
      message: 'Include Feature Implementation System Guidelines?',
      default: true
    },
    {
      type: 'confirm',
      name: 'includeCriticalWorkflow',
      message: 'Include Critical Workflow Requirements?',
      default: false
    }
  ]);

  return applyCustomizations(template.content, customizations, analysis);
}

/**
 * Auto-customize template based on analysis
 */
async function autoCustomizeTemplate(template, analysis) {
  const customizations = {
    projectName: path.basename(process.cwd()),
    description: `${analysis.classification.type} project built with ${analysis.languages.primary}`,
    includeWorkflow: true,
    includeCriticalWorkflow: false
  };

  return applyCustomizations(template.content, customizations, analysis);
}

/**
 * Apply customizations to template content
 */
function applyCustomizations(content, customizations, analysis) {
  let customized = content;

  // Replace placeholders
  customized = customized.replace(/\[Project Name\]/g, customizations.projectName);
  customized = customized.replace(/\[Brief description.*?\]/g, customizations.description);
  customized = customized.replace(/\[Primary language\]/g, analysis.languages.primary || 'JavaScript');
  customized = customized.replace(/\[Main framework\]/g, analysis.frameworks.detected[0] || 'Express');
  
  // Add detected technologies
  if (analysis.frameworks.detected.length > 0) {
    customized = customized.replace(
      /- \*\*Framework\*\*: \[Main framework\]/,
      `- **Framework**: ${analysis.frameworks.detected.join(', ')}`
    );
  }

  // Add Feature Implementation Guidelines if requested
  if (customizations.includeWorkflow) {
    const workflowGuidelines = `

## Feature Implementation System Guidelines

### Feature Implementation Priority Rules
- IMMEDIATE EXECUTION: Launch parallel Tasks immediately upon feature requests
- NO CLARIFICATION: Skip asking what type of implementation unless absolutely critical
- PARALLEL BY DEFAULT: Always use 7-parallel-Task method for efficiency

### Parallel Feature Implementation Workflow
1. **Component**: Create main component file
2. **Styles**: Create component styles/CSS
3. **Tests**: Create test files  
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Remaining**: Update package.json, documentation, configuration files
8. **Review and Validation**: Coordinate integration, run tests, verify build, check for conflicts

### Context Optimization Rules
- Strip out all comments when reading code files for analysis
- Each task handles ONLY specified files or file types
- Task 7 combines small config/doc updates to prevent over-splitting

### Feature Implementation Guidelines
- **CRITICAL**: Make MINIMAL CHANGES to existing patterns and structures
- **CRITICAL**: Preserve existing naming conventions and file organization
- Follow project's established architecture and component patterns
- Use existing utility functions and avoid duplicating functionality`;

    customized += workflowGuidelines;
  }

  // Add Critical Workflow Requirements if requested
  if (customizations.includeCriticalWorkflow) {
    const criticalWorkflow = `

## CRITICAL WORKFLOW REQUIREMENT 

    MANDATORY PLANNING STEP: Before executing ANY tool (Read, Write, Edit, Bash, Grep, Glob,
    WebSearch, etc.), you MUST:

    1. FIRST: Use exit_plan_mode tool to present your plan
    2. WAIT: For explicit user approval before proceeding
    3. ONLY THEN: Execute the planned actions

    ZERO EXCEPTIONS: This applies to EVERY INDIVIDUAL USER REQUEST involving tool usage,
  regardless of:
    - Complexity (simple or complex)
    - Tool type (file operations, searches, web requests, etc.)
    - User urgency or apparent simplicity
    - Whether you previously got approval in this conversation

    CRITICAL: APPROVAL DOES NOT CARRY OVER BETWEEN USER INSTRUCTIONS
    - Each new user message requiring tools = new planning step required
    - Previous approvals are invalid for new requests
    - You must reset and plan for each individual user instruction

    ENFORCEMENT: If you execute ANY tool without first using exit_plan_mode for the current
    user instruction, you have violated this requirement. Always plan first, execute second.

    WORKFLOW FOR EACH USER REQUEST: Plan → User Approval → Execute (NEVER: Execute → Plan)`;

    customized = criticalWorkflow + '\n' + customized;
  }

  return customized;
}

/**
 * Save project data to database
 */
async function saveProjectData(analysis, template) {
  try {
    const db = getDatabase();
    
    const projectData = {
      path: analysis.path,
      name: path.basename(analysis.path),
      type: analysis.classification.type,
      language: analysis.languages.primary,
      framework: analysis.frameworks.detected[0] || null,
      features: analysis.frameworks,
      analysis: analysis,
      templateId: template.id
    };

    db.saveProject(projectData);
    db.incrementTemplateUsage(template.id);
    
    logger.info('Project data saved to database');
  } catch (error) {
    logger.error('Failed to save project data:', error.message);
  }
}

/**
 * Generate additional recommendations
 */
async function generateAdditionalRecommendations(analysis) {
  const optimizations = await new ProjectAnalyzer().findOptimizations(analysis);
  
  if (optimizations.length > 0) {
    console.log(chalk.bold('\n💡 Additional Recommendations:'));
    
    for (const opt of optimizations.slice(0, 3)) {
      const priority = opt.priority === 'high' ? chalk.red('HIGH') : 
                     opt.priority === 'medium' ? chalk.yellow('MED') : chalk.gray('LOW');
      console.log(`  ${priority} ${opt.title}`);
      console.log(chalk.gray(`      ${opt.description}`));
    }
    
    console.log(chalk.gray('\n  Run `awe analyze` for detailed optimization suggestions.'));
  }
}

module.exports = initCommand;