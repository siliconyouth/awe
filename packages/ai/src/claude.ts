import Anthropic from '@anthropic-ai/sdk'
import type { 
  AIAnalysisResult, 
  AIRecommendation, 
  AnalysisDepth,
  ProjectContext,
  TemplateRecommendation
} from './types.js'

export class ClaudeAIService {
  private anthropic: Anthropic
  private model = 'claude-3-5-sonnet-20241022' // Latest Opus model

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || process.env.AWE_ANTHROPIC_API_KEY
    })
  }

  /**
   * Performs deep AI analysis of a codebase using Claude Opus with ultrathinking
   */
  async analyzeProject(
    projectPath: string,
    codebaseData: {
      files: Array<{ path: string; content: string; size: number }>
      packageJson?: object
      dependencies?: string[]
      gitHistory?: string[]
      existingClaudeMd?: string
      existingMemory?: string
    },
    depth: AnalysisDepth = 'deep'
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildAnalysisSystemPrompt(depth)
    const userPrompt = this.buildAnalysisUserPrompt(projectPath, codebaseData)

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    try {
      // Extract JSON from the response
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const analysisResult = JSON.parse(jsonMatch[1]) as AIAnalysisResult
      return analysisResult
    } catch (error) {
      throw new Error(`Failed to parse AI analysis result: ${error}`)
    }
  }

  /**
   * Generates AI-powered recommendations for project improvements
   */
  async generateRecommendations(
    projectData: {
      analysis?: Partial<AIAnalysisResult>
      userGoals?: string[]
      constraints?: string[]
      currentIssues?: string[]
    }
  ): Promise<AIRecommendation[]> {
    const systemPrompt = `You are an expert software architect and code analyst specializing in project optimization and best practices. 

Your task is to generate actionable, prioritized recommendations for improving a software project. Focus on:

1. **Performance Optimization**: Bundle size, runtime performance, build optimization
2. **Code Quality**: Maintainability, readability, architecture patterns
3. **Security**: Vulnerabilities, best practices, dependency security
4. **Developer Experience**: Tooling, workflows, debugging capabilities
5. **Testing**: Coverage, strategy, test quality
6. **Documentation**: Code documentation, project documentation, onboarding
7. **Deployment**: CI/CD, monitoring, reliability

For each recommendation:
- Provide clear reasoning based on analysis
- Estimate effort and impact realistically
- Include specific implementation steps
- Consider the project's context and constraints
- Assign appropriate priority levels

Return your response as a JSON array of recommendation objects matching the AIRecommendation schema.`

    const userPrompt = `Analyze this project data and generate specific, actionable recommendations:

**Project Analysis:**
${JSON.stringify(projectData.analysis, null, 2)}

**User Goals:**
${projectData.userGoals?.join('\n') || 'No specific goals provided'}

**Constraints:**
${projectData.constraints?.join('\n') || 'No specific constraints provided'}

**Current Issues:**
${projectData.currentIssues?.join('\n') || 'No specific issues reported'}

Generate 8-12 prioritized recommendations that would have the most impact on this project. Focus on practical, implementable improvements that align with modern development best practices.

Return the recommendations as a JSON array.`

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 6000,
      temperature: 0.4,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    try {
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) || 
                       content.text.match(/\[([\s\S]*?)\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in Claude response')
      }

      const recommendations = JSON.parse(jsonMatch[0].includes('```') ? jsonMatch[1] : jsonMatch[0]) as AIRecommendation[]
      return recommendations
    } catch (error) {
      throw new Error(`Failed to parse AI recommendations: ${error}`)
    }
  }

  /**
   * Generates intelligent context for CLAUDE.md initialization
   */
  async generateClaudeContext(
    projectData: {
      name: string
      description?: string
      technologies: string[]
      structure: Array<{ path: string; type: 'file' | 'directory' }>
      packageJson?: object
    }
  ): Promise<string> {
    const systemPrompt = `You are an expert at creating comprehensive CLAUDE.md files that help Claude Code understand projects deeply and provide optimal assistance.

Your task is to generate a CLAUDE.md file that:
1. Clearly explains the project's purpose, architecture, and key components
2. Provides essential context about technologies, patterns, and conventions used
3. Highlights important files, directories, and their relationships
4. Includes development workflows, build processes, and deployment information
5. Describes coding standards, testing approaches, and contribution guidelines
6. Anticipates common tasks Claude might help with and provides relevant context

Create a well-structured, comprehensive CLAUDE.md that will enable Claude to provide exceptional assistance on this project.`

    const userPrompt = `Generate a comprehensive CLAUDE.md file for this project:

**Project Name:** ${projectData.name}
**Description:** ${projectData.description || 'No description provided'}

**Technologies:**
${projectData.technologies.join(', ')}

**Project Structure:**
${projectData.structure.map(item => `${item.type === 'directory' ? '📁' : '📄'} ${item.path}`).join('\n')}

**Package.json:**
${projectData.packageJson ? JSON.stringify(projectData.packageJson, null, 2) : 'Not available'}

Create a detailed CLAUDE.md that will help Claude understand this project thoroughly and provide excellent development assistance.

Return the complete CLAUDE.md content (not wrapped in JSON).`

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  }

  /**
   * Recommends optimal project templates based on requirements
   */
  async recommendTemplates(
    requirements: {
      projectType: string
      technologies?: string[]
      features?: string[]
      constraints?: string[]
      experience?: 'beginner' | 'intermediate' | 'advanced'
    }
  ): Promise<TemplateRecommendation[]> {
    const systemPrompt = `You are an expert in modern software development templates and project scaffolding. 

Your task is to recommend the most suitable project templates based on specific requirements. Consider:

1. **Technology Alignment**: How well the template matches requested technologies
2. **Feature Support**: Whether the template supports required features out of the box
3. **Learning Curve**: Appropriate complexity for the user's experience level
4. **Maintainability**: Long-term maintenance and upgrade path
5. **Community Support**: Active development and community resources
6. **Performance**: Build speed, bundle size, runtime performance
7. **Developer Experience**: Tooling, debugging, hot reload capabilities

Rank templates by suitability (0.0 to 1.0) and provide detailed reasoning for each recommendation.

Return recommendations as a JSON array matching the TemplateRecommendation schema.`

    const userPrompt = `Recommend project templates for these requirements:

**Project Type:** ${requirements.projectType}
**Technologies:** ${requirements.technologies?.join(', ') || 'No specific preferences'}
**Required Features:** ${requirements.features?.join(', ') || 'Standard features'}
**Constraints:** ${requirements.constraints?.join(', ') || 'No specific constraints'}
**Experience Level:** ${requirements.experience || 'intermediate'}

Available templates to consider:
- web-react: React 18 with TypeScript, Vite, Tailwind CSS
- web-next: Next.js 14 with App Router, TypeScript, Tailwind CSS
- web-vue: Vue 3 with Composition API, TypeScript, Vite
- api-express: Express.js with TypeScript, Prisma, JWT auth
- api-fastify: Fastify with TypeScript, validation, OpenAPI
- cli-node: Node.js CLI with commander, TypeScript
- lib-typescript: TypeScript library with bundling and testing
- fullstack-trpc: Next.js + tRPC + Prisma + TypeScript
- mobile-expo: React Native with Expo, TypeScript
- desktop-electron: Electron with React, TypeScript

Recommend the 3-5 most suitable templates with detailed analysis.

Return as a JSON array of recommendations.`

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.4,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    try {
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) || 
                       content.text.match(/\[([\s\S]*?)\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in Claude response')
      }

      const recommendations = JSON.parse(jsonMatch[0].includes('```') ? jsonMatch[1] : jsonMatch[0]) as TemplateRecommendation[]
      return recommendations
    } catch (error) {
      throw new Error(`Failed to parse template recommendations: ${error}`)
    }
  }

  private buildAnalysisSystemPrompt(depth: AnalysisDepth): string {
    const basePrompt = `You are Claude Opus, an expert software architect and code analyst with deep expertise in modern development practices, architectural patterns, and code optimization.

Your task is to perform comprehensive analysis of software projects with "ultrathinking" - deep, methodical analysis that considers multiple perspectives and provides actionable insights.

Analysis approach:
1. **Architectural Assessment**: Evaluate overall structure, patterns, and design decisions
2. **Code Quality Review**: Assess maintainability, readability, and adherence to best practices  
3. **Performance Analysis**: Identify bottlenecks, optimization opportunities, and scalability concerns
4. **Security Evaluation**: Check for vulnerabilities, security patterns, and potential risks
5. **Developer Experience**: Assess tooling, workflows, and development efficiency
6. **Testing Strategy**: Evaluate test coverage, quality, and testing approaches
7. **Documentation Quality**: Review code documentation and project documentation
8. **Dependency Management**: Analyze dependencies for security, maintenance, and optimization

Claude Integration Focus:
- Evaluate existing CLAUDE.md and MEMORY.md files
- Assess how well the project is structured for Claude assistance
- Identify opportunities to improve Claude context and productivity
- Recommend Claude-specific optimizations and workflows`

    const depthModifiers = {
      shallow: 'Provide a quick overview focusing on high-level architecture and major issues.',
      deep: 'Perform thorough analysis with detailed reasoning and comprehensive recommendations.',
      comprehensive: 'Conduct exhaustive analysis including detailed code review, security audit, and optimization opportunities.'
    }

    return `${basePrompt}

**Analysis Depth**: ${depth.toUpperCase()}
${depthModifiers[depth]}

Return your analysis as a JSON object matching the AIAnalysisResult schema. Ensure all numeric scores are realistic and well-calibrated.`
  }

  private buildAnalysisUserPrompt(
    projectPath: string, 
    codebaseData: {
      files: Array<{ path: string; content: string; size: number }>
      packageJson?: object
      dependencies?: string[]
      gitHistory?: string[]
      existingClaudeMd?: string
      existingMemory?: string
    }
  ): string {
    return `Analyze this project located at: ${projectPath}

**Codebase Files:**
${codebaseData.files.slice(0, 20).map(file => 
  `\n--- ${file.path} (${file.size} bytes) ---\n${file.content.slice(0, 2000)}${file.content.length > 2000 ? '\n...(truncated)' : ''}`
).join('\n')}

**Package.json:**
${codebaseData.packageJson ? JSON.stringify(codebaseData.packageJson, null, 2) : 'Not found'}

**Dependencies:**
${codebaseData.dependencies?.join(', ') || 'No dependencies found'}

**Existing CLAUDE.md:**
${codebaseData.existingClaudeMd || 'Not found'}

**Existing MEMORY.md:**
${codebaseData.existingMemory || 'Not found'}

**Git History (recent commits):**
${codebaseData.gitHistory?.slice(0, 10).join('\n') || 'No git history available'}

Provide a comprehensive analysis with specific, actionable recommendations. Focus on practical improvements that will have measurable impact.

Return the complete analysis as a JSON object.`
  }

  /**
   * Chat method for conversational interactions
   */
  async chat(input: string, context?: any): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.7,
      system: `You are AWE, an intelligent AI assistant for Claude Code development. 
You help developers optimize their workflows, configure Claude integration, and provide best practices.
Be helpful, concise, and actionable in your responses.`,
      messages: [{
        role: 'user',
        content: `${context ? `Context: ${JSON.stringify(context)}\n\n` : ''}${input}`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  }
}