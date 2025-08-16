import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseCommand } from './base'
import { AgentOrchestrator, AgentType } from '@awe/ai'

interface AgentsOptions {
  agent?: string
  all?: boolean
  parallel?: boolean
  output?: string
  verbose?: boolean
}

export class AgentsCommand extends BaseCommand {
  private orchestrator: AgentOrchestrator

  constructor() {
    super()
    this.orchestrator = new AgentOrchestrator()
  }

  getCommand(): Command {
    const command = new Command('agents')
      .alias('agent')
      .description('🤖 Run specialized AI agents for code analysis and improvement')
      .action(async () => {
        await this.listAgents()
      })

    // List available agents
    command
      .command('list')
      .description('List all available agents')
      .action(async () => {
        await this.listAgents()
      })

    // Run specific agent
    command
      .command('run [agent]')
      .description('Run a specific agent or multiple agents')
      .option('-a, --all', 'Run all available agents')
      .option('-p, --parallel', 'Run agents in parallel')
      .option('-o, --output <file>', 'Save report to file')
      .option('-v, --verbose', 'Show detailed output')
      .action(async (agent: string | undefined, options: AgentsOptions) => {
        await this.runAgents(agent, options)
      })

    // Code review
    command
      .command('review [path]')
      .description('Run code review agent')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runSpecificAgent(AgentType.CODE_REVIEWER, path, options)
      })

    // Security audit
    command
      .command('security [path]')
      .description('Run security audit agent')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runSpecificAgent(AgentType.SECURITY_AUDITOR, path, options)
      })

    // Performance optimization
    command
      .command('performance [path]')
      .description('Run performance optimization agent')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runSpecificAgent(AgentType.PERFORMANCE_OPTIMIZER, path, options)
      })

    // Test generation
    command
      .command('test [path]')
      .description('Run test generation agent')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runSpecificAgent(AgentType.TEST_GENERATOR, path, options)
      })

    // Documentation
    command
      .command('docs [path]')
      .description('Run documentation writer agent')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runSpecificAgent(AgentType.DOCUMENTATION_WRITER, path, options)
      })

    // Comprehensive analysis
    command
      .command('analyze [path]')
      .description('Run comprehensive analysis with all agents')
      .option('-o, --output <file>', 'Save report to file')
      .action(async (path: string = process.cwd(), options: AgentsOptions) => {
        await this.runComprehensiveAnalysis(path, options)
      })

    return command
  }

  private async listAgents(): Promise<void> {
    const spinner = ora('Loading agents...').start()

    try {
      await this.orchestrator.initialize()
      spinner.succeed('Agents loaded')

      const agents = this.orchestrator.getAvailableAgents()
      
      console.log(chalk.cyan('\n🤖 Available AI Agents:\n'))

      for (const type of agents) {
        const info = this.orchestrator.getAgentInfo(type)
        if (info) {
          const icon = this.getAgentIcon(type)
          console.log(`${icon} ${chalk.bold(info.name)} (${type})`)
          console.log(`   ${chalk.gray(info.description)}`)
          
          if (info.capabilities.length > 0) {
            console.log(chalk.yellow('   Capabilities:'))
            for (const cap of info.capabilities) {
              const confidence = Math.round(cap.confidence * 100)
              console.log(`   • ${cap.name} - ${chalk.gray(cap.description)} ${chalk.green(`${confidence}%`)}`)
            }
          }
          console.log()
        }
      }

      console.log(chalk.cyan('Commands:'))
      console.log(chalk.gray('  awe agents run <agent>     Run a specific agent'))
      console.log(chalk.gray('  awe agents run --all       Run all agents'))
      console.log(chalk.gray('  awe agents analyze         Run comprehensive analysis'))
      console.log(chalk.gray('  awe agents review          Run code review'))
      console.log(chalk.gray('  awe agents security        Run security audit'))
      console.log(chalk.gray('  awe agents performance     Run performance analysis'))

    } catch (error) {
      spinner.fail(chalk.red('Failed to load agents'))
      console.error(error)
      process.exit(1)
    }
  }

  private async runAgents(agent: string | undefined, options: AgentsOptions): Promise<void> {
    const spinner = ora('Initializing agents...').start()

    try {
      await this.orchestrator.initialize()
      spinner.text = 'Agents initialized'

      let agentsToRun: AgentType[] = [];

      if (options.all) {
        agentsToRun = this.orchestrator.getAvailableAgents()
      } else if (agent) {
        // Convert agent string to AgentType
        const agentType = agent.toLowerCase().replace(/-/g, '_') as AgentType
        if (!this.orchestrator.getAgentInfo(agentType)) {
          spinner.fail(chalk.red(`Unknown agent: ${agent}`))
          console.log(chalk.gray('\nRun "awe agents list" to see available agents'))
          return
        }
        agentsToRun = [agentType]
      } else {
        // Interactive selection
        spinner.stop()
        const agents = this.orchestrator.getAvailableAgents()
        const choices = agents.map(type => {
          const info = this.orchestrator.getAgentInfo(type)
          return {
            name: `${info?.name || type} - ${info?.description || ''}`,
            value: type,
            checked: false
          }
        })

        const { selectedAgents } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedAgents',
            message: 'Select agents to run:',
            choices
          }
        ])

        if (selectedAgents.length === 0) {
          console.log(chalk.yellow('No agents selected'))
          return
        }

        agentsToRun = selectedAgents
        spinner.start('Running agents...')
      }

      // Run agents
      spinner.text = `Running ${agentsToRun.length} agent(s)...`

      const context = {
        projectPath: process.cwd()
      }

      const results = await this.orchestrator.executeAgents(
        agentsToRun,
        context,
        { parallel: options.parallel }
      )

      spinner.succeed(chalk.green('Agent execution completed'))

      // Display results
      this.displayResults(results, options.verbose)

      // Save report if requested
      if (options.output) {
        const report = this.orchestrator.generateReport(results)
        await fs.writeFile(options.output, report, 'utf-8')
        console.log(chalk.green(`\n✅ Report saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red('Agent execution failed'))
      console.error(error)
      process.exit(1)
    }
  }

  private async runSpecificAgent(type: AgentType, projectPath: string, options: AgentsOptions): Promise<void> {
    const spinner = ora(`Running ${type} agent...`).start()

    try {
      await this.orchestrator.initialize()

      const context = {
        projectPath: path.resolve(projectPath)
      }

      const result = await this.orchestrator.executeAgent(type, context)

      if (result.success) {
        spinner.succeed(chalk.green(`${type} completed successfully`))
      } else {
        spinner.fail(chalk.red(`${type} failed`))
      }

      // Display result
      this.displaySingleResult(result, true)

      // Save report if requested
      if (options.output) {
        const report = this.orchestrator.generateReport([result])
        await fs.writeFile(options.output, report, 'utf-8')
        console.log(chalk.green(`\n✅ Report saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red(`${type} failed`))
      console.error(error)
      process.exit(1)
    }
  }

  private async runComprehensiveAnalysis(projectPath: string, options: AgentsOptions): Promise<void> {
    const spinner = ora('Running comprehensive analysis...').start()

    try {
      await this.orchestrator.initialize()

      const context = {
        projectPath: path.resolve(projectPath)
      }

      spinner.text = 'Executing all agents...'
      const analysis = await this.orchestrator.executeComprehensiveAnalysis(context)

      spinner.succeed(chalk.green('Comprehensive analysis completed'))

      // Display summary
      console.log(chalk.cyan('\n📊 Analysis Summary:\n'))
      console.log(analysis.summary)
      console.log(`Overall Confidence: ${chalk.green(`${Math.round(analysis.overallConfidence * 100)}%`)}`)
      
      if (analysis.criticalIssues > 0) {
        console.log(chalk.red(`\n⚠️  ${analysis.criticalIssues} critical issues found`))
      }

      // Display results
      console.log(chalk.cyan('\n📋 Agent Results:\n'))
      this.displayResults(analysis.results, options.verbose)

      // Display recommendations
      if (analysis.recommendations.length > 0) {
        console.log(chalk.cyan('\n💡 Recommendations:\n'))
        for (const rec of analysis.recommendations.slice(0, 10)) {
          console.log(`• ${rec}`)
        }
        if (analysis.recommendations.length > 10) {
          console.log(chalk.gray(`\n... and ${analysis.recommendations.length - 10} more`))
        }
      }

      // Save report if requested
      if (options.output) {
        const report = this.orchestrator.generateReport(analysis.results)
        await fs.writeFile(options.output, report, 'utf-8')
        console.log(chalk.green(`\n✅ Full report saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red('Comprehensive analysis failed'))
      console.error(error)
      process.exit(1)
    }
  }

  private displayResults(results: any[], verbose?: boolean): void {
    for (const result of results) {
      this.displaySingleResult(result, verbose)
    }
  }

  private displaySingleResult(result: any, verbose?: boolean): void {
    const icon = this.getAgentIcon(result.agent)
    const status = result.success ? chalk.green('✓') : chalk.red('✗')
    
    console.log(`\n${icon} ${chalk.bold(result.agent)} ${status}`)
    console.log(`   ${result.summary}`)
    
    if (verbose) {
      console.log(chalk.gray(`   ${result.details}`))
      console.log(chalk.gray(`   Duration: ${result.duration}ms`))
      console.log(chalk.gray(`   Confidence: ${Math.round(result.confidence * 100)}%`))
    }

    // Display actions
    if (result.actions && result.actions.length > 0) {
      const highPriority = result.actions.filter((a: any) => a.priority === 'high')
      const mediumPriority = result.actions.filter((a: any) => a.priority === 'medium')
      
      if (highPriority.length > 0) {
        console.log(chalk.red(`   🔴 ${highPriority.length} high priority issues`))
        if (verbose) {
          for (const action of highPriority.slice(0, 3)) {
            console.log(chalk.red(`      • ${action.description}`))
          }
        }
      }
      
      if (mediumPriority.length > 0) {
        console.log(chalk.yellow(`   🟡 ${mediumPriority.length} medium priority issues`))
      }
    }

    // Display recommendations (first 3)
    if (result.recommendations && result.recommendations.length > 0 && verbose) {
      console.log(chalk.cyan('   Recommendations:'))
      for (const rec of result.recommendations.slice(0, 3)) {
        console.log(`      • ${rec}`)
      }
      if (result.recommendations.length > 3) {
        console.log(chalk.gray(`      ... and ${result.recommendations.length - 3} more`))
      }
    }
  }

  private getAgentIcon(type: AgentType): string {
    const icons: Record<string, string> = {
      [AgentType.CODE_REVIEWER]: '👁️',
      [AgentType.SECURITY_AUDITOR]: '🔒',
      [AgentType.PERFORMANCE_OPTIMIZER]: '⚡',
      [AgentType.TEST_GENERATOR]: '🧪',
      [AgentType.DOCUMENTATION_WRITER]: '📝',
      [AgentType.REFACTORING_ASSISTANT]: '🔧',
      [AgentType.DEPENDENCY_MANAGER]: '📦',
      [AgentType.ARCHITECTURE_ADVISOR]: '🏗️',
      [AgentType.BUG_DETECTIVE]: '🐛',
      [AgentType.API_DESIGNER]: '🔌',
      [AgentType.DEVOPS_ENGINEER]: '⚙️',
      [AgentType.ACCESSIBILITY_EXPERT]: '♿'
    }
    return icons[type] || '🤖'
  }
}

// Export for standalone use
export const agentsCommand = new AgentsCommand().getCommand()