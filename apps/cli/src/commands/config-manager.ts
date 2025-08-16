/**
 * Configuration Management Command
 * 
 * CLI interface for managing AWE configuration
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseCommand } from './base'
import { createCLIConfig, type AWEConfig } from '@awe/config'
import Table from 'cli-table3'
import * as yaml from 'js-yaml'

interface ConfigOptions {
  format?: 'json' | 'yaml' | 'table'
  output?: string
  watch?: boolean
  validate?: boolean
}

export class ConfigManagerCommand extends BaseCommand {
  private configManager = createCLIConfig()
  
  getCommand(): Command {
    const command = new Command('configmgr')
      .aliases(['cm', 'cfg'])
      .description('🔧 Advanced configuration management for AWE')
      .option('-f, --format <type>', 'Output format (json, yaml, table)', 'table')
      .option('-o, --output <file>', 'Save output to file')
      .option('-w, --watch', 'Watch for configuration changes')
      .option('--validate', 'Validate configuration')
      .action(async (options: ConfigOptions) => {
        await this.showConfig(options)
      })

    // Get configuration value
    command
      .command('get <path>')
      .description('Get a configuration value')
      .option('-f, --format <type>', 'Output format', 'json')
      .action(async (path: string, options: any) => {
        await this.getConfig(path, options)
      })

    // Set configuration value
    command
      .command('set <path> <value>')
      .description('Set a configuration value')
      .action(async (path: string, value: string) => {
        await this.setConfig(path, value)
      })

    // List configuration sections
    command
      .command('list')
      .description('List all configuration sections')
      .action(async () => {
        await this.listSections()
      })

    // Export configuration
    command
      .command('export')
      .description('Export configuration to file')
      .option('-f, --format <type>', 'Export format (json, yaml)', 'json')
      .option('-o, --output <file>', 'Output file (required)')
      .action(async (options: any) => {
        await this.exportConfig(options)
      })

    // Import configuration
    command
      .command('import <file>')
      .description('Import configuration from file')
      .option('--merge', 'Merge with existing configuration')
      .action(async (file: string, options: any) => {
        await this.importConfig(file, options)
      })

    // Validate configuration
    command
      .command('validate')
      .description('Validate current configuration')
      .action(async () => {
        await this.validateConfig()
      })

    // Reset configuration
    command
      .command('reset')
      .description('Reset configuration to defaults')
      .option('--confirm', 'Skip confirmation prompt')
      .action(async (options: any) => {
        await this.resetConfig(options)
      })

    // Environment-specific commands
    command
      .command('env')
      .description('Show current environment')
      .action(async () => {
        await this.showEnvironment()
      })

    // Feature flags management
    command
      .command('feature <action> [flag]')
      .description('Manage feature flags (list, enable, disable, toggle)')
      .action(async (action: string, flag?: string) => {
        await this.manageFeatures(action, flag)
      })

    // Interactive configuration
    command
      .command('interactive')
      .alias('i')
      .description('Interactive configuration editor')
      .action(async () => {
        await this.interactiveConfig()
      })

    return command
  }

  private async showConfig(options: ConfigOptions): Promise<void> {
    const spinner = ora('Loading configuration...').start()

    try {
      await this.configManager.initialize()
      const config = this.configManager.get()

      spinner.succeed('Configuration loaded')

      // Format output
      let output: string

      switch (options.format) {
        case 'yaml':
          output = yaml.dump(config)
          break
        case 'table':
          output = this.formatAsTable(config)
          break
        case 'json':
        default:
          output = JSON.stringify(config, null, 2)
          break
      }

      // Save to file or display
      if (options.output) {
        await fs.writeFile(options.output, output, 'utf-8')
        console.log(chalk.green(`✅ Configuration saved to ${options.output}`))
      } else {
        console.log(output)
      }

      // Watch for changes
      if (options.watch) {
        console.log(chalk.cyan('\n👀 Watching for configuration changes... (Ctrl+C to exit)'))
        
        this.configManager.on('change', (event) => {
          console.log(chalk.yellow(`\n⚡ Configuration changed: ${event.path}`))
          console.log(`  Old: ${JSON.stringify(event.oldValue)}`)
          console.log(`  New: ${JSON.stringify(event.newValue)}`)
        })

        // Keep process alive
        process.stdin.resume()
      }

    } catch (error) {
      spinner.fail('Failed to load configuration')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async getConfig(path: string, options: any): Promise<void> {
    try {
      await this.configManager.initialize()
      const value = this.configManager.get(path)

      if (value === undefined) {
        console.log(chalk.yellow(`No value found for path: ${path}`))
        return
      }

      const output = options.format === 'json' 
        ? JSON.stringify(value, null, 2)
        : yaml.dump(value)

      console.log(output)
    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async setConfig(path: string, value: string): Promise<void> {
    const spinner = ora(`Setting ${path}...`).start()

    try {
      await this.configManager.initialize()

      // Parse value
      let parsedValue: any = value

      // Try to parse as JSON
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          parsedValue = JSON.parse(value)
        } catch {
          // Not JSON, use as string
        }
      } else if (value === 'true') {
        parsedValue = true
      } else if (value === 'false') {
        parsedValue = false
      } else if (!isNaN(Number(value))) {
        parsedValue = Number(value)
      }

      await this.configManager.set(path, parsedValue)
      spinner.succeed(chalk.green(`✅ Set ${path} = ${JSON.stringify(parsedValue)}`))

    } catch (error) {
      spinner.fail('Failed to set configuration')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async listSections(): Promise<void> {
    try {
      await this.configManager.initialize()
      const config = this.configManager.get()

      const table = new Table({
        head: [chalk.cyan('Section'), chalk.cyan('Description')],
        style: { head: [] }
      })

      const sections = [
        { key: 'app', desc: 'Application settings' },
        { key: 'database', desc: 'Database configuration' },
        { key: 'api', desc: 'API server settings' },
        { key: 'auth', desc: 'Authentication configuration' },
        { key: 'features', desc: 'Feature flags' },
        { key: 'cache', desc: 'Caching configuration' },
        { key: 'queue', desc: 'Queue and job processing' },
        { key: 'storage', desc: 'File storage settings' },
        { key: 'email', desc: 'Email service configuration' },
        { key: 'scraper', desc: 'Web scraping settings' },
        { key: 'knowledge', desc: 'Knowledge base configuration' },
      ]

      for (const section of sections) {
        const hasConfig = section.key in config
        table.push([
          hasConfig ? chalk.green(section.key) : chalk.gray(section.key),
          section.desc
        ])
      }

      console.log(table.toString())
    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async exportConfig(options: any): Promise<void> {
    if (!options.output) {
      console.error(chalk.red('Error: Output file is required'))
      process.exit(1)
    }

    const spinner = ora('Exporting configuration...').start()

    try {
      await this.configManager.initialize()
      const config = this.configManager.get()

      const output = options.format === 'yaml'
        ? yaml.dump(config)
        : JSON.stringify(config, null, 2)

      await fs.writeFile(options.output, output, 'utf-8')
      spinner.succeed(chalk.green(`✅ Configuration exported to ${options.output}`))

    } catch (error) {
      spinner.fail('Export failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async importConfig(file: string, options: any): Promise<void> {
    const spinner = ora('Importing configuration...').start()

    try {
      const content = await fs.readFile(file, 'utf-8')
      const ext = path.extname(file).toLowerCase()

      let config: any
      if (ext === '.yaml' || ext === '.yml') {
        config = yaml.load(content)
      } else {
        config = JSON.parse(content)
      }

      await this.configManager.initialize()
      await this.configManager.import(config, ext === '.yaml' ? 'yaml' : 'json')

      spinner.succeed(chalk.green('✅ Configuration imported successfully'))

    } catch (error) {
      spinner.fail('Import failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async validateConfig(): Promise<void> {
    const spinner = ora('Validating configuration...').start()

    try {
      await this.configManager.initialize()
      const isValid = await this.configManager.validateConfiguration()

      if (isValid) {
        spinner.succeed(chalk.green('✅ Configuration is valid'))
      } else {
        spinner.fail(chalk.red('❌ Configuration validation failed'))
        process.exit(1)
      }

    } catch (error) {
      spinner.fail('Validation failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async resetConfig(options: any): Promise<void> {
    if (!options.confirm) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset configuration to defaults?',
          default: false
        }
      ])

      if (!confirm) {
        console.log(chalk.yellow('Reset cancelled'))
        return
      }
    }

    const spinner = ora('Resetting configuration...').start()

    try {
      const { resetConfigManager } = await import('@awe/config')
      resetConfigManager()
      
      // Reinitialize with defaults
      this.configManager = createCLIConfig()
      await this.configManager.initialize()

      spinner.succeed(chalk.green('✅ Configuration reset to defaults'))

    } catch (error) {
      spinner.fail('Reset failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async showEnvironment(): Promise<void> {
    try {
      await this.configManager.initialize()
      const env = this.configManager.getEnvironment()
      const isDev = this.configManager.isDevelopment()
      const isProd = this.configManager.isProduction()

      console.log(chalk.cyan('\n🌍 Environment Information\n'))
      console.log(`Current: ${chalk.bold(env)}`)
      console.log(`Development: ${isDev ? chalk.green('Yes') : chalk.gray('No')}`)
      console.log(`Production: ${isProd ? chalk.red('Yes') : chalk.gray('No')}`)
      
      if (isProd) {
        console.log(chalk.yellow('\n⚠️  Production mode - Some operations are restricted'))
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async manageFeatures(action: string, flag?: string): Promise<void> {
    try {
      await this.configManager.initialize()

      switch (action) {
        case 'list':
          await this.listFeatures()
          break
        
        case 'enable':
          if (!flag) {
            console.error(chalk.red('Error: Feature flag name required'))
            process.exit(1)
          }
          await this.configManager.set(`features.flags.${flag}`, true)
          console.log(chalk.green(`✅ Enabled feature: ${flag}`))
          break
        
        case 'disable':
          if (!flag) {
            console.error(chalk.red('Error: Feature flag name required'))
            process.exit(1)
          }
          await this.configManager.set(`features.flags.${flag}`, false)
          console.log(chalk.yellow(`⚠️  Disabled feature: ${flag}`))
          break
        
        case 'toggle':
          if (!flag) {
            console.error(chalk.red('Error: Feature flag name required'))
            process.exit(1)
          }
          const current = this.configManager.isFeatureEnabled(flag)
          await this.configManager.set(`features.flags.${flag}`, !current)
          console.log(chalk.cyan(`🔄 Toggled feature: ${flag} → ${!current}`))
          break
        
        default:
          console.error(chalk.red(`Unknown action: ${action}`))
          console.log('Available actions: list, enable, disable, toggle')
          process.exit(1)
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async listFeatures(): Promise<void> {
    const features = this.configManager.getFeatures()
    const flags = features.flags || {}

    const table = new Table({
      head: [chalk.cyan('Feature'), chalk.cyan('Status')],
      style: { head: [] }
    })

    for (const [key, value] of Object.entries(flags)) {
      table.push([
        key,
        value ? chalk.green('Enabled') : chalk.gray('Disabled')
      ])
    }

    if (Object.keys(flags).length === 0) {
      console.log(chalk.yellow('No feature flags configured'))
    } else {
      console.log(table.toString())
    }
  }

  private async interactiveConfig(): Promise<void> {
    try {
      await this.configManager.initialize()

      const { section } = await inquirer.prompt([
        {
          type: 'list',
          name: 'section',
          message: 'Select configuration section:',
          choices: [
            { name: 'Application Settings', value: 'app' },
            { name: 'Scraper Configuration', value: 'scraper' },
            { name: 'Knowledge Base', value: 'knowledge' },
            { name: 'API Settings', value: 'api' },
            { name: 'Authentication', value: 'auth' },
            { name: 'Feature Flags', value: 'features' },
            new inquirer.Separator(),
            { name: 'Export Configuration', value: 'export' },
            { name: 'Import Configuration', value: 'import' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ])

      if (section === 'exit') {
        return
      }

      if (section === 'export') {
        const { format, file } = await inquirer.prompt([
          {
            type: 'list',
            name: 'format',
            message: 'Export format:',
            choices: ['json', 'yaml']
          },
          {
            type: 'input',
            name: 'file',
            message: 'Output file:',
            default: `awe-config.json`
          }
        ])

        await this.exportConfig({ output: file, format })
        return
      }

      if (section === 'import') {
        const { file } = await inquirer.prompt([
          {
            type: 'input',
            name: 'file',
            message: 'Import file:',
            validate: async (input) => {
              try {
                await fs.access(input)
                return true
              } catch {
                return 'File not found'
              }
            }
          }
        ])

        await this.importConfig(file, {})
        return
      }

      // Section-specific configuration
      await this.configureSection(section)

    } catch (error) {
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  }

  private async configureSection(section: string): Promise<void> {
    // This would be expanded with section-specific prompts
    console.log(chalk.cyan(`\nConfiguring ${section}...`))
    console.log(chalk.gray('Interactive configuration for this section is coming soon!'))
  }

  private formatAsTable(config: any): string {
    const table = new Table({
      head: [chalk.cyan('Path'), chalk.cyan('Value')],
      style: { head: [] },
      wordWrap: true,
      colWidths: [40, 40]
    })

    const flattenConfig = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenConfig(value, path)
        } else {
          const displayValue = typeof value === 'string' && value.length > 37
            ? value.substring(0, 34) + '...'
            : JSON.stringify(value)
          
          table.push([path, displayValue])
        }
      }
    }

    flattenConfig(config)
    return table.toString()
  }
}

// Export for standalone use
export const configManagerCommand = new ConfigManagerCommand().getCommand()