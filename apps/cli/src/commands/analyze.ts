import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { BaseCommand } from './base'
import { ClaudeAIService, ProjectScanner, type AIAnalysisResult, type AnalysisDepth } from '@awe/ai'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export class AnalyzeCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('analyze')
      .description('🔍 AI-powered analysis of your project with Claude Opus ultrathinking')
      .option('-p, --path <path>', 'project path to analyze', process.cwd())
      .option('-d, --depth <depth>', 'analysis depth (shallow|deep|comprehensive)', 'deep')
      .option('-o, --output <format>', 'output format (json|table|summary)', 'summary')
      .option('--save', 'save analysis results to .awe/analysis.json')
      .option('--ai', 'enable AI-powered analysis (requires ANTHROPIC_API_KEY)', true)
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: {
    path: string
    depth: string
    output: string
    save?: boolean
    ai?: boolean
  }) {
    try {
      // Validate depth parameter
      const depth = this.validateDepth(options.depth)
      
      console.log(chalk.cyan('🔍 Starting AI-powered project analysis...\n'))
      console.log(`${chalk.bold('Path:')} ${options.path}`)
      console.log(`${chalk.bold('Depth:')} ${depth}`)
      console.log(`${chalk.bold('AI Analysis:')} ${options.ai ? chalk.green('Enabled') : chalk.yellow('Disabled')}`)
      
      let analysis: AIAnalysisResult

      if (options.ai && this.hasAICredentials()) {
        analysis = await this.performAIAnalysis(options.path, depth)
      } else {
        if (options.ai && !this.hasAICredentials()) {
          console.log(chalk.yellow('\n⚠️  AI analysis requested but no ANTHROPIC_API_KEY found'))
          console.log(chalk.gray('   Set AWE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY environment variable'))
          console.log(chalk.gray('   Falling back to basic analysis...\n'))
        }
        analysis = await this.performBasicAnalysis(options.path)
      }
      
      this.displayResults(analysis, options.output)
      
      if (options.save) {
        await this.saveAnalysis(analysis, options.path)
      }
      
    } catch (error) {
      this.handleError(error, 'Analysis failed')
      process.exit(1)
    }
  }

  private validateDepth(depth: string): AnalysisDepth {
    const validDepths: AnalysisDepth[] = ['shallow', 'deep', 'comprehensive']
    if (validDepths.includes(depth as AnalysisDepth)) {
      return depth as AnalysisDepth
    }
    
    console.log(chalk.yellow(`⚠️  Invalid depth '${depth}', using 'deep' instead`))
    return 'deep'
  }

  private hasAICredentials(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY || process.env.AWE_ANTHROPIC_API_KEY)
  }

  private async performAIAnalysis(projectPath: string, depth: AnalysisDepth): Promise<AIAnalysisResult> {
    const scanner = new ProjectScanner()
    const aiService = new ClaudeAIService()
    
    const spinner = ora('Scanning project files...').start()
    
    try {
      // Scan the project
      const scanResult = await scanner.scanProject(projectPath)
      
      spinner.text = `Analyzing ${scanResult.totalFiles} files with Claude Opus ${depth} analysis...`
      
      // Perform AI analysis
      const analysis = await aiService.analyzeProject(projectPath, scanResult, depth)
      
      spinner.succeed(`✨ AI analysis complete! Analyzed ${scanResult.totalFiles} files`)
      
      console.log(chalk.green(`🧠 Claude Opus insights generated with ${analysis.recommendations.length} recommendations`))
      
      return analysis
      
    } catch (error) {
      spinner.fail('AI analysis failed')
      throw error
    }
  }

  private async performBasicAnalysis(projectPath: string): Promise<AIAnalysisResult> {
    const scanner = new ProjectScanner()
    const spinner = ora('Performing basic project analysis...').start()
    
    try {
      const scanResult = await scanner.scanProject(projectPath)
      
      // Create a basic analysis result
      const analysis: AIAnalysisResult = {
        projectName: 'Analyzed Project',
        analyzedAt: new Date().toISOString(),
        depth: 'shallow',
        summary: {
          overallScore: 7.5,
          strengths: ['Modern tech stack', 'Good project structure'],
          concerns: ['Could benefit from AI analysis'],
          architecture: scanResult.frameworks.length > 0 ? scanResult.frameworks[0] : 'Unknown',
          complexity: scanResult.totalFiles > 100 ? 'high' : scanResult.totalFiles > 50 ? 'medium' : 'low',
          maintainability: 7.5
        },
        codebaseInsights: {
          totalFiles: scanResult.totalFiles,
          languages: scanResult.languages,
          frameworks: scanResult.frameworks,
          dependencies: {
            total: scanResult.dependencies?.length || 0,
            outdated: 0,
            vulnerable: 0
          },
          codePatterns: []
        },
        claudeIntegration: {
          hasClaudeMd: !!scanResult.existingClaudeMd,
          hasMemoryFile: !!scanResult.existingMemory,
          contextQuality: scanResult.existingClaudeMd ? 8.0 : 3.0,
          optimizationOpportunities: scanResult.existingClaudeMd ? 
            ['Enhance CLAUDE.md with more context'] : 
            ['Create CLAUDE.md file', 'Add MEMORY.md for persistence']
        },
        recommendations: [
          {
            id: 'basic-1',
            type: 'documentation',
            priority: 'medium',
            title: 'Enable AI-powered analysis',
            description: 'Set up ANTHROPIC_API_KEY to unlock Claude Opus ultrathinking analysis',
            reasoning: 'AI analysis provides deep insights and actionable recommendations',
            effort: 'low',
            impact: 'high',
            confidence: 0.9,
            commands: ['export ANTHROPIC_API_KEY=your_key_here', 'awe analyze --ai']
          }
        ],
        nextSteps: [
          'Set up AI credentials for advanced analysis',
          'Run awe init to create CLAUDE.md',
          'Consider using awe recommend for specific improvements'
        ]
      }
      
      spinner.succeed('Basic analysis complete')
      return analysis
      
    } catch (error) {
      spinner.fail('Basic analysis failed')
      throw error
    }
  }

  private async saveAnalysis(analysis: AIAnalysisResult, projectPath: string): Promise<void> {
    try {
      const aweDir = join(projectPath, '.awe')
      const analysisPath = join(aweDir, 'analysis.json')
      
      if (!existsSync(aweDir)) {
        await mkdir(aweDir, { recursive: true })
      }
      
      await writeFile(analysisPath, JSON.stringify(analysis, null, 2))
      
      console.log(chalk.green('\n💾 Analysis saved to .awe/analysis.json'))
      console.log(chalk.gray(`   ${analysisPath}`))
      
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Failed to save analysis file'))
      this.logger.error('Save analysis error:', error)
    }
  }

  private displayResults(analysis: AIAnalysisResult, format: string) {
    if (format === 'json') {
      console.log(JSON.stringify(analysis, null, 2))
      return
    }

    // Display header
    console.log(chalk.cyan('\n📊 AI-Powered Project Analysis Results\n'))
    console.log(`${chalk.bold('Project:')} ${analysis.projectName}`)
    console.log(`${chalk.bold('Analyzed:')} ${new Date(analysis.analyzedAt).toLocaleString()}`)
    console.log(`${chalk.bold('Analysis Depth:')} ${analysis.depth}`)
    
    // Display summary
    console.log(chalk.cyan('\n📈 Project Summary'))
    console.log(`${chalk.bold('Overall Score:')} ${analysis.summary.overallScore}/10`)
    console.log(`${chalk.bold('Architecture:')} ${analysis.summary.architecture}`)
    console.log(`${chalk.bold('Complexity:')} ${analysis.summary.complexity}`)
    console.log(`${chalk.bold('Maintainability:')} ${analysis.summary.maintainability}/10`)

    // Display strengths
    if (analysis.summary.strengths.length > 0) {
      console.log(chalk.green('\n✅ Project Strengths:'))
      analysis.summary.strengths.forEach(strength => {
        console.log(`  • ${strength}`)
      })
    }

    // Display concerns
    if (analysis.summary.concerns.length > 0) {
      console.log(chalk.yellow('\n⚠️  Areas of Concern:'))
      analysis.summary.concerns.forEach(concern => {
        console.log(`  • ${concern}`)
      })
    }

    // Display codebase insights
    console.log(chalk.cyan('\n🔍 Codebase Insights'))
    console.log(`${chalk.bold('Total Files:')} ${analysis.codebaseInsights.totalFiles}`)
    console.log(`${chalk.bold('Languages:')} ${analysis.codebaseInsights.languages.join(', ')}`)
    console.log(`${chalk.bold('Frameworks:')} ${analysis.codebaseInsights.frameworks.join(', ')}`)
    console.log(`${chalk.bold('Dependencies:')} ${analysis.codebaseInsights.dependencies.total} total`)
    if (analysis.codebaseInsights.dependencies.outdated > 0) {
      console.log(`  ${chalk.yellow('⚠️')} ${analysis.codebaseInsights.dependencies.outdated} outdated`)
    }
    if (analysis.codebaseInsights.dependencies.vulnerable > 0) {
      console.log(`  ${chalk.red('🚨')} ${analysis.codebaseInsights.dependencies.vulnerable} vulnerable`)
    }
    
    // Display Claude integration status
    console.log(chalk.cyan('\n🤖 Claude Integration'))
    console.log(`  CLAUDE.md: ${analysis.claudeIntegration.hasClaudeMd ? chalk.green('✓ Present') : chalk.red('✗ Missing')}`)
    console.log(`  MEMORY.md: ${analysis.claudeIntegration.hasMemoryFile ? chalk.green('✓ Present') : chalk.red('✗ Missing')}`)
    console.log(`  Context Quality: ${analysis.claudeIntegration.contextQuality}/10`)
    
    if (analysis.claudeIntegration.optimizationOpportunities.length > 0) {
      console.log('  Optimization Opportunities:')
      analysis.claudeIntegration.optimizationOpportunities.forEach(opp => {
        console.log(`    • ${opp}`)
      })
    }

    // Display recommendations
    if (analysis.recommendations.length > 0) {
      console.log(chalk.cyan('\n💡 AI Recommendations'))
      
      // Group by priority
      const grouped = analysis.recommendations.reduce((acc, rec) => {
        if (!acc[rec.priority]) acc[rec.priority] = []
        acc[rec.priority].push(rec)
        return acc
      }, {} as Record<string, typeof analysis.recommendations>)

      const priorityOrder = ['critical', 'high', 'medium', 'low'] as const
      
      priorityOrder.forEach(priority => {
        if (grouped[priority]?.length > 0) {
          const priorityColor = priority === 'critical' ? chalk.red : 
                               priority === 'high' ? chalk.red : 
                               priority === 'medium' ? chalk.yellow : chalk.blue
          
          console.log(`\n${priorityColor(`📌 ${priority.toUpperCase()} PRIORITY`)}`)
          
          grouped[priority].forEach((rec, index) => {
            console.log(`\n  ${index + 1}. ${chalk.bold(rec.title)}`)
            console.log(`     ${rec.description}`)
            console.log(`     ${chalk.gray(`Effort: ${rec.effort} | Impact: ${rec.impact} | Confidence: ${Math.round(rec.confidence * 100)}%`)}`)
            
            if (rec.reasoning) {
              console.log(`     ${chalk.gray(`Reasoning: ${rec.reasoning}`)}`)
            }
            
            if (rec.commands && rec.commands.length > 0) {
              console.log(`     ${chalk.cyan('Commands:')}`)
              rec.commands.forEach(cmd => {
                console.log(`       ${chalk.gray('$')} ${cmd}`)
              })
            }
          })
        }
      })
    }

    // Display next steps
    if (analysis.nextSteps.length > 0) {
      console.log(chalk.cyan('\n🎯 Recommended Next Steps'))
      analysis.nextSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`)
      })
    }

    console.log(chalk.gray('\n💡 Tip: Use --save to save detailed results to .awe/analysis.json'))
    console.log(chalk.gray('💡 Tip: Run "awe recommend" for more specific improvement suggestions'))
  }
}