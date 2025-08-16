import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseCommand } from './base'
import { HookManager, HookType, HookTrigger, HookConfig, HookResult } from '@awe/ai'

interface HooksOptions {
  config?: string
  type?: string
  enabled?: boolean
  all?: boolean
}

export class HooksCommand extends BaseCommand {
  private manager: HookManager

  constructor() {
    super()
    this.manager = new HookManager()
  }

  getCommand(): Command {
    const command = new Command('hooks')
      .alias('hook')
      .description('🪝 Manage lifecycle hooks for AWE operations')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (options: HooksOptions) => {
        await this.listHooks(options)
      })

    // List hooks
    command
      .command('list')
      .description('List all configured hooks')
      .option('-t, --type <type>', 'Filter by hook type')
      .option('-e, --enabled', 'Show only enabled hooks')
      .option('-d, --disabled', 'Show only disabled hooks')
      .action(async (options: HooksOptions) => {
        await this.listHooks(options)
      })

    // Add hook
    command
      .command('add')
      .description('Add a new hook')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (options: HooksOptions) => {
        await this.addHook(options)
      })

    // Remove hook
    command
      .command('remove <id>')
      .description('Remove a hook by ID')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (id: string, options: HooksOptions) => {
        await this.removeHook(id, options)
      })

    // Enable/disable hook
    command
      .command('enable <id>')
      .description('Enable a hook')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (id: string, options: HooksOptions) => {
        await this.toggleHook(id, true, options)
      })

    command
      .command('disable <id>')
      .description('Disable a hook')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (id: string, options: HooksOptions) => {
        await this.toggleHook(id, false, options)
      })

    // Run hook
    command
      .command('run <id>')
      .description('Manually run a specific hook')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .action(async (id: string, options: HooksOptions) => {
        await this.runHook(id, options)
      })

    // Test hooks
    command
      .command('test')
      .description('Test all hooks or hooks of a specific type')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .option('-t, --type <type>', 'Test hooks of specific type')
      .action(async (options: HooksOptions) => {
        await this.testHooks(options)
      })

    // Init hooks
    command
      .command('init')
      .description('Initialize default hooks configuration')
      .option('-c, --config <path>', 'Path to hooks configuration file', '.awe/hooks.json')
      .option('-f, --force', 'Overwrite existing configuration')
      .action(async (options: HooksOptions & { force?: boolean }) => {
        await this.initHooks(options)
      })

    return command
  }

  private async listHooks(options: HooksOptions): Promise<void> {
    const spinner = ora('Loading hooks configuration...').start()

    try {
      // Load configuration
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      try {
        await this.manager.loadConfig(configPath)
      } catch {
        spinner.warn(chalk.yellow('No hooks configuration found'))
        console.log(chalk.gray(`\nRun ${chalk.cyan('awe hooks init')} to create default hooks`))
        return
      }

      spinner.succeed('Hooks loaded')

      const registry = this.manager.getRegistry()
      let hooks = registry.getAll()

      // Apply filters
      if (options.type) {
        hooks = hooks.filter(h => h.type === options.type)
      }
      if (options.enabled === true) {
        hooks = hooks.filter(h => h.enabled)
      }
      if (options.enabled === false) {
        hooks = hooks.filter(h => !h.enabled)
      }

      if (hooks.length === 0) {
        console.log(chalk.yellow('\nNo hooks found matching criteria'))
        return
      }

      // Display hooks
      console.log(chalk.cyan(`\n📋 Configured Hooks (${hooks.length}):\n`))

      for (const hook of hooks) {
        const status = hook.enabled ? chalk.green('✓') : chalk.red('✗')
        const trigger = hook.trigger === HookTrigger.ALWAYS ? '' : chalk.gray(` [${hook.trigger}]`)
        
        console.log(`${status} ${chalk.bold(hook.name)} (${hook.id})`)
        console.log(`  Type: ${chalk.blue(hook.type)}${trigger}`)
        
        if (hook.description) {
          console.log(`  ${chalk.gray(hook.description)}`)
        }
        
        if (hook.command) {
          console.log(`  Command: ${chalk.gray(hook.command)}`)
        } else if (hook.script) {
          console.log(`  Script: ${chalk.gray(hook.script)}`)
        } else if (hook.module) {
          console.log(`  Module: ${chalk.gray(hook.module)}::${hook.function}`)
        }
        
        console.log()
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to load hooks'))
      console.error(error)
      process.exit(1)
    }
  }

  private async addHook(options: HooksOptions): Promise<void> {
    try {
      // Interactive prompt for hook details
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Hook ID (unique identifier):',
          validate: (input) => input.length > 0
        },
        {
          type: 'input',
          name: 'name',
          message: 'Hook name:',
          validate: (input) => input.length > 0
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):'
        },
        {
          type: 'list',
          name: 'type',
          message: 'Hook type:',
          choices: Object.values(HookType)
        },
        {
          type: 'list',
          name: 'trigger',
          message: 'Trigger condition:',
          choices: Object.values(HookTrigger),
          default: HookTrigger.ALWAYS
        },
        {
          type: 'list',
          name: 'executionType',
          message: 'Execution type:',
          choices: ['command', 'script', 'module']
        }
      ])

      // Get execution details based on type
      let executionDetails: any = {}
      
      if (answers.executionType === 'command') {
        const cmdAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: 'Command to execute:',
            validate: (input) => input.length > 0
          },
          {
            type: 'input',
            name: 'args',
            message: 'Arguments (space-separated, optional):'
          }
        ])
        executionDetails.command = cmdAnswers.command
        if (cmdAnswers.args) {
          executionDetails.args = cmdAnswers.args.split(' ').filter(Boolean)
        }
      } else if (answers.executionType === 'script') {
        const scriptAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'script',
            message: 'Script path:',
            validate: (input) => input.length > 0
          }
        ])
        executionDetails.script = scriptAnswers.script
      } else if (answers.executionType === 'module') {
        const moduleAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'module',
            message: 'Module path:',
            validate: (input) => input.length > 0
          },
          {
            type: 'input',
            name: 'function',
            message: 'Function name:',
            validate: (input) => input.length > 0
          }
        ])
        executionDetails.module = moduleAnswers.module
        executionDetails.function = moduleAnswers.function
      }

      // Additional options
      const additionalAnswers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable hook?',
          default: true
        },
        {
          type: 'number',
          name: 'timeout',
          message: 'Timeout (ms):',
          default: 30000
        },
        {
          type: 'number',
          name: 'retries',
          message: 'Number of retries:',
          default: 0
        },
        {
          type: 'confirm',
          name: 'continueOnError',
          message: 'Continue on error?',
          default: false
        }
      ])

      // Create hook configuration
      const hook: HookConfig = {
        id: answers.id,
        name: answers.name,
        description: answers.description || undefined,
        type: answers.type,
        trigger: answers.trigger,
        enabled: additionalAnswers.enabled,
        timeout: additionalAnswers.timeout,
        retries: additionalAnswers.retries,
        continueOnError: additionalAnswers.continueOnError,
        ...executionDetails
      }

      // Load existing configuration
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      try {
        await this.manager.loadConfig(configPath)
      } catch {
        // No existing config
      }

      // Register hook
      this.manager.register(hook)

      // Save configuration
      await this.ensureConfigDir(configPath)
      await this.manager.saveConfig(configPath)

      console.log(chalk.green(`\n✅ Hook "${hook.name}" added successfully!`))

    } catch (error) {
      console.error(chalk.red('Failed to add hook:'), error)
      process.exit(1)
    }
  }

  private async removeHook(id: string, options: HooksOptions): Promise<void> {
    const spinner = ora('Removing hook...').start()

    try {
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      // Load configuration
      await this.manager.loadConfig(configPath)
      
      // Remove hook
      const registry = this.manager.getRegistry()
      const hook = registry.get(id)
      
      if (!hook) {
        spinner.fail(chalk.red(`Hook "${id}" not found`))
        return
      }

      // Confirm removal
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Remove hook "${hook.name}"?`,
          default: false
        }
      ])

      if (!confirm) {
        spinner.warn('Removal cancelled')
        return
      }

      registry.unregister(id)
      
      // Save configuration
      await this.manager.saveConfig(configPath)
      
      spinner.succeed(chalk.green(`Hook "${hook.name}" removed`))

    } catch (error) {
      spinner.fail(chalk.red('Failed to remove hook'))
      console.error(error)
      process.exit(1)
    }
  }

  private async toggleHook(id: string, enabled: boolean, options: HooksOptions): Promise<void> {
    const spinner = ora(`${enabled ? 'Enabling' : 'Disabling'} hook...`).start()

    try {
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      // Load configuration
      await this.manager.loadConfig(configPath)
      
      // Get hook
      const registry = this.manager.getRegistry()
      const hook = registry.get(id)
      
      if (!hook) {
        spinner.fail(chalk.red(`Hook "${id}" not found`))
        return
      }

      // Update hook
      hook.enabled = enabled
      registry.register(hook)
      
      // Save configuration
      await this.manager.saveConfig(configPath)
      
      spinner.succeed(chalk.green(`Hook "${hook.name}" ${enabled ? 'enabled' : 'disabled'}`))

    } catch (error) {
      spinner.fail(chalk.red('Failed to update hook'))
      console.error(error)
      process.exit(1)
    }
  }

  private async runHook(id: string, options: HooksOptions): Promise<void> {
    const spinner = ora('Running hook...').start()

    try {
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      // Load configuration
      await this.manager.loadConfig(configPath)
      
      // Get hook
      const registry = this.manager.getRegistry()
      const hook = registry.get(id)
      
      if (!hook) {
        spinner.fail(chalk.red(`Hook "${id}" not found`))
        return
      }

      spinner.text = `Running "${hook.name}"...`

      // Execute hook
      const executor = this.manager.getExecutor()
      const result = await executor.executeHook(hook, {
        projectPath: process.cwd()
      })

      if (result.success) {
        spinner.succeed(chalk.green(`Hook "${hook.name}" executed successfully`))
        
        if (result.output) {
          console.log(chalk.gray('\nOutput:'))
          console.log(result.output)
        }
        
        console.log(chalk.gray(`Duration: ${result.duration}ms`))
      } else {
        spinner.fail(chalk.red(`Hook "${hook.name}" failed`))
        
        if (result.error) {
          console.error(chalk.red('\nError:'))
          console.error(result.error)
        }
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to run hook'))
      console.error(error)
      process.exit(1)
    }
  }

  private async testHooks(options: HooksOptions): Promise<void> {
    const spinner = ora('Testing hooks...').start()

    try {
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      // Load configuration
      await this.manager.loadConfig(configPath)
      
      const registry = this.manager.getRegistry()
      let hooks = registry.getAll()

      // Filter by type if specified
      if (options.type) {
        hooks = hooks.filter(h => h.type === options.type)
      }

      if (hooks.length === 0) {
        spinner.warn(chalk.yellow('No hooks to test'))
        return
      }

      spinner.succeed(`Testing ${hooks.length} hook(s)`)

      const executor = this.manager.getExecutor()
      const results: HookResult[] = []

      // Test each hook
      for (const hook of hooks) {
        const testSpinner = ora(`Testing "${hook.name}"...`).start()
        
        try {
          const result = await executor.executeHook(hook, {
            projectPath: process.cwd()
          })
          
          results.push(result)
          
          if (result.skipped) {
            testSpinner.warn(chalk.yellow(`Skipped: ${result.skipReason}`))
          } else if (result.success) {
            testSpinner.succeed(chalk.green(`✓ ${hook.name}`))
          } else {
            testSpinner.fail(chalk.red(`✗ ${hook.name}: ${result.error}`))
          }
        } catch (error) {
          testSpinner.fail(chalk.red(`✗ ${hook.name}: ${error}`))
        }
      }

      // Summary
      const successful = results.filter(r => r.success && !r.skipped).length
      const failed = results.filter(r => !r.success && !r.skipped).length
      const skipped = results.filter(r => r.skipped).length

      console.log(chalk.cyan('\n📊 Test Summary:'))
      console.log(chalk.green(`  ✓ ${successful} passed`))
      if (failed > 0) {
        console.log(chalk.red(`  ✗ ${failed} failed`))
      }
      if (skipped > 0) {
        console.log(chalk.yellow(`  ⊘ ${skipped} skipped`))
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to test hooks'))
      console.error(error)
      process.exit(1)
    }
  }

  private async initHooks(options: HooksOptions & { force?: boolean }): Promise<void> {
    const spinner = ora('Initializing hooks configuration...').start()

    try {
      const configPath = path.resolve(options.config || '.awe/hooks.json')
      
      // Check if configuration already exists
      try {
        await fs.access(configPath)
        if (!options.force) {
          spinner.warn(chalk.yellow('Hooks configuration already exists'))
          console.log(chalk.gray(`Use --force to overwrite`))
          return
        }
      } catch {
        // File doesn't exist, proceed
      }

      // Create default hooks
      const defaultHooks = this.manager.createDefaultHooks()
      
      // Register hooks
      for (const hook of defaultHooks) {
        this.manager.register(hook)
      }

      // Save configuration
      await this.ensureConfigDir(configPath)
      await this.manager.saveConfig(configPath)

      spinner.succeed(chalk.green('Hooks configuration initialized'))
      console.log(chalk.gray(`\nCreated: ${configPath}`))
      console.log(chalk.gray(`Added ${defaultHooks.length} default hooks`))
      console.log(chalk.cyan('\nRun "awe hooks list" to view configured hooks'))

    } catch (error) {
      spinner.fail(chalk.red('Failed to initialize hooks'))
      console.error(error)
      process.exit(1)
    }
  }

  private async ensureConfigDir(configPath: string): Promise<void> {
    const dir = path.dirname(configPath)
    await fs.mkdir(dir, { recursive: true })
  }
}

// Export for standalone use
export const hooksCommand = new HooksCommand().getCommand()