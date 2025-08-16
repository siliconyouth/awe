import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { BaseCommand } from './base'
import { ClaudeAIService, StreamingAIInterface } from '@awe/ai'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface ChatOptions {
  path?: string
  context?: boolean
  verbose?: boolean
}

interface ConversationContext {
  projectPath: string
  projectInfo: any
  history: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  currentTopic?: string
}

export class ChatCommand extends BaseCommand {
  private streaming: StreamingAIInterface
  private aiService: ClaudeAIService | null = null
  private context: ConversationContext
  
  constructor() {
    super()
    this.streaming = new StreamingAIInterface({
      wordsPerMinute: 250,
      showThinking: true,
      useColors: true,
      simulateTyping: true
    })
    this.context = {
      projectPath: process.cwd(),
      projectInfo: {},
      history: []
    }
  }

  getCommand(): Command {
    const command = new Command('chat')
      .description('💬 Interactive chat with AWE AI assistant')
      .option('-p, --path <path>', 'project path', process.cwd())
      .option('-c, --context', 'load project context', true)
      .option('-v, --verbose', 'show detailed responses')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: ChatOptions) {
    const projectPath = options.path || process.cwd()
    this.context.projectPath = projectPath
    
    // Initialize AI if available
    if (this.hasAICredentials()) {
      this.aiService = new ClaudeAIService()
    }
    
    // Load project context if requested
    if (options.context) {
      await this.loadProjectContext(projectPath)
    }
    
    // Display welcome message
    this.displayWelcome()
    
    // Start conversation loop
    await this.conversationLoop()
  }

  /**
   * Display welcome message
   */
  private displayWelcome() {
    console.clear()
    console.log(chalk.cyan.bold('\n🤖 AWE AI Assistant\n'))
    console.log(chalk.dim('I\'m here to help optimize your Claude Code workflow.\n'))
    
    console.log(chalk.cyan('Available topics:'))
    console.log(chalk.dim('  • Project analysis and optimization'))
    console.log(chalk.dim('  • Claude configuration and best practices'))
    console.log(chalk.dim('  • Code improvements and refactoring'))
    console.log(chalk.dim('  • Testing and documentation'))
    console.log(chalk.dim('  • Performance and security'))
    console.log()
    console.log(chalk.dim('Type "help" for commands, "exit" to quit\n'))
  }

  /**
   * Load project context
   */
  private async loadProjectContext(projectPath: string) {
    const spinner = ora('Loading project context...').start()
    
    try {
      // Load CLAUDE.md if exists
      const claudePath = join(projectPath, 'CLAUDE.md')
      if (existsSync(claudePath)) {
        this.context.projectInfo.claudeContext = readFileSync(claudePath, 'utf-8')
      }
      
      // Load package.json if exists
      const packagePath = join(projectPath, 'package.json')
      if (existsSync(packagePath)) {
        this.context.projectInfo.packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
      }
      
      spinner.succeed('Project context loaded')
    } catch (error) {
      spinner.fail('Failed to load context')
      this.logger.error('Context loading error:', error)
    }
  }

  /**
   * Main conversation loop
   */
  private async conversationLoop() {
    let continueChat = true
    
    while (continueChat) {
      const { input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: chalk.green('You:'),
          prefix: '',
          transformer: (input: string) => chalk.cyan(input)
        }
      ])
      
      // Handle special commands
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        continueChat = false
        console.log(chalk.dim('\nGoodbye! Happy coding! 👋\n'))
        break
      }
      
      if (input.toLowerCase() === 'help') {
        this.showHelp()
        continue
      }
      
      if (input.toLowerCase() === 'clear') {
        console.clear()
        this.displayWelcome()
        continue
      }
      
      if (input.toLowerCase().startsWith('/')) {
        await this.handleCommand(input)
        continue
      }
      
      // Process regular conversation
      await this.processUserInput(input)
    }
  }

  /**
   * Process user input and generate response
   */
  private async processUserInput(input: string) {
    // Add to history
    this.context.history.push({
      role: 'user',
      content: input,
      timestamp: new Date()
    })
    
    // Detect intent
    const intent = this.detectIntent(input)
    
    // Show thinking animation
    console.log()
    for await (const chunk of this.streaming.streamThinking([
      { icon: '🧠', message: 'Understanding your request...', duration: 800 },
      { icon: '🔍', message: 'Analyzing context...', duration: 1000 },
      { icon: '💡', message: 'Generating response...', duration: 700 }
    ])) {
      // Thinking is displayed by the streaming interface
    }
    
    // Generate response based on intent
    const response = await this.generateResponse(input, intent)
    
    // Stream response
    console.log(chalk.blue('\n🤖 AWE:'))
    for await (const chunk of this.streaming.streamText(response)) {
      process.stdout.write(chunk)
    }
    console.log('\n')
    
    // Add assistant response to history
    this.context.history.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    })
    
    // Offer follow-up actions if applicable
    await this.offerFollowUpActions(intent, response)
  }

  /**
   * Detect user intent from input
   */
  private detectIntent(input: string): string {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('analyze') || lowerInput.includes('analysis')) {
      return 'analyze'
    }
    if (lowerInput.includes('optimize') || lowerInput.includes('improve')) {
      return 'optimize'
    }
    if (lowerInput.includes('test') || lowerInput.includes('testing')) {
      return 'testing'
    }
    if (lowerInput.includes('document') || lowerInput.includes('docs')) {
      return 'documentation'
    }
    if (lowerInput.includes('setup') || lowerInput.includes('configure')) {
      return 'setup'
    }
    if (lowerInput.includes('hook') || lowerInput.includes('slash') || lowerInput.includes('command')) {
      return 'integration'
    }
    if (lowerInput.includes('performance') || lowerInput.includes('speed')) {
      return 'performance'
    }
    if (lowerInput.includes('security') || lowerInput.includes('vulnerability')) {
      return 'security'
    }
    
    return 'general'
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(input: string, intent: string): Promise<string> {
    // Use AI if available
    if (this.aiService && this.hasAICredentials()) {
      try {
        const context = {
          intent,
          projectInfo: this.context.projectInfo,
          history: this.context.history.slice(-5) // Last 5 messages
        }
        
        const response = await this.aiService.chat(input, context)
        return response
      } catch (error) {
        this.logger.error('AI response generation failed:', error)
      }
    }
    
    // Fallback responses based on intent
    const responses: Record<string, string> = {
      analyze: `I can help analyze your project. Based on what I can see, your project appears to be ${this.describeProject()}. 

Would you like me to:
1. Run a comprehensive analysis with "awe analyze --depth comprehensive"
2. Focus on specific areas like performance or security
3. Generate optimization recommendations

What aspect would you like to explore?`,

      optimize: `Let's optimize your project! I can help with:

• **Code Quality**: TypeScript strict mode, ESLint configuration
• **Performance**: Bundle optimization, lazy loading, caching
• **Developer Experience**: Faster builds, better tooling
• **Claude Integration**: Optimized context, custom hooks

Which area would you like to focus on first?`,

      testing: `Testing is crucial for project quality. I can help you:

• Set up a testing framework (Jest, Vitest, Playwright)
• Generate test templates and examples
• Configure test coverage reporting
• Create testing hooks for CI/CD

What's your current testing setup, and what would you like to improve?`,

      documentation: `Good documentation is essential. I can assist with:

• Generating comprehensive CLAUDE.md for Claude Code
• Creating API documentation
• Writing component documentation
• Setting up documentation generation tools

Would you like me to analyze your current documentation and suggest improvements?`,

      setup: `I can help configure your project optimally. The setup wizard can:

• Configure Claude Code integration
• Set up development tools and workflows
• Create custom hooks and commands
• Optimize your development environment

Run "awe setup --interactive" to start the guided setup, or tell me what specific configuration you need.`,

      integration: `AWE supports powerful integrations:

**Hooks** - Automate workflows:
• pre-commit: Code quality checks
• post-analysis: Action on insights
• custom: Your specific needs

**Slash Commands** - Quick actions in Claude:
• /test: Run tests
• /deploy: Deploy application
• /analyze: Quick analysis

**MCP Servers** - External integrations:
• Database connections
• API integrations
• Tool connections

Which integration would you like to set up?`,

      performance: `Performance optimization is key. I can help with:

• Bundle size analysis and optimization
• Code splitting and lazy loading
• Caching strategies
• Build time improvements
• Runtime performance profiling

What performance issues are you experiencing?`,

      security: `Security is paramount. I can assist with:

• Vulnerability scanning
• Dependency audits
• Security best practices
• Authentication setup
• Data protection measures

Would you like me to run a security audit on your project?`,

      general: `I'm here to help with any aspect of your development workflow. I can:

• Analyze and optimize your project
• Set up Claude Code integrations
• Configure development tools
• Generate documentation
• Provide best practices

What would you like to work on today?`
    }
    
    return responses[intent] || responses.general
  }

  /**
   * Describe the current project
   */
  private describeProject(): string {
    if (this.context.projectInfo.packageJson) {
      const pkg = this.context.projectInfo.packageJson
      const deps = Object.keys(pkg.dependencies || {})
      
      if (deps.includes('react') || deps.includes('next')) {
        return 'a React/Next.js web application'
      }
      if (deps.includes('express') || deps.includes('fastify')) {
        return 'a Node.js API server'
      }
      if (deps.includes('vue')) {
        return 'a Vue.js application'
      }
    }
    
    return 'a JavaScript/TypeScript project'
  }

  /**
   * Offer follow-up actions based on intent
   */
  private async offerFollowUpActions(intent: string, response: string) {
    const actions: Record<string, string[]> = {
      analyze: [
        'Run full analysis now',
        'Schedule regular analysis',
        'View analysis history'
      ],
      optimize: [
        'Apply recommended optimizations',
        'Run performance audit',
        'Configure development tools'
      ],
      testing: [
        'Set up testing framework',
        'Generate test templates',
        'Run existing tests'
      ],
      documentation: [
        'Generate CLAUDE.md',
        'Create API docs',
        'Update README'
      ],
      setup: [
        'Run interactive setup',
        'Configure specific feature',
        'View current configuration'
      ]
    }
    
    const intentActions = actions[intent]
    if (intentActions && intentActions.length > 0) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: chalk.dim('Would you like to:'),
          choices: [
            ...intentActions,
            new inquirer.Separator(),
            'Continue chatting',
            'Exit'
          ]
        }
      ])
      
      if (action && action !== 'Continue chatting' && action !== 'Exit') {
        await this.executeAction(action)
      }
    }
  }

  /**
   * Execute a follow-up action
   */
  private async executeAction(action: string) {
    const spinner = ora(`Executing: ${action}...`).start()
    await this.delay(2000)
    spinner.succeed(`${action} initiated`)
    
    // Map actions to commands
    const actionMap: Record<string, string> = {
      'Run full analysis now': 'awe analyze --depth comprehensive',
      'Apply recommended optimizations': 'awe recommend --apply',
      'Set up testing framework': 'awe scaffold --type testing',
      'Generate CLAUDE.md': 'awe init --ai',
      'Run interactive setup': 'awe setup --interactive'
    }
    
    const command = actionMap[action]
    if (command) {
      console.log(chalk.dim(`\nRun: ${chalk.cyan(command)}\n`))
    }
  }

  /**
   * Handle special commands
   */
  private async handleCommand(command: string) {
    const cmd = command.slice(1).toLowerCase()
    
    switch (cmd) {
      case 'analyze':
        console.log(chalk.dim('Running analysis...'))
        // Would trigger actual analysis
        break
      case 'recommend':
        console.log(chalk.dim('Generating recommendations...'))
        // Would trigger recommendations
        break
      case 'history':
        this.showHistory()
        break
      case 'context':
        this.showContext()
        break
      default:
        console.log(chalk.red(`Unknown command: ${command}`))
    }
  }

  /**
   * Show conversation history
   */
  private showHistory() {
    console.log(chalk.cyan('\n📜 Conversation History:\n'))
    this.context.history.forEach((msg, i) => {
      const time = msg.timestamp.toLocaleTimeString()
      console.log(chalk.dim(`[${time}] `) + 
        (msg.role === 'user' ? chalk.green('You: ') : chalk.blue('AWE: ')) +
        msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''))
    })
    console.log()
  }

  /**
   * Show current context
   */
  private showContext() {
    console.log(chalk.cyan('\n📋 Current Context:\n'))
    console.log(chalk.dim('Project Path:'), this.context.projectPath)
    console.log(chalk.dim('Has CLAUDE.md:'), !!this.context.projectInfo.claudeContext)
    console.log(chalk.dim('Has package.json:'), !!this.context.projectInfo.packageJson)
    console.log(chalk.dim('History Length:'), this.context.history.length)
    console.log()
  }

  /**
   * Show help information
   */
  private showHelp() {
    console.log(chalk.cyan('\n📚 Chat Commands:\n'))
    console.log(chalk.dim('  help     - Show this help message'))
    console.log(chalk.dim('  clear    - Clear the screen'))
    console.log(chalk.dim('  exit     - Exit chat mode'))
    console.log(chalk.dim('  /analyze - Run project analysis'))
    console.log(chalk.dim('  /recommend - Get recommendations'))
    console.log(chalk.dim('  /history - Show conversation history'))
    console.log(chalk.dim('  /context - Show current context'))
    console.log()
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}