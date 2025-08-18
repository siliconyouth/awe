import { EventEmitter } from 'events'
import chalk from 'chalk'
import ora from 'ora'
import type { AIAnalysisResult, AIRecommendation } from './types'

export interface StreamingOptions {
  wordsPerMinute?: number
  showThinking?: boolean
  useColors?: boolean
  simulateTyping?: boolean
}

export interface ThinkingStep {
  icon: string
  message: string
  detail?: string
  duration?: number
}

export class StreamingAIInterface extends EventEmitter {
  private readonly wpm: number
  private readonly showThinking: boolean
  private readonly useColors: boolean
  private readonly simulateTyping: boolean
  
  constructor(options: StreamingOptions = {}) {
    super()
    this.wpm = options.wordsPerMinute || 200
    this.showThinking = options.showThinking ?? true
    this.useColors = options.useColors ?? true
    this.simulateTyping = options.simulateTyping ?? true
  }

  /**
   * Calculates readable delay based on text length
   */
  private calculateDelay(text: string): number {
    const words = text.split(' ').length
    const baseDelay = (60 / this.wpm) * 1000 * words
    // Add some variation for natural feel
    const variation = Math.random() * 200 - 100
    return Math.max(100, baseDelay + variation)
  }

  /**
   * Streams text with simulated typing effect
   */
  async *streamText(text: string): AsyncGenerator<string> {
    if (!this.simulateTyping) {
      yield text
      return
    }

    const words = text.split(' ')
    for (const word of words) {
      yield word + ' '
      await this.delay(this.calculateDelay(word))
    }
  }

  /**
   * Streams thinking process with visual indicators
   */
  async *streamThinking(steps: ThinkingStep[]): AsyncGenerator<string> {
    if (!this.showThinking) return

    for (const step of steps) {
      const spinner = ora({
        text: step.message,
        color: 'cyan',
        spinner: 'dots'
      }).start()

      yield `\n${step.icon} ${this.colorize(step.message, 'dim')}`
      
      if (step.detail) {
        await this.delay(step.duration || 1000)
        spinner.text = `${step.message} - ${step.detail}`
        yield `\n   ${this.colorize('└─', 'dim')} ${step.detail}`
      }

      await this.delay(step.duration || 1500)
      spinner.succeed()
    }
  }

  /**
   * Streams analysis results with formatted output
   */
  async *streamAnalysis(analysis: Partial<AIAnalysisResult>): AsyncGenerator<string> {
    // Stream thinking process
    const thinkingSteps: ThinkingStep[] = [
      { icon: '🔍', message: 'Scanning project structure...', duration: 1000 },
      { icon: '📊', message: 'Analyzing code patterns...', duration: 1500 },
      { icon: '🧠', message: 'Processing with Claude Opus...', duration: 2000 },
      { icon: '💡', message: 'Generating insights...', duration: 1000 }
    ]

    yield* this.streamThinking(thinkingSteps)

    // Stream results
    yield '\n\n' + this.colorize('📈 Analysis Results:', 'bold')
    
    if (analysis.summary) {
      yield '\n' + this.formatMetric('Overall Score', analysis.summary.overallScore * 10, `${analysis.summary.complexity} complexity`)
      yield '\n' + this.formatMetric('Maintainability', analysis.summary.maintainability * 10)
    }
    
    if (analysis.codebaseInsights) {
      const deps = analysis.codebaseInsights.dependencies
      const depScore = Math.max(0, 100 - (deps.vulnerable * 20 + deps.outdated * 5))
      yield '\n' + this.formatMetric('Dependencies', depScore, `${deps.total} total`)
    }
    
    if (analysis.claudeIntegration) {
      yield '\n' + this.formatMetric('Claude Integration', analysis.claudeIntegration.contextQuality * 10, 
        analysis.claudeIntegration.hasClaudeMd ? 'CLAUDE.md present' : 'No CLAUDE.md')
    }
  }

  /**
   * Streams recommendations with priority indicators
   */
  async *streamRecommendations(recommendations: AIRecommendation[]): AsyncGenerator<string> {
    yield '\n\n' + this.colorize('🎯 Recommendations:', 'bold')
    
    // Group by priority
    const grouped = this.groupByPriority(recommendations)
    
    for (const [priority, items] of Object.entries(grouped)) {
      const icon = this.getPriorityIcon(priority)
      yield `\n\n${icon} ${this.colorize(priority.toUpperCase(), this.getPriorityColor(priority))}`
      
      for (const rec of items) {
        yield '\n' + this.formatRecommendation(rec)
        await this.delay(500)
      }
    }
  }

  /**
   * Interactive conversation streaming
   */
  async *streamConversation(prompt: string, response: string): AsyncGenerator<string> {
    // Thinking animation
    const thinking = ora({
      text: 'Thinking...',
      color: 'cyan',
      spinner: 'dots'
    }).start()

    await this.delay(1500)
    thinking.text = 'Analyzing your request...'
    await this.delay(1000)
    thinking.text = 'Generating response...'
    await this.delay(500)
    thinking.succeed('Ready')

    // Stream response with natural pacing
    yield* this.streamText(response)
  }

  /**
   * Format a metric for display
   */
  private formatMetric(name: string, score: number, detail?: string | number): string {
    const bar = this.createProgressBar(score)
    let output = `   ${this.colorize('├─', 'dim')} ${name}: ${bar} ${score}%`
    if (detail) {
      output += ` (${detail})`
    }
    return output
  }

  /**
   * Format a recommendation for display
   */
  private formatRecommendation(rec: AIRecommendation): string {
    const impact = this.getImpactIndicator(rec.impact)
    const effort = this.getEffortIndicator(rec.effort)
    
    return `   ${this.colorize('├─', 'dim')} ${rec.title}
      ${this.colorize('│', 'dim')}  Impact: ${impact} | Effort: ${effort}
      ${this.colorize('│', 'dim')}  ${this.colorize(rec.description, 'dim')}`
  }

  /**
   * Create a visual progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 20
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    
    const filledChar = this.colorize('█', this.getScoreColor(percentage))
    const emptyChar = this.colorize('░', 'dim')
    
    return filledChar.repeat(filled) + emptyChar.repeat(empty)
  }

  /**
   * Group recommendations by priority
   */
  private groupByPriority(recommendations: AIRecommendation[]): Record<string, AIRecommendation[]> {
    return recommendations.reduce((acc, rec) => {
      if (!acc[rec.priority]) acc[rec.priority] = []
      acc[rec.priority].push(rec)
      return acc
    }, {} as Record<string, AIRecommendation[]>)
  }

  /**
   * Get priority icon
   */
  private getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟡',
      medium: '🟢',
      low: '⚪'
    }
    return icons[priority.toLowerCase()] || '⚪'
  }

  /**
   * Get priority color
   */
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'yellow',
      medium: 'green',
      low: 'gray'
    }
    return colors[priority.toLowerCase()] || 'white'
  }

  /**
   * Get score color based on value
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    if (score >= 40) return 'orange'
    return 'red'
  }

  /**
   * Get impact indicator
   */
  private getImpactIndicator(impact: string): string {
    const indicators: Record<string, string> = {
      high: this.colorize('●●●', 'green'),
      medium: this.colorize('●●○', 'yellow'),
      low: this.colorize('●○○', 'gray')
    }
    return indicators[impact.toLowerCase()] || indicators.low
  }

  /**
   * Get effort indicator
   */
  private getEffortIndicator(effort: string): string {
    const indicators: Record<string, string> = {
      high: this.colorize('💪💪💪', 'red'),
      medium: this.colorize('💪💪', 'yellow'),
      low: this.colorize('💪', 'green')
    }
    return indicators[effort.toLowerCase()] || indicators.low
  }

  /**
   * Colorize text if colors are enabled
   */
  private colorize(text: string, style: string): string {
    if (!this.useColors) return text
    
    const styles: Record<string, (text: string) => string> = {
      bold: (t) => chalk.bold(t),
      dim: (t) => chalk.dim(t),
      red: (t) => chalk.red(t),
      green: (t) => chalk.green(t),
      yellow: (t) => chalk.yellow(t),
      blue: (t) => chalk.blue(t),
      cyan: (t) => chalk.cyan(t),
      gray: (t) => chalk.gray(t),
      orange: (t) => chalk.hex('#FFA500')(t),
      white: (t) => chalk.white(t)
    }
    
    return styles[style] ? styles[style](text) : text
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Interactive prompt handler
 */
export class InteractivePrompt {
  private streaming: StreamingAIInterface
  
  constructor(options?: StreamingOptions) {
    this.streaming = new StreamingAIInterface(options)
  }

  /**
   * Ask a question with streaming response
   */
  async ask(question: string, options: string[]): Promise<string> {
    console.log(chalk.cyan('\n🤖 ' + question))
    
    // Display options
    options.forEach((opt, i) => {
      console.log(chalk.dim(`   [${i + 1}] ${opt}`))
    })
    
    // Get user input (would be replaced with actual inquirer prompt)
    return options[0] // Placeholder
  }

  /**
   * Show streaming progress
   */
  async *showProgress(steps: string[]): AsyncGenerator<string> {
    for (const step of steps) {
      const spinner = ora({
        text: step,
        color: 'cyan'
      }).start()
      
      await this.delay(1000 + Math.random() * 1000)
      spinner.succeed()
      yield step
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}