import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, basename } from 'path'
import { BaseCommand } from './base'
import { CLAUDE_MD_TEMPLATE, MEMORY_FILE_TEMPLATE } from '@awe/shared'
import { ClaudeAIService, ProjectScanner } from '@awe/ai'
import ora from 'ora'

export class InitCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('init')
      .description('🚀 Initialize project with AI-generated Claude.md and AWE configuration')
      .option('-p, --path <path>', 'project path', process.cwd())
      .option('-f, --force', 'overwrite existing files')
      .option('--memory', 'also create MEMORY.md file')
      .option('--ai', 'use AI to generate intelligent context (requires ANTHROPIC_API_KEY)', true)
      .option('--template', 'use default template instead of AI generation')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: {
    path: string
    force?: boolean
    memory?: boolean
    ai?: boolean
    template?: boolean
  }) {
    try {
      console.log(chalk.cyan('🚀 Initializing AWE project...\n'))
      console.log(`${chalk.bold('Path:')} ${options.path}`)
      console.log(`${chalk.bold('AI Generation:')} ${(options.ai && !options.template) ? chalk.green('Enabled') : chalk.yellow('Disabled')}`)
      
      const claudeMdPath = join(options.path, 'CLAUDE.md')
      const memoryPath = join(options.path, 'MEMORY.md')
      
      // Check if files exist
      const claudeMdExists = existsSync(claudeMdPath)
      const memoryExists = existsSync(memoryPath)
      
      if (claudeMdExists && !options.force) {
        const { overwrite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: 'CLAUDE.md already exists. Overwrite?',
          default: false
        }])
        
        if (!overwrite) {
          console.log(chalk.yellow('Initialization cancelled'))
          return
        }
      }
      
      // Generate or use template CLAUDE.md
      let claudeContent: string
      
      if (options.ai && !options.template && this.hasAICredentials()) {
        claudeContent = await this.generateAIClaudeContext(options.path)
      } else {
        if (options.ai && !this.hasAICredentials()) {
          console.log(chalk.yellow('\n⚠️  AI generation requested but no ANTHROPIC_API_KEY found'))
          console.log(chalk.gray('   Set AWE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY environment variable'))
          console.log(chalk.gray('   Using default template instead...\n'))
        }
        claudeContent = CLAUDE_MD_TEMPLATE
      }
      
      // Create CLAUDE.md
      await writeFile(claudeMdPath, claudeContent)
      console.log(chalk.green('✅ Created CLAUDE.md'))
      
      // Create MEMORY.md if requested
      if (options.memory) {
        if (memoryExists && !options.force) {
          const { overwriteMemory } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwriteMemory',
            message: 'MEMORY.md already exists. Overwrite?',
            default: false
          }])
          
          if (overwriteMemory) {
            await writeFile(memoryPath, MEMORY_FILE_TEMPLATE)
            console.log(chalk.green('✅ Created MEMORY.md'))
          }
        } else {
          await writeFile(memoryPath, MEMORY_FILE_TEMPLATE)
          console.log(chalk.green('✅ Created MEMORY.md'))
        }
      }
      
      console.log(chalk.cyan('\n🎉 Project initialized successfully!'))
      console.log(chalk.gray('Next steps:'))
      console.log(chalk.gray('  1. Review and customize CLAUDE.md with your specific context'))
      console.log(chalk.gray('  2. Run "awe analyze" to get AI-powered optimization recommendations'))
      console.log(chalk.gray('  3. Use "awe scaffold" to generate intelligent code templates'))
      console.log(chalk.gray('  4. Try "awe recommend" for project-specific improvement suggestions'))
      
    } catch (error) {
      this.handleError(error, 'Initialization failed')
      process.exit(1)
    }
  }

  private hasAICredentials(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY || process.env.AWE_ANTHROPIC_API_KEY)
  }

  private async generateAIClaudeContext(projectPath: string): Promise<string> {
    const scanner = new ProjectScanner()
    const aiService = new ClaudeAIService()
    
    const spinner = ora('Scanning project structure...').start()
    
    try {
      // Scan project for context
      const scanResult = await scanner.scanProject(projectPath)
      
      spinner.text = 'Generating intelligent CLAUDE.md with AI...'
      
      // Extract package.json info
      let packageJson: any = {}
      let projectName = basename(projectPath)
      let description = ''
      
      if (scanResult.packageJson) {
        packageJson = scanResult.packageJson as any
        projectName = packageJson.name || projectName
        description = packageJson.description || ''
      }
      
      // Create project structure overview
      const structure = scanResult.files.slice(0, 20).map(file => ({
        path: file.relativePath,
        type: file.extension === '' ? 'directory' : 'file'
      }))
      
      // Generate AI context
      const aiContext = await aiService.generateClaudeContext({
        name: projectName,
        description,
        technologies: [...scanResult.languages, ...scanResult.frameworks],
        structure,
        packageJson
      })
      
      spinner.succeed('✨ AI-generated CLAUDE.md created with intelligent project context!')
      
      console.log(chalk.green('🧠 AI analyzed your project and generated contextual documentation'))
      console.log(chalk.gray(`   • Detected ${scanResult.languages.length} languages: ${scanResult.languages.join(', ')}`))
      console.log(chalk.gray(`   • Found ${scanResult.frameworks.length} frameworks: ${scanResult.frameworks.join(', ')}`))
      console.log(chalk.gray(`   • Analyzed ${scanResult.totalFiles} files for context generation`))
      
      return aiContext
      
    } catch (error) {
      spinner.fail('AI generation failed, using default template')
      this.logger.error('AI context generation error:', error)
      
      console.log(chalk.yellow('⚠️  Falling back to default CLAUDE.md template'))
      return CLAUDE_MD_TEMPLATE
    }
  }
}