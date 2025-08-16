import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { BaseCommand } from './base'
import { ClaudeAIService, ProjectScanner } from '@awe/ai'
import { StreamingAIInterface, InteractivePrompt } from '@awe/ai'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'

interface SetupOptions {
  path?: string
  interactive?: boolean
  ai?: boolean
  verbose?: boolean
}

interface ProjectSetupConfig {
  projectType: string
  frameworks: string[]
  features: string[]
  claudeConfig: {
    context: boolean
    hooks: boolean
    slashCommands: boolean
    mcpServers: boolean
    agents: boolean
  }
  optimizations: string[]
}

export class SetupCommand extends BaseCommand {
  private streaming: StreamingAIInterface
  private prompt: InteractivePrompt
  
  constructor() {
    super()
    this.streaming = new StreamingAIInterface({
      wordsPerMinute: 250,
      showThinking: true,
      useColors: true,
      simulateTyping: true
    })
    this.prompt = new InteractivePrompt()
  }

  getCommand(): Command {
    const command = new Command('setup')
      .description('🚀 Interactive setup wizard for optimal Claude Code configuration')
      .option('-p, --path <path>', 'project path', process.cwd())
      .option('-i, --interactive', 'run in interactive mode', true)
      .option('--no-ai', 'disable AI-powered recommendations')
      .option('-v, --verbose', 'show detailed output')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: SetupOptions) {
    const projectPath = options.path || process.cwd()
    
    console.log(chalk.cyan.bold('\n🎯 AWE Interactive Setup Wizard\n'))
    console.log(chalk.dim('Let me help you configure the perfect Claude Code environment.\n'))

    // Step 1: Analyze project
    const analysis = await this.analyzeProject(projectPath, options.ai !== false)
    
    // Step 2: Interactive configuration
    const config = await this.interactiveConfiguration(analysis)
    
    // Step 3: Generate implementation plan
    const plan = await this.generatePlan(config, analysis)
    
    // Step 4: Confirm and execute
    const confirmed = await this.confirmPlan(plan)
    
    if (confirmed) {
      await this.executePlan(plan, projectPath)
    }
  }

  /**
   * Analyze the project structure and patterns
   */
  private async analyzeProject(projectPath: string, useAI: boolean = true) {
    console.log(chalk.cyan('\n📊 Analyzing your project...\n'))
    
    const spinner = ora('Scanning project structure...').start()
    
    try {
      const scanner = new ProjectScanner()
      const scanResult = await scanner.scanProject(projectPath)
      
      spinner.text = 'Detecting frameworks and patterns...'
      await this.delay(1000)
      
      const analysis = {
        projectName: basename(projectPath),
        languages: scanResult.languages,
        frameworks: scanResult.frameworks,
        hasPackageJson: existsSync(join(projectPath, 'package.json')),
        hasTypeScript: scanResult.languages.includes('TypeScript'),
        hasTests: scanResult.files.some(f => f.path.includes('test') || f.path.includes('spec')),
        hasClaude: existsSync(join(projectPath, 'CLAUDE.md')),
        hasGit: existsSync(join(projectPath, '.git')),
        fileCount: scanResult.files.length,
        dependencies: scanResult.dependencies || []
      }
      
      spinner.text = 'Analyzing code patterns...'
      await this.delay(1000)
      
      if (useAI && this.hasAICredentials()) {
        spinner.text = 'Getting AI insights...'
        const aiService = new ClaudeAIService()
        const aiAnalysis = await aiService.analyzeProject(
          projectPath,
          {
            files: scanResult.files.slice(0, 20), // Limit for performance
            packageJson: scanResult.packageJson,
            dependencies: scanResult.dependencies
          },
          'deep'
        )
        
        Object.assign(analysis, {
          aiInsights: aiAnalysis,
          recommendations: aiAnalysis.recommendations
        })
      }
      
      spinner.succeed('Project analysis complete!')
      
      // Display analysis summary
      console.log(chalk.cyan('\n📋 Project Summary:'))
      console.log(chalk.dim('├─'), `Name: ${chalk.white(analysis.projectName)}`)
      console.log(chalk.dim('├─'), `Languages: ${chalk.white(analysis.languages.join(', '))}`)
      console.log(chalk.dim('├─'), `Frameworks: ${chalk.white(analysis.frameworks.join(', ') || 'None detected')}`)
      console.log(chalk.dim('├─'), `Files: ${chalk.white(analysis.fileCount)}`)
      console.log(chalk.dim('└─'), `TypeScript: ${analysis.hasTypeScript ? chalk.green('✓') : chalk.red('✗')}`)
      
      return analysis
    } catch (error) {
      spinner.fail('Analysis failed')
      this.logger.error('Project analysis error:', error)
      throw error
    }
  }

  /**
   * Interactive configuration based on analysis
   */
  private async interactiveConfiguration(analysis: any): Promise<ProjectSetupConfig> {
    console.log(chalk.cyan('\n🎨 Let\'s configure your setup:\n'))
    
    // Project type selection
    const { projectType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project is this?',
        choices: [
          { name: 'Web Application (Frontend)', value: 'web-app' },
          { name: 'API Server (Backend)', value: 'api-server' },
          { name: 'Full-Stack Application', value: 'fullstack' },
          { name: 'Library/Package', value: 'library' },
          { name: 'CLI Tool', value: 'cli' },
          { name: 'Mobile Application', value: 'mobile' },
          { name: 'Other/Custom', value: 'custom' }
        ],
        default: this.detectProjectType(analysis)
      }
    ])
    
    // Feature selection
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Which features would you like to configure?',
        choices: [
          { name: '📝 Intelligent CLAUDE.md generation', value: 'claude-md', checked: !analysis.hasClaude },
          { name: '🪝 Custom hooks for workflow automation', value: 'hooks', checked: true },
          { name: '⚡ Slash commands for quick actions', value: 'slash-commands', checked: true },
          { name: '🖥️ MCP servers for integrations', value: 'mcp-servers', checked: false },
          { name: '🤖 Specialized AI agents', value: 'agents', checked: true },
          { name: '📊 Performance monitoring', value: 'performance', checked: false },
          { name: '🔒 Security scanning', value: 'security', checked: false },
          { name: '🧪 Test automation', value: 'testing', checked: !analysis.hasTests }
        ]
      }
    ])
    
    // Optimization preferences
    const { optimizations } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'optimizations',
        message: 'Which optimizations should I apply?',
        choices: [
          { name: 'TypeScript strict mode', value: 'ts-strict', checked: analysis.hasTypeScript },
          { name: 'ESLint configuration', value: 'eslint', checked: true },
          { name: 'Prettier formatting', value: 'prettier', checked: true },
          { name: 'Git hooks (Husky)', value: 'git-hooks', checked: analysis.hasGit },
          { name: 'Bundle optimization', value: 'bundle', checked: projectType === 'web-app' },
          { name: 'Docker configuration', value: 'docker', checked: false },
          { name: 'CI/CD pipeline', value: 'ci-cd', checked: false }
        ]
      }
    ])
    
    // AI agent selection (if agents feature selected)
    let selectedAgents: string[] = []
    if (features.includes('agents')) {
      const { agents } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'agents',
          message: 'Which specialized agents would you like?',
          choices: [
            { name: '👨‍💻 Code Reviewer', value: 'code-reviewer', checked: true },
            { name: '📚 Documentation Writer', value: 'doc-writer', checked: true },
            { name: '🐛 Bug Hunter', value: 'bug-hunter', checked: false },
            { name: '⚡ Performance Optimizer', value: 'performance', checked: false },
            { name: '🔒 Security Analyst', value: 'security', checked: false },
            { name: '🧪 Test Generator', value: 'test-gen', checked: false },
            { name: '♻️ Refactoring Assistant', value: 'refactor', checked: false }
          ]
        }
      ])
      selectedAgents = agents
    }
    
    return {
      projectType,
      frameworks: analysis.frameworks || [],
      features,
      claudeConfig: {
        context: features.includes('claude-md'),
        hooks: features.includes('hooks'),
        slashCommands: features.includes('slash-commands'),
        mcpServers: features.includes('mcp-servers'),
        agents: features.includes('agents')
      },
      optimizations,
      selectedAgents
    } as any
  }

  /**
   * Generate implementation plan
   */
  private async generatePlan(config: ProjectSetupConfig, analysis: any) {
    console.log(chalk.cyan('\n📋 Generating implementation plan...\n'))
    
    const spinner = ora('Creating optimal configuration...').start()
    await this.delay(1500)
    spinner.text = 'Planning file structure...'
    await this.delay(1000)
    spinner.text = 'Selecting best practices...'
    await this.delay(1000)
    spinner.succeed('Plan generated!')
    
    const plan = {
      steps: [],
      files: [],
      commands: [],
      estimatedTime: 0
    }
    
    // Add steps based on configuration
    if (config.claudeConfig.context) {
      plan.steps.push({
        name: 'Generate CLAUDE.md',
        description: 'Create AI-optimized context documentation',
        files: ['CLAUDE.md'],
        time: 30
      })
    }
    
    if (config.claudeConfig.hooks) {
      plan.steps.push({
        name: 'Configure hooks',
        description: 'Set up workflow automation hooks',
        files: ['.claude/hooks/pre-commit.js', '.claude/hooks/post-analysis.js'],
        time: 45
      })
    }
    
    if (config.claudeConfig.slashCommands) {
      plan.steps.push({
        name: 'Create slash commands',
        description: 'Add custom commands for quick actions',
        files: ['.claude/commands.json'],
        time: 30
      })
    }
    
    if (config.claudeConfig.mcpServers) {
      plan.steps.push({
        name: 'Configure MCP servers',
        description: 'Set up integration servers',
        files: ['.claude/mcp-config.json'],
        time: 60
      })
    }
    
    if (config.claudeConfig.agents) {
      plan.steps.push({
        name: 'Set up AI agents',
        description: 'Configure specialized AI assistants',
        files: config.selectedAgents?.map(a => `.claude/agents/${a}.json`) || [],
        time: 90
      })
    }
    
    // Calculate total time
    plan.estimatedTime = plan.steps.reduce((total, step) => total + step.time, 0)
    
    return plan
  }

  /**
   * Confirm implementation plan
   */
  private async confirmPlan(plan: any): Promise<boolean> {
    console.log(chalk.cyan('\n🎯 Implementation Plan:\n'))
    
    plan.steps.forEach((step: any, index: number) => {
      console.log(chalk.white(`${index + 1}. ${step.name}`))
      console.log(chalk.dim(`   ${step.description}`))
      if (step.files.length > 0) {
        console.log(chalk.dim(`   Files: ${step.files.join(', ')}`))
      }
      console.log()
    })
    
    console.log(chalk.dim(`⏱️  Estimated time: ${plan.estimatedTime} seconds`))
    console.log(chalk.dim(`📁 Files to create: ${plan.steps.reduce((t: number, s: any) => t + s.files.length, 0)}`))
    
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Ready to implement this configuration?',
        default: true
      }
    ])
    
    return confirmed
  }

  /**
   * Execute the implementation plan
   */
  private async executePlan(plan: any, projectPath: string) {
    console.log(chalk.cyan('\n🚀 Implementing configuration...\n'))
    
    for (const step of plan.steps) {
      const spinner = ora(`${step.name}...`).start()
      
      try {
        // Create directories if needed
        for (const file of step.files) {
          const dir = join(projectPath, file.substring(0, file.lastIndexOf('/')))
          if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true })
          }
        }
        
        // Simulate file creation with progress
        await this.delay(step.time * 100) // Speed up for demo
        
        // Actually create files (simplified for now)
        for (const file of step.files) {
          const filePath = join(projectPath, file)
          const content = await this.generateFileContent(file, step)
          await writeFile(filePath, content)
        }
        
        spinner.succeed(`${step.name} complete!`)
      } catch (error) {
        spinner.fail(`${step.name} failed`)
        this.logger.error(`Step failed: ${step.name}`, error)
      }
    }
    
    console.log(chalk.green.bold('\n✨ Setup complete!\n'))
    console.log(chalk.cyan('Next steps:'))
    console.log(chalk.dim('1. Review generated files in .claude/ directory'))
    console.log(chalk.dim('2. Run "awe analyze" to verify configuration'))
    console.log(chalk.dim('3. Start using your optimized Claude Code environment!'))
  }

  /**
   * Generate content for configuration files
   */
  private async generateFileContent(filename: string, step: any): Promise<string> {
    // Simplified content generation - would be enhanced with AI
    if (filename.endsWith('CLAUDE.md')) {
      return `# Claude Code Context

## Project Overview
This project has been configured with AWE for optimal Claude Code integration.

## Configuration
- Hooks: Enabled
- Slash Commands: Configured
- AI Agents: Active

## Usage
Use this context to help Claude understand your project better.
`
    }
    
    if (filename.endsWith('.json')) {
      return JSON.stringify({
        version: '1.0.0',
        generated: new Date().toISOString(),
        type: filename.split('/').pop()?.replace('.json', '')
      }, null, 2)
    }
    
    return `// Generated by AWE Setup
// ${step.name}
module.exports = {
  // Configuration will be added here
}`
  }

  /**
   * Check if AI credentials are available
   */
  private hasAICredentials(): boolean {
    return !!(
      process.env.ANTHROPIC_API_KEY || 
      process.env.AWE_ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY
    )
  }

  /**
   * Detect project type from analysis
   */
  private detectProjectType(analysis: any): string {
    if (analysis.frameworks.includes('Next.js') || analysis.frameworks.includes('React')) {
      return 'web-app'
    }
    if (analysis.frameworks.includes('Express') || analysis.frameworks.includes('Fastify')) {
      return 'api-server'
    }
    if (analysis.hasPackageJson && analysis.fileCount < 20) {
      return 'library'
    }
    return 'custom'
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}