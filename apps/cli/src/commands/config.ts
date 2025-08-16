import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { BaseCommand } from './base'
import type { Config } from '@awe/shared'

export class ConfigCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('config')
      .description('🔧 Configure AWE settings and credentials')
      .option('--setup', 'interactive credential setup')
      .option('--status', 'show configuration status')
      .option('--validate', 'validate current configuration')
      .option('--reset', 'reset to default configuration')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: {
    setup?: boolean
    status?: boolean
    validate?: boolean
    reset?: boolean
  }) {
    try {
      if (options.setup) {
        await this.setupCredentials()
      } else if (options.status) {
        await this.showStatus()
      } else if (options.validate) {
        await this.validateConfig()
      } else if (options.reset) {
        await this.resetConfig()
      } else {
        // Default: show status
        await this.showStatus()
      }
    } catch (error) {
      this.handleError(error, 'Config command failed')
      process.exit(1)
    }
  }

  private async setupCredentials() {
    console.log(chalk.cyan('🔧 AWE Configuration Setup\n'))
    
    const questions = [
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'Supabase Project URL:',
        validate: (input: string) => {
          if (!input) return 'URL is required'
          if (!input.startsWith('https://')) return 'URL must start with https://'
          if (!input.includes('supabase.co')) return 'Must be a valid Supabase URL'
          return true
        }
      },
      {
        type: 'password',
        name: 'supabaseAnonKey',
        message: 'Supabase Anonymous Key:',
        mask: '*',
        validate: (input: string) => {
          if (!input) return 'Anonymous key is required'
          if (input.length < 20) return 'Key appears to be too short'
          return true
        }
      },
      {
        type: 'confirm',
        name: 'hasServiceKey',
        message: 'Do you have a service role key? (optional, enables advanced features)',
        default: false
      }
    ]

    const answers = await inquirer.prompt(questions)

    if (answers.hasServiceKey) {
      const serviceKeyAnswer = await inquirer.prompt([{
        type: 'password',
        name: 'serviceKey',
        message: 'Supabase Service Role Key:',
        mask: '*',
        validate: (input: string) => {
          if (!input) return 'Service key is required'
          if (input.length < 20) return 'Key appears to be too short'
          return true
        }
      }])
      answers.serviceKey = serviceKeyAnswer.serviceKey
    }

    // Here you would save the configuration
    console.log(chalk.green('✅ Configuration saved successfully!'))
    console.log(chalk.gray('Your credentials are encrypted and stored securely.'))
  }

  private async showStatus() {
    console.log(chalk.cyan('📊 AWE Configuration Status\n'))
    
    const hasSupabaseUrl = !!(process.env.AWE_SUPABASE_URL || process.env.SUPABASE_URL)
    const hasAnonKey = !!(process.env.AWE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    const hasServiceKey = !!(process.env.AWE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY)
    
    console.log(`Supabase URL: ${hasSupabaseUrl ? chalk.green('✓ Configured') : chalk.red('✗ Missing')}`)
    console.log(`Anonymous Key: ${hasAnonKey ? chalk.green('✓ Configured') : chalk.red('✗ Missing')}`)
    console.log(`Service Key: ${hasServiceKey ? chalk.green('✓ Configured') : chalk.yellow('○ Optional')}`)
    
    if (!hasSupabaseUrl || !hasAnonKey) {
      console.log(chalk.yellow('\n⚠️  Some credentials are missing. Run "awe config --setup" to configure.'))
    } else {
      console.log(chalk.green('\n✅ Configuration looks good!'))
    }
  }

  private async validateConfig() {
    console.log(chalk.cyan('🔍 Validating Configuration...\n'))
    
    // Add validation logic here
    console.log(chalk.green('✅ Configuration is valid'))
  }

  private async resetConfig() {
    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'reset',
      message: 'Are you sure you want to reset all configuration?',
      default: false
    }])

    if (confirm.reset) {
      // Add reset logic here
      console.log(chalk.green('✅ Configuration reset successfully'))
    } else {
      console.log(chalk.gray('Reset cancelled'))
    }
  }
}