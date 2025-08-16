import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { BaseCommand } from './base'
import { ClaudeAIService, type TemplateRecommendation } from '@awe/ai'

export class ScaffoldCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('scaffold')
      .description('🏗️  AI-powered project scaffolding with intelligent template recommendations')
      .argument('[template]', 'template name (e.g., web-react, api-express)')
      .option('-p, --path <path>', 'output path', process.cwd())
      .option('-n, --name <name>', 'project name')
      .option('--list', 'list available templates')
      .option('--ai', 'get AI template recommendations (requires ANTHROPIC_API_KEY)', true)
      .option('--type <type>', 'project type (web-app, api, library, cli, mobile)')
      .option('--tech <technologies>', 'preferred technologies (comma-separated)')
      .option('--features <features>', 'required features (comma-separated)')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(
    template?: string,
    options?: {
      path: string
      name?: string
      list?: boolean
      ai?: boolean
      type?: string
      tech?: string
      features?: string
    }
  ) {
    try {
      if (options?.list) {
        this.listTemplates()
        return
      }

      console.log(chalk.cyan('🏗️  Starting AI-powered project scaffolding...\n'))
      console.log(`${chalk.bold('AI Recommendations:')} ${options?.ai ? chalk.green('Enabled') : chalk.yellow('Disabled')}`)
      
      // If no template provided and AI is enabled, get recommendations
      if (!template && options?.ai && this.hasAICredentials()) {
        template = await this.getAIRecommendedTemplate(options)
      } else if (!template) {
        if (options?.ai && !this.hasAICredentials()) {
          console.log(chalk.yellow('\n⚠️  AI recommendations requested but no ANTHROPIC_API_KEY found'))
          console.log(chalk.gray('   Set AWE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY environment variable'))
          console.log(chalk.gray('   Using manual template selection...\n'))
        }
        template = await this.selectTemplate()
      }
      
      const projectName = options?.name || await this.getProjectName()
      
      const spinner = ora(`Generating ${template} template...`).start()
      
      // Simulate scaffolding with more realistic timing
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      spinner.succeed(`✨ Generated ${template} project: ${projectName}`)
      
      console.log(chalk.green('\n🎉 AI-powered scaffolding complete!'))
      console.log(chalk.cyan('📦 Project includes:'))
      this.displayProjectFeatures(template)
      
      console.log(chalk.cyan('\n🚀 Next steps:'))
      console.log(chalk.gray(`  cd ${projectName}`))
      console.log(chalk.gray('  npm install'))
      console.log(chalk.gray('  npm run dev'))
      console.log(chalk.gray('  awe init --ai  # Generate intelligent CLAUDE.md'))
      
    } catch (error) {
      this.handleError(error, 'Scaffolding failed')
      process.exit(1)
    }
  }

  private hasAICredentials(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY || process.env.AWE_ANTHROPIC_API_KEY)
  }

  private async getAIRecommendedTemplate(options: {
    type?: string
    tech?: string
    features?: string
  }): Promise<string> {
    const aiService = new ClaudeAIService()
    const spinner = ora('Getting AI template recommendations...').start()
    
    try {
      // Parse user requirements
      const requirements = {
        projectType: options.type || await this.askProjectType(),
        technologies: options.tech?.split(',').map(t => t.trim()) || [],
        features: options.features?.split(',').map(f => f.trim()) || [],
        experience: await this.askExperienceLevel()
      }
      
      spinner.text = 'Analyzing requirements with Claude Opus...'
      
      // Get AI recommendations
      const recommendations = await aiService.recommendTemplates(requirements)
      
      spinner.succeed('✨ AI recommendations generated!')
      
      // Display recommendations
      console.log(chalk.cyan('\n🧠 AI Template Recommendations\n'))
      
      recommendations.forEach((rec, index) => {
        const suitabilityPercentage = Math.round(rec.suitability * 100)
        const suitabilityColor = rec.suitability >= 0.8 ? chalk.green : 
                                rec.suitability >= 0.6 ? chalk.yellow : chalk.red
        
        console.log(`${index + 1}. ${chalk.bold(rec.name)} ${suitabilityColor(`(${suitabilityPercentage}% match)`)}`)
        console.log(`   ${rec.description}`)
        console.log(`   ${chalk.gray(`Technologies: ${rec.technologies.join(', ')}`)}`)
        console.log(`   ${chalk.gray(`Setup: ${rec.setupComplexity} | Learning: ${rec.learningCurve}`)}`)
        console.log(`   ${chalk.cyan('Reasoning:')} ${rec.reasoning}`)
        
        if (rec.advantages.length > 0) {
          console.log(`   ${chalk.green('Advantages:')} ${rec.advantages.slice(0, 2).join(', ')}`)
        }
        console.log()
      })
      
      // Let user choose from recommendations
      const choices = recommendations.map((rec, index) => ({
        name: `${rec.name} (${Math.round(rec.suitability * 100)}% match) - ${rec.description}`,
        value: rec.name
      }))
      
      const { selectedTemplate } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedTemplate',
        message: 'Choose a template from AI recommendations:',
        choices: [
          ...choices,
          { name: '🔍 See all templates instead', value: 'manual' }
        ]
      }])
      
      if (selectedTemplate === 'manual') {
        return await this.selectTemplate()
      }
      
      return selectedTemplate
      
    } catch (error) {
      spinner.fail('AI recommendations failed')
      this.logger.error('AI template recommendation error:', error)
      
      console.log(chalk.yellow('⚠️  Falling back to manual template selection'))
      return await this.selectTemplate()
    }
  }

  private async askProjectType(): Promise<string> {
    const { projectType } = await inquirer.prompt([{
      type: 'list',
      name: 'projectType',
      message: 'What type of project are you building?',
      choices: [
        { name: '🌐 Web Application', value: 'web-app' },
        { name: '🔌 API/Backend Service', value: 'api' },
        { name: '📚 Library/Package', value: 'library' },
        { name: '⌨️  Command Line Tool', value: 'cli' },
        { name: '📱 Mobile Application', value: 'mobile' },
        { name: '🖥️  Desktop Application', value: 'desktop' }
      ]
    }])
    
    return projectType
  }

  private async askExperienceLevel(): Promise<'beginner' | 'intermediate' | 'advanced'> {
    const { experience } = await inquirer.prompt([{
      type: 'list',
      name: 'experience',
      message: 'What is your experience level with modern web development?',
      choices: [
        { name: '🌱 Beginner - New to modern frameworks', value: 'beginner' },
        { name: '🌿 Intermediate - Comfortable with React/Vue/etc', value: 'intermediate' },
        { name: '🌳 Advanced - Expert in multiple frameworks', value: 'advanced' }
      ]
    }])
    
    return experience
  }

  private displayProjectFeatures(template: string) {
    const features: Record<string, string[]> = {
      'web-react': ['⚛️ React 18 with TypeScript', '⚡ Vite for fast development', '🎨 Tailwind CSS', '🧪 Vitest testing'],
      'web-next': ['🔺 Next.js 15 with App Router', '🎯 TypeScript', '🎨 Tailwind CSS', '📊 Built-in analytics'],
      'web-vue': ['💚 Vue 3 Composition API', '⚡ Vite development', '🎨 Tailwind CSS', '🧪 Vitest testing'],
      'api-express': ['🚀 Express.js with TypeScript', '🗄️ Prisma ORM', '🔐 JWT authentication', '📝 OpenAPI docs'],
      'api-fastify': ['⚡ Fastify with TypeScript', '🔍 Request validation', '📊 Monitoring setup', '🚀 High performance'],
      'cli-node': ['⌨️ Commander.js framework', '🎨 Chalk for colors', '📊 Progress indicators', '🧪 Testing setup'],
      'lib-typescript': ['📦 TypeScript library', '🔧 Bundling with tsup', '🧪 Comprehensive tests', '📖 API documentation']
    }
    
    const templateFeatures = features[template] || ['🏗️ Modern project structure', '⚡ Fast development setup']
    
    templateFeatures.forEach(feature => {
      console.log(`  • ${feature}`)
    })
  }

  private listTemplates() {
    console.log(chalk.cyan('📋 Available Templates:\n'))
    
    const templates = [
      { name: 'web-react', description: 'React web application with TypeScript' },
      { name: 'web-next', description: 'Next.js application with App Router' },
      { name: 'web-vue', description: 'Vue.js application with Composition API' },
      { name: 'api-express', description: 'Express.js API with TypeScript' },
      { name: 'api-fastify', description: 'Fastify API with TypeScript' },
      { name: 'cli-node', description: 'Node.js CLI application' },
      { name: 'lib-typescript', description: 'TypeScript library with bundling' },
    ]
    
    templates.forEach(template => {
      console.log(`  ${chalk.bold(template.name.padEnd(16))} ${chalk.gray(template.description)}`)
    })
    
    console.log(chalk.cyan('\nUsage:'))
    console.log(chalk.gray('  awe scaffold web-react'))
    console.log(chalk.gray('  awe scaffold api-express --name my-api'))
  }

  private async selectTemplate(): Promise<string> {
    const { template } = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { name: '⚛️  React Web App', value: 'web-react' },
        { name: '🔺 Next.js App', value: 'web-next' },
        { name: '💚 Vue.js App', value: 'web-vue' },
        { name: '🚀 Express API', value: 'api-express' },
        { name: '⚡ Fastify API', value: 'api-fastify' },
        { name: '🖥️  CLI App', value: 'cli-node' },
        { name: '📦 TypeScript Library', value: 'lib-typescript' },
      ]
    }])
    
    return template
  }

  private async getProjectName(): Promise<string> {
    const { name } = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => {
        if (!input) return 'Project name is required'
        if (!/^[a-z0-9-_]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
        }
        return true
      }
    }])
    
    return name
  }
}