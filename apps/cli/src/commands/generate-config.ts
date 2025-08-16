import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseCommand } from './base'
import { IntelligentConfigGenerator } from '@awe/ai'

interface GenerateConfigOptions {
  tools?: string[]
  force?: boolean
  dryRun?: boolean
  interactive?: boolean
  output?: string
}

export class GenerateConfigCommand extends BaseCommand {
  private generator: IntelligentConfigGenerator

  constructor() {
    super()
    this.generator = new IntelligentConfigGenerator()
  }

  getCommand(): Command {
    const command = new Command('generate-config')
      .alias('genconfig')
      .description('🔧 Generate intelligent configuration files for your project')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('-t, --tools <tools...>', 'Specific tools to generate configs for')
      .option('-f, --force', 'Overwrite existing configuration files')
      .option('-d, --dry-run', 'Preview configurations without writing files')
      .option('-i, --interactive', 'Interactive mode to select configurations')
      .option('-o, --output <dir>', 'Output directory for configurations')
      .action(async (directory: string, options: GenerateConfigOptions) => {
        await this.execute(directory, options)
      })

    // Add subcommands
    command
      .command('eslint')
      .description('Generate ESLint configuration')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('-f, --force', 'Overwrite existing configuration')
      .action(async (directory: string, options: { force?: boolean }) => {
        await this.generateSpecificConfig(directory, 'eslint', options)
      })

    command
      .command('testing')
      .description('Generate testing configuration (Jest/Vitest)')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('-f, --framework <framework>', 'Testing framework (jest/vitest)')
      .option('--force', 'Overwrite existing configuration')
      .action(async (directory: string, options: { framework?: string; force?: boolean }) => {
        const tools = options.framework ? [options.framework] : ['jest', 'vitest']
        await this.generateSpecificConfig(directory, tools, { force: options.force })
      })

    command
      .command('ci')
      .description('Generate CI/CD configuration (GitHub Actions)')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('--force', 'Overwrite existing configuration')
      .action(async (directory: string, options: { force?: boolean }) => {
        await this.generateSpecificConfig(directory, 'github-actions', options)
      })

    command
      .command('typescript')
      .description('Generate TypeScript configuration')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('--force', 'Overwrite existing configuration')
      .action(async (directory: string, options: { force?: boolean }) => {
        await this.generateSpecificConfig(directory, 'typescript', options)
      })

    command
      .command('prettier')
      .description('Generate Prettier configuration')
      .argument('[directory]', 'Directory to analyze', process.cwd())
      .option('--force', 'Overwrite existing configuration')
      .action(async (directory: string, options: { force?: boolean }) => {
        await this.generateSpecificConfig(directory, 'prettier', options)
      })

    return command
  }

  private async execute(directory: string, options: GenerateConfigOptions): Promise<void> {
    const spinner = ora('Initializing configuration generator...').start()

    try {
      // Validate directory
      const stats = await fs.stat(directory)
      if (!stats.isDirectory()) {
        spinner.fail(chalk.red('Invalid directory path'))
        process.exit(1)
      }

      spinner.text = 'Analyzing project structure and patterns...'

      // Generate configurations
      let configs = await this.generator.generateConfigurations(directory, {
        tools: options.tools,
        force: options.force,
        dryRun: true, // Always dry run first for preview
        interactive: options.interactive,
      })

      spinner.succeed(chalk.green('Analysis complete!'))

      if (configs.length === 0) {
        console.log(chalk.yellow('\n⚠️  No configurations recommended for this project'))
        console.log(chalk.gray('All necessary configurations may already be present'))
        return
      }

      // Interactive mode - let user select configs
      if (options.interactive) {
        const choices = configs.map(config => ({
          name: `${config.tool} (${config.filename}) - ${Math.round(config.confidence * 100)}% confidence`,
          value: config,
          checked: config.confidence > 0.7,
        }))

        const { selectedConfigs } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedConfigs',
            message: 'Select configurations to generate:',
            choices,
          },
        ])

        configs = selectedConfigs
      }

      // Display configurations
      this.displayConfigurations(configs, options.dryRun)

      // Write files if not dry run
      if (!options.dryRun) {
        await this.writeConfigurations(directory, configs, options)
      } else {
        console.log(chalk.yellow('\n⚠️  Dry run mode - no files were written'))
        console.log(chalk.gray('Remove --dry-run flag to generate files'))
      }

    } catch (error) {
      spinner.fail(chalk.red('Configuration generation failed'))
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async generateSpecificConfig(
    directory: string,
    tools: string | string[],
    options: { force?: boolean }
  ): Promise<void> {
    const toolsArray = Array.isArray(tools) ? tools : [tools]
    const toolName = toolsArray[0]
    const spinner = ora(`Generating ${toolName} configuration...`).start()
    
    try {
      const configs = await this.generator.generateConfigurations(directory, {
        tools: toolsArray,
        force: options.force,
      })

      if (configs.length > 0) {
        const config = configs[0]
        spinner.succeed(chalk.green(`${config.tool} configuration generated!`))
        console.log(chalk.blue(`\nCreated: ${config.filename}`))
        
        this.showNextSteps(config.tool)
      } else {
        spinner.warn(chalk.yellow(`${toolName} configuration already exists or not recommended`))
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to generate ${toolName} configuration`))
      console.error(error)
      process.exit(1)
    }
  }

  private displayConfigurations(configs: any[], dryRun?: boolean): void {
    console.log(chalk.cyan('\n📋 Configuration Generation Report:\n'))
    
    for (const config of configs) {
      const confidence = Math.round(config.confidence * 100)
      const color = confidence > 80 ? chalk.green : confidence > 60 ? chalk.yellow : chalk.red
      
      console.log(chalk.bold(`${config.tool.toUpperCase()}`))
      console.log(`  File: ${chalk.blue(config.filename)}`)
      console.log(`  Confidence: ${color(`${confidence}%`)}`)
      
      if (config.reasoning.length > 0) {
        console.log(chalk.gray('  Reasoning:'))
        for (const reason of config.reasoning) {
          console.log(chalk.gray(`    • ${reason}`))
        }
      }

      if (config.warnings && config.warnings.length > 0) {
        console.log(chalk.yellow('  ⚠️  Warnings:'))
        for (const warning of config.warnings) {
          console.log(chalk.yellow(`    • ${warning}`))
        }
      }

      // Show preview if dry run
      if (dryRun) {
        console.log(chalk.gray('\n  Preview:'))
        const preview = config.content.split('\n').slice(0, 10)
        for (const line of preview) {
          console.log(chalk.gray(`    ${line}`))
        }
        if (config.content.split('\n').length > 10) {
          console.log(chalk.gray('    ...'))
        }
      }

      console.log('')
    }
  }

  private async writeConfigurations(
    directory: string,
    configs: any[],
    options: GenerateConfigOptions
  ): Promise<void> {
    const outputDir = options.output || directory
    
    // Confirm before writing
    if (!options.force) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Generate ${configs.length} configuration file(s)?`,
          default: true,
        },
      ])

      if (!proceed) {
        console.log(chalk.yellow('Configuration generation cancelled'))
        return
      }
    }

    const spinner = ora('Writing configuration files...').start()

    for (const config of configs) {
      const configPath = path.join(outputDir, config.filename)
      const configDir = path.dirname(configPath)

      // Create directory if needed
      await fs.mkdir(configDir, { recursive: true })

      // Check if file exists
      let shouldWrite = true
      try {
        await fs.access(configPath)
        if (!options.force) {
          spinner.stop()
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `${config.filename} already exists. Overwrite?`,
              default: false,
            },
          ])
          shouldWrite = overwrite
          spinner.start('Writing configuration files...')
        }
      } catch {
        // File doesn't exist, proceed
      }

      if (shouldWrite) {
        await fs.writeFile(configPath, config.content, 'utf-8')
        spinner.text = `Created ${config.filename}`
      }
    }

    spinner.succeed(chalk.green('Configuration files generated successfully!'))

    // Show next steps for all generated configs
    console.log(chalk.cyan('\n🚀 Next Steps:'))
    
    const uniqueTools = [...new Set(configs.map(c => c.tool))]
    for (const tool of uniqueTools) {
      this.showNextSteps(tool)
    }

    console.log(chalk.green('\n✅ Your project is now configured with best practices!'))
  }

  private showNextSteps(tool: string): void {
    switch (tool) {
      case 'eslint':
        console.log(chalk.yellow('\nInstall ESLint dependencies:'))
        console.log(chalk.gray('  npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin'))
        console.log(chalk.yellow('Run ESLint:'))
        console.log(chalk.gray('  npx eslint src'))
        break
      
      case 'prettier':
        console.log(chalk.yellow('\nInstall Prettier:'))
        console.log(chalk.gray('  npm install --save-dev prettier'))
        console.log(chalk.yellow('Format code:'))
        console.log(chalk.gray('  npx prettier --write .'))
        break
      
      case 'jest':
        console.log(chalk.yellow('\nInstall Jest dependencies:'))
        console.log(chalk.gray('  npm install --save-dev jest ts-jest @types/jest'))
        console.log(chalk.yellow('Add to package.json scripts:'))
        console.log(chalk.gray('  "test": "jest"'))
        break
      
      case 'vitest':
        console.log(chalk.yellow('\nInstall Vitest:'))
        console.log(chalk.gray('  npm install --save-dev vitest @vitest/ui'))
        console.log(chalk.yellow('Add to package.json scripts:'))
        console.log(chalk.gray('  "test": "vitest"'))
        break
      
      case 'husky':
        console.log(chalk.yellow('\nInstall and initialize Husky:'))
        console.log(chalk.gray('  npm install --save-dev husky'))
        console.log(chalk.gray('  npx husky install'))
        break
      
      case 'commitlint':
        console.log(chalk.yellow('\nInstall Commitlint:'))
        console.log(chalk.gray('  npm install --save-dev @commitlint/cli @commitlint/config-conventional'))
        break
      
      case 'github-actions':
        console.log(chalk.yellow('\nGitHub Actions workflow configured!'))
        console.log(chalk.gray('  • Runs on push to main/develop'))
        console.log(chalk.gray('  • Runs on pull requests to main'))
        console.log(chalk.gray('  • Ensure test/build scripts are defined in package.json'))
        break
      
      case 'typescript':
        console.log(chalk.yellow('\nTypeScript configured!'))
        console.log(chalk.gray('  • Run: npx tsc --noEmit to check types'))
        console.log(chalk.gray('  • Add build script to package.json'))
        break
    }
  }
}

// Export for standalone use
export const generateConfigCommand = new GenerateConfigCommand().getCommand()