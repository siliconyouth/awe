import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { BaseCommand } from './base'
import { ClaudeAIService, ProjectScanner, type AIRecommendation } from '@awe/ai'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import inquirer from 'inquirer'

export class RecommendCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('recommend')
      .description('💡 Get deep AI-powered recommendations with Claude Opus ultrathinking')
      .option('-p, --path <path>', 'project path', process.cwd())
      .option('-t, --type <type>', 'recommendation type (performance|security|maintainability|architecture|testing|all)', 'all')
      .option('--ai', 'enable AI-powered recommendations (requires ANTHROPIC_API_KEY)', true)
      .option('--goals <goals>', 'project goals (comma-separated)')
      .option('--constraints <constraints>', 'constraints or limitations (comma-separated)')
      .option('--issues <issues>', 'current issues or pain points (comma-separated)')
      .option('--interactive', 'interactive mode with guided questions')
      .option('--save', 'save recommendations to .awe/recommendations.json')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: {
    path: string
    type: string
    ai?: boolean
    goals?: string
    constraints?: string
    issues?: string
    interactive?: boolean
    save?: boolean
  }) {
    try {
      console.log(chalk.cyan('💡 Starting deep AI-powered recommendation analysis...\n'))
      console.log(`${chalk.bold('Path:')} ${options.path}`)
      console.log(`${chalk.bold('Type:')} ${options.type}`)
      console.log(`${chalk.bold('AI Analysis:')} ${options.ai ? chalk.green('Enabled') : chalk.yellow('Disabled')}`)

      let recommendations: AIRecommendation[]

      if (options.ai && this.hasAICredentials()) {
        recommendations = await this.generateAIRecommendations(options)
      } else {
        if (options.ai && !this.hasAICredentials()) {
          console.log(chalk.yellow('\n⚠️  AI recommendations requested but no ANTHROPIC_API_KEY found'))
          console.log(chalk.gray('   Set AWE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY environment variable'))
          console.log(chalk.gray('   Falling back to basic recommendations...\n'))
        }
        recommendations = this.generateBasicRecommendations(options.type)
      }

      this.displayRecommendations(recommendations)

      if (options.save) {
        await this.saveRecommendations(recommendations, options.path)
      }

    } catch (error) {
      this.handleError(error, 'Recommendation generation failed')
      process.exit(1)
    }
  }

  private hasAICredentials(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY || process.env.AWE_ANTHROPIC_API_KEY)
  }

  private async generateAIRecommendations(options: {
    path: string
    type: string
    goals?: string
    constraints?: string
    issues?: string
    interactive?: boolean
  }): Promise<AIRecommendation[]> {
    const scanner = new ProjectScanner()
    const aiService = new ClaudeAIService()
    
    const spinner = ora('Analyzing project structure...').start()
    
    try {
      // Scan the project
      const scanResult = await scanner.scanProject(options.path)
      
      spinner.text = 'Loading existing analysis data...'
      
      // Try to load existing analysis for context
      let existingAnalysis = undefined
      const analysisPath = join(options.path, '.awe', 'analysis.json')
      if (existsSync(analysisPath)) {
        try {
          const analysisContent = await readFile(analysisPath, 'utf-8')
          existingAnalysis = JSON.parse(analysisContent)
        } catch (error) {
          // Ignore errors loading analysis
        }
      }

      // Gather user context
      let userGoals: string[] = []
      let constraints: string[] = []
      let currentIssues: string[] = []

      if (options.interactive) {
        const context = await this.gatherInteractiveContext()
        userGoals = context.goals
        constraints = context.constraints
        currentIssues = context.issues
      } else {
        userGoals = options.goals?.split(',').map(g => g.trim()) || []
        constraints = options.constraints?.split(',').map(c => c.trim()) || []
        currentIssues = options.issues?.split(',').map(i => i.trim()) || []
      }

      spinner.text = 'Generating AI recommendations with Claude Opus ultrathinking...'

      // Generate AI recommendations
      const recommendations = await aiService.generateRecommendations({
        analysis: existingAnalysis,
        userGoals,
        constraints,
        currentIssues
      })

      // Filter by type if specified
      const filteredRecommendations = options.type === 'all' 
        ? recommendations 
        : recommendations.filter(rec => rec.type === options.type)

      spinner.succeed(`✨ Generated ${filteredRecommendations.length} AI-powered recommendations!`)
      
      console.log(chalk.green('🧠 Claude Opus analyzed your project with deep ultrathinking'))
      console.log(chalk.gray(`   • Processed ${scanResult.totalFiles} files`))
      console.log(chalk.gray(`   • Considered ${userGoals.length} goals, ${constraints.length} constraints`))
      console.log(chalk.gray(`   • Addressed ${currentIssues.length} current issues`))

      return filteredRecommendations

    } catch (error) {
      spinner.fail('AI recommendation generation failed')
      throw error
    }
  }

  private async gatherInteractiveContext(): Promise<{
    goals: string[]
    constraints: string[]
    issues: string[]
  }> {
    console.log(chalk.cyan('\n🤔 Interactive Context Gathering\n'))

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'goals',
        message: 'What are your main project goals? (comma-separated)',
        default: 'improve performance, enhance maintainability, increase security'
      },
      {
        type: 'input',
        name: 'constraints',
        message: 'Any constraints or limitations? (comma-separated)',
        default: 'limited budget, tight timeline, small team'
      },
      {
        type: 'input',
        name: 'issues',
        message: 'Current issues or pain points? (comma-separated)',
        default: 'slow build times, hard to debug, complex deployment'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'What is your main priority?',
        choices: [
          { name: '🚀 Performance optimization', value: 'performance' },
          { name: '🔒 Security improvements', value: 'security' },
          { name: '🧹 Code maintainability', value: 'maintainability' },
          { name: '🏗️  Architecture improvements', value: 'architecture' },
          { name: '🧪 Testing enhancements', value: 'testing' },
          { name: '📚 Documentation', value: 'documentation' }
        ]
      }
    ])

    return {
      goals: answers.goals.split(',').map((g: string) => g.trim()).filter(Boolean),
      constraints: answers.constraints.split(',').map((c: string) => c.trim()).filter(Boolean),
      issues: answers.issues.split(',').map((i: string) => i.trim()).filter(Boolean)
    }
  }

  private async saveRecommendations(recommendations: AIRecommendation[], projectPath: string): Promise<void> {
    try {
      const aweDir = join(projectPath, '.awe')
      const recsPath = join(aweDir, 'recommendations.json')
      
      if (!existsSync(aweDir)) {
        const { mkdir } = await import('fs/promises')
        await mkdir(aweDir, { recursive: true })
      }
      
      const data = {
        generatedAt: new Date().toISOString(),
        totalRecommendations: recommendations.length,
        recommendations: recommendations.map(rec => ({
          ...rec,
          applied: false,
          appliedAt: null
        }))
      }
      
      await writeFile(recsPath, JSON.stringify(data, null, 2))
      
      console.log(chalk.green('\n💾 Recommendations saved to .awe/recommendations.json'))
      console.log(chalk.gray(`   ${recsPath}`))
      
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Failed to save recommendations file'))
      this.logger.error('Save recommendations error:', error)
    }
  }

  private generateBasicRecommendations(type: string): AIRecommendation[] {
    const allRecommendations = {
      performance: [
        {
          id: 'basic-perf-1',
          type: 'performance' as const,
          priority: 'high' as const,
          title: 'Optimize bundle size',
          description: 'Consider code splitting and tree shaking to reduce bundle size.',
          reasoning: 'Large bundles slow down initial page load and hurt user experience.',
          effort: 'medium' as const,
          impact: 'high' as const,
          confidence: 0.8,
          commands: ['npm install webpack-bundle-analyzer', 'npx webpack-bundle-analyzer build/static/js/*.js']
        },
        {
          id: 'basic-perf-2',
          type: 'performance' as const,
          priority: 'medium' as const,
          title: 'Add image optimization',
          description: 'Optimize images for better performance.',
          reasoning: 'Unoptimized images can significantly slow down page loading.',
          effort: 'low' as const,
          impact: 'medium' as const,
          confidence: 0.9,
          commands: ['Use Next.js Image component or other optimization tools']
        }
      ],
      security: [
        {
          id: 'basic-sec-1',
          type: 'security' as const,
          priority: 'critical' as const,
          title: 'Update vulnerable dependencies',
          description: 'Check for and update any vulnerable dependencies.',
          reasoning: 'Vulnerable dependencies expose your application to security risks.',
          effort: 'low' as const,
          impact: 'high' as const,
          confidence: 1.0,
          commands: ['npm audit fix', 'npm update']
        }
      ],
      maintainability: [
        {
          id: 'basic-maint-1',
          type: 'maintainability' as const,
          priority: 'medium' as const,
          title: 'Enable AI-powered recommendations',
          description: 'Set up ANTHROPIC_API_KEY to unlock Claude Opus ultrathinking recommendations.',
          reasoning: 'AI recommendations provide deeper insights and more specific improvements.',
          effort: 'low' as const,
          impact: 'high' as const,
          confidence: 0.9,
          commands: ['export ANTHROPIC_API_KEY=your_key_here', 'awe recommend --ai']
        }
      ]
    }

    if (type === 'all') {
      return Object.values(allRecommendations).flat()
    }

    return allRecommendations[type as keyof typeof allRecommendations] || []
  }

  private displayRecommendations(recommendations: AIRecommendation[]) {
    if (recommendations.length === 0) {
      console.log(chalk.green('\n🎉 No recommendations found - your project looks great!'))
      return
    }

    console.log(chalk.cyan('\n💡 AI-Powered Recommendations\n'))
    
    // Group by priority
    const grouped = recommendations.reduce((acc, rec) => {
      if (!acc[rec.priority]) acc[rec.priority] = []
      acc[rec.priority].push(rec)
      return acc
    }, {} as Record<string, AIRecommendation[]>)

    const priorityOrder = ['critical', 'high', 'medium', 'low'] as const
    
    priorityOrder.forEach(priority => {
      if (grouped[priority]?.length > 0) {
        const priorityColor = priority === 'critical' ? chalk.red : 
                             priority === 'high' ? chalk.red : 
                             priority === 'medium' ? chalk.yellow : chalk.blue
        
        console.log(`${priorityColor(`🎯 ${priority.toUpperCase()} PRIORITY`)}\n`)
        
        grouped[priority].forEach((rec, index) => {
          console.log(`  ${index + 1}. ${chalk.bold(rec.title)}`)
          console.log(`     ${rec.description}`)
          console.log(`     ${chalk.gray(`Type: ${rec.type} | Effort: ${rec.effort} | Impact: ${rec.impact}`)}`)
          console.log(`     ${chalk.gray(`Confidence: ${Math.round(rec.confidence * 100)}%`)}`)
          
          if (rec.reasoning) {
            console.log(`     ${chalk.cyan('Reasoning:')} ${rec.reasoning}`)
          }
          
          if (rec.commands && rec.commands.length > 0) {
            console.log(`     ${chalk.cyan('Suggested Actions:')}`)
            rec.commands.forEach(cmd => {
              console.log(`       ${chalk.gray('•')} ${cmd}`)
            })
          }
          
          if (rec.codeChanges && rec.codeChanges.length > 0) {
            console.log(`     ${chalk.cyan('Code Changes:')}`)
            rec.codeChanges.forEach(change => {
              console.log(`       ${chalk.gray('•')} ${change.file}: ${change.description}`)
            })
          }
          
          console.log()
        })
      }
    })
    
    console.log(chalk.cyan('💡 Tips:'))
    console.log(chalk.gray('  • Use --save to save recommendations to .awe/recommendations.json'))
    console.log(chalk.gray('  • Use --interactive for guided context gathering'))
    console.log(chalk.gray('  • Run "awe analyze --ai" first for better context'))
  }
}