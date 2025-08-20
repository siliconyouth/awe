/**
 * AWE Scaffold Command - Project scaffolding
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const CodeGenerator = require('../core/generator');
const { logger } = require('../utils/logger');

const scaffoldCommand = new Command('scaffold')
  .description('Generate project scaffold from patterns')
  .argument('[pattern]', 'scaffold pattern to use')
  .option('-o, --output <dir>', 'output directory', '.')
  .option('-n, --name <name>', 'project name')
  .option('--dry-run', 'preview what would be created')
  .option('-f, --force', 'overwrite existing files')
  .action(async (pattern, options) => {
    try {
      await scaffoldProject(pattern, options);
    } catch (error) {
      logger.error('Scaffold command failed:', error.message);
      console.error(chalk.red('✖'), 'Scaffolding failed:', error.message);
      process.exit(1);
    }
  });

const AVAILABLE_PATTERNS = {
  'web-react': {
    name: 'React Web Application',
    description: 'Modern React app with TypeScript, Vite, and best practices'
  },
  'nodejs-api': {
    name: 'Node.js API Service',
    description: 'Express.js API with TypeScript, testing, and documentation'
  },
  'python-data': {
    name: 'Python Data Science',
    description: 'Python project with Jupyter, pandas, and data science tools'
  },
  'frontend-spa': {
    name: 'Frontend Single Page App',
    description: 'Framework-agnostic SPA template'
  },
  'backend-service': {
    name: 'Backend Microservice',
    description: 'Language-agnostic backend service template'
  },
  'cli-tool': {
    name: 'Command Line Tool',
    description: 'CLI application with proper argument handling'
  },
  'library': {
    name: 'Library/Package',
    description: 'Reusable library with documentation and testing'
  },
  'fullstack': {
    name: 'Full-stack Application',
    description: 'Complete frontend + backend application'
  }
};

async function scaffoldProject(pattern, options) {
  console.log(chalk.cyan('\n🏗️  AWE Project Scaffolding\n'));
  
  // Show available patterns if none specified
  if (!pattern) {
    await showAvailablePatterns();
    return;
  }

  // Validate pattern
  if (!AVAILABLE_PATTERNS[pattern]) {
    console.error(chalk.red('✖'), `Unknown pattern: ${pattern}`);
    console.log(chalk.yellow('\nAvailable patterns:'));
    Object.entries(AVAILABLE_PATTERNS).forEach(([key, info]) => {
      console.log(`  ${chalk.cyan(key.padEnd(15))} - ${info.description}`);
    });
    process.exit(1);
  }

  // Setup target directory
  const targetPath = path.resolve(options.output);
  const projectName = options.name || path.basename(targetPath);

  // Check if directory exists and handle conflicts
  if (await fs.pathExists(targetPath) && !options.force) {
    const files = await fs.readdir(targetPath);
    if (files.length > 0 && !options.dryRun) {
      const overwrite = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${targetPath} is not empty. Continue?`,
        default: false
      }]);

      if (!overwrite.overwrite) {
        console.log(chalk.yellow('Scaffolding cancelled.'));
        return;
      }
    }
  }

  // Get project details
  let projectConfig = {
    pattern,
    name: projectName,
    description: `${AVAILABLE_PATTERNS[pattern].name} project`
  };

  if (!options.dryRun) {
    projectConfig = await getProjectDetails(projectConfig, pattern);
  }

  // Dry run mode - show what would be created
  if (options.dryRun) {
    await showDryRun(pattern, targetPath, projectConfig);
    return;
  }

  // Generate scaffold
  const spinner = ora(`Scaffolding ${AVAILABLE_PATTERNS[pattern].name}...`).start();
  
  try {
    const generator = new CodeGenerator();
    const result = await generator.scaffold(pattern, targetPath, {
      ...projectConfig,
      customContext: projectConfig
    });

    spinner.succeed('Project scaffolding complete');

    // Display results
    console.log(chalk.green('\n✅ Scaffolding Results:'));
    console.log(`  Pattern: ${chalk.cyan(AVAILABLE_PATTERNS[pattern].name)}`);
    console.log(`  Location: ${chalk.gray(targetPath)}`);
    console.log(`  Files created: ${chalk.yellow(result.files.length)}`);
    
    console.log(chalk.bold('\n📁 Created Files:'));
    result.files.forEach(file => {
      console.log(`  ${chalk.green('+')} ${file}`);
    });

    if (result.instructions && result.instructions.length > 0) {
      console.log(chalk.bold('\n📋 Next Steps:'));
      result.instructions.forEach(instruction => {
        console.log(`  ${chalk.blue('•')} ${instruction}`);
      });
    }

    // Pattern-specific instructions
    await showPatternInstructions(pattern, targetPath, projectConfig);

  } catch (error) {
    spinner.fail('Scaffolding failed');
    throw error;
  }
}

async function showAvailablePatterns() {
  console.log(chalk.bold('Available Scaffold Patterns:\n'));
  
  Object.entries(AVAILABLE_PATTERNS).forEach(([key, info]) => {
    console.log(`${chalk.cyan(key.padEnd(15))} - ${info.description}`);
  });
  
  console.log(chalk.gray('\nUsage: awe scaffold <pattern> [options]'));
  console.log(chalk.gray('Options: -o <dir>, -n <name>, --dry-run, --force'));
  console.log(chalk.gray('\nExample: awe scaffold web-react -n my-app -o ./my-project'));
}

async function getProjectDetails(config, pattern) {
  console.log(chalk.bold('📝 Project Configuration:'));
  
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: config.name,
      validate: (input) => input.length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: config.description
    }
  ];

  // Pattern-specific questions
  if (pattern === 'web-react') {
    questions.push(
      {
        type: 'list',
        name: 'styling',
        message: 'Styling approach:',
        choices: ['Tailwind CSS', 'Styled Components', 'CSS Modules', 'Plain CSS'],
        default: 'Tailwind CSS'
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript?',
        default: true
      }
    );
  } else if (pattern === 'nodejs-api') {
    questions.push(
      {
        type: 'list',
        name: 'database',
        message: 'Database type:',
        choices: ['PostgreSQL', 'MongoDB', 'SQLite', 'MySQL', 'None'],
        default: 'PostgreSQL'
      },
      {
        type: 'confirm',
        name: 'authentication',
        message: 'Include authentication?',
        default: true
      }
    );
  }

  const answers = await inquirer.prompt(questions);
  return { ...config, ...answers };
}

async function showDryRun(pattern, targetPath, config) {
  console.log(chalk.yellow('🔍 DRY RUN - Preview of files that would be created:\n'));
  
  console.log(`Pattern: ${chalk.cyan(AVAILABLE_PATTERNS[pattern].name)}`);
  console.log(`Target: ${chalk.gray(targetPath)}`);
  console.log(`Project: ${chalk.blue(config.name)}\n`);

  const files = getExpectedFiles(pattern);
  
  console.log(chalk.bold('Files to create:'));
  files.forEach(file => {
    console.log(`  ${chalk.green('+')} ${file}`);
  });

  console.log(chalk.gray('\nRun without --dry-run to create these files.'));
}

function getExpectedFiles(pattern) {
  const commonFiles = [
    'CLAUDE.md',
    'README.md',
    '.gitignore'
  ];

  const patternFiles = {
    'web-react': [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'index.html',
      'src/main.tsx',
      'src/App.tsx',
      'src/components/HelloWorld.tsx',
      'src/index.css',
      'public/vite.svg'
    ],
    'nodejs-api': [
      'package.json',
      'tsconfig.json',
      'src/index.ts',
      'src/routes/index.ts',
      'src/middleware/auth.ts',
      'src/models/index.ts',
      'tests/api.test.ts',
      'docker-compose.yml',
      'Dockerfile'
    ],
    'python-data': [
      'requirements.txt',
      'pyproject.toml',
      'src/__init__.py',
      'src/data_processing.py',
      'notebooks/exploration.ipynb',
      'tests/test_processing.py',
      'data/.gitkeep'
    ]
  };

  return [...commonFiles, ...(patternFiles[pattern] || [])];
}

async function showPatternInstructions(pattern, targetPath, config) {
  const instructions = {
    'web-react': [
      'cd ' + path.relative(process.cwd(), targetPath),
      'npm install',
      'npm run dev',
      'Open http://localhost:5173 in your browser'
    ],
    'nodejs-api': [
      'cd ' + path.relative(process.cwd(), targetPath),
      'npm install',
      'npm run dev',
      'API will be available at http://localhost:3000'
    ],
    'python-data': [
      'cd ' + path.relative(process.cwd(), targetPath),
      'pip install -r requirements.txt',
      'jupyter notebook',
      'Open notebooks/exploration.ipynb to get started'
    ]
  };

  const steps = instructions[pattern];
  if (steps) {
    console.log(chalk.bold('\n🚀 Getting Started:'));
    steps.forEach((step, index) => {
      console.log(`  ${chalk.yellow(index + 1)}. ${chalk.gray(step)}`);
    });
  }

  console.log(chalk.bold('\n💡 Pro Tips:'));
  console.log(`  ${chalk.blue('•')} Run ${chalk.cyan('awe init')} to customize your CLAUDE.md`);
  console.log(`  ${chalk.blue('•')} Use ${chalk.cyan('awe analyze')} to get optimization suggestions`);
  console.log(`  ${chalk.blue('•')} Deploy agents with ${chalk.cyan('awe agent deploy code-reviewer')}`);
}

module.exports = scaffoldCommand;