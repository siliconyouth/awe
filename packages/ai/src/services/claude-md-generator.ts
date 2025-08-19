import Anthropic from '@anthropic-ai/sdk'
import type { Project, ExtractedPattern } from '@prisma/client'

export interface ProjectContext {
  project: Partial<Project>
  patterns: ExtractedPattern[]
  technologies: string[]
  projectType: string
  customInstructions?: string
  includeSections?: string[]
  excludeSections?: string[]
}

export interface ClaudeMdSection {
  title: string
  content: string
  priority: number
  category: 'overview' | 'architecture' | 'patterns' | 'guidelines' | 'workflows' | 'tools' | 'custom'
}

export class ClaudeMdGenerator {
  private anthropic: Anthropic
  
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    this.anthropic = new Anthropic({ apiKey })
  }

  /**
   * Helper method to call Anthropic API
   */
  private async callAI(prompt: string, options?: { source?: string; type?: string }): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
      
      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      
      return ''
    } catch (error) {
      console.error(`AI call failed (${options?.source}/${options?.type}):`, error)
      throw error
    }
  }

  /**
   * Generate a complete CLAUDE.md file for a project
   */
  async generateClaudeMd(context: ProjectContext): Promise<string> {
    const sections = await this.generateSections(context)
    return this.assembleSections(sections, context)
  }

  /**
   * Generate individual sections based on project context
   */
  private async generateSections(context: ProjectContext): Promise<ClaudeMdSection[]> {
    const sections: ClaudeMdSection[] = []

    // 1. Project Overview
    sections.push(await this.generateOverviewSection(context))

    // 2. Architecture & Structure
    if (this.shouldIncludeSection('architecture', context)) {
      sections.push(await this.generateArchitectureSection(context))
    }

    // 3. Applied Patterns
    if (context.patterns.length > 0 && this.shouldIncludeSection('patterns', context)) {
      sections.push(await this.generatePatternsSection(context))
    }

    // 4. Development Guidelines
    if (this.shouldIncludeSection('guidelines', context)) {
      sections.push(await this.generateGuidelinesSection(context))
    }

    // 5. Workflows
    if (this.shouldIncludeSection('workflows', context)) {
      sections.push(await this.generateWorkflowsSection(context))
    }

    // 6. Tools & Commands
    if (this.shouldIncludeSection('tools', context)) {
      sections.push(await this.generateToolsSection(context))
    }

    // 7. Custom Instructions
    if (context.customInstructions) {
      sections.push({
        title: 'Custom Instructions',
        content: context.customInstructions,
        priority: 7,
        category: 'custom'
      })
    }

    return sections.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Generate project overview section
   */
  private async generateOverviewSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { project, technologies, projectType } = context
    
    const prompt = `Generate a concise project overview section for a CLAUDE.md file.

Project Information:
- Name: ${project.name || 'Unnamed Project'}
- Type: ${projectType}
- Technologies: ${technologies.join(', ')}
- Description: ${project.description || 'No description provided'}

Create a brief overview that helps Claude understand:
1. The project's purpose and goals
2. The main technologies and frameworks used
3. Key architectural decisions
4. Important context for development

Keep it concise but informative. Format as markdown.`

    const content = await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'overview-generation'
    })

    return {
      title: 'Project Overview',
      content,
      priority: 1,
      category: 'overview'
    }
  }

  /**
   * Generate architecture section
   */
  private async generateArchitectureSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { project, technologies } = context
    
    const prompt = `Generate an architecture section for a CLAUDE.md file.

Project: ${project.name}
Technologies: ${technologies.join(', ')}
File Count: ${project.fileCount || 'Unknown'}

Create a clear architecture description including:
1. Directory structure and organization
2. Key components and their responsibilities
3. Data flow and communication patterns
4. Important architectural patterns used

Format as markdown with clear headings.`

    const content = await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'architecture-generation'
    })

    return {
      title: 'Architecture',
      content,
      priority: 2,
      category: 'architecture'
    }
  }

  /**
   * Generate patterns section from extracted patterns
   */
  private async generatePatternsSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { patterns } = context
    
    // Group patterns by category
    const groupedPatterns = patterns.reduce((acc, pattern) => {
      const category = pattern.category || 'OTHER'
      if (!acc[category]) acc[category] = []
      acc[category].push(pattern)
      return acc
    }, {} as Record<string, ExtractedPattern[]>)

    let content = '## Applied Patterns\n\n'
    content += 'This project follows these established patterns and best practices:\n\n'

    // Priority order for categories
    const categoryOrder = [
      'BREAKING_CHANGE',
      'API_CHANGE',
      'SECURITY',
      'BEST_PRACTICE',
      'PERFORMANCE',
      'WARNING',
      'CONCEPT',
      'EXAMPLE',
      'OTHER'
    ]

    for (const category of categoryOrder) {
      if (groupedPatterns[category]) {
        content += `### ${category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}\n\n`
        
        for (const pattern of groupedPatterns[category]) {
          content += `- **${pattern.pattern}**`
          if (pattern.description) {
            content += `: ${pattern.description}`
          }
          content += '\n'
        }
        content += '\n'
      }
    }

    return {
      title: 'Applied Patterns',
      content,
      priority: 3,
      category: 'patterns'
    }
  }

  /**
   * Generate development guidelines section
   */
  private async generateGuidelinesSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { project, technologies, patterns } = context
    
    // Extract best practices and warnings from patterns
    const bestPractices = patterns.filter(p => p.category === 'BEST_PRACTICE')
    const warnings = patterns.filter(p => p.category === 'WARNING')
    const security = patterns.filter(p => p.category === 'SECURITY')

    const prompt = `Generate development guidelines for a CLAUDE.md file.

Project: ${project.name}
Technologies: ${technologies.join(', ')}
Best Practices Count: ${bestPractices.length}
Security Patterns: ${security.length}
Warnings: ${warnings.length}

Create comprehensive development guidelines including:
1. Code style and conventions
2. Security best practices
3. Performance considerations
4. Testing requirements
5. Common pitfalls to avoid

Make it specific to the technologies used. Format as markdown.`

    const content = await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'guidelines-generation'
    })

    return {
      title: 'Development Guidelines',
      content,
      priority: 4,
      category: 'guidelines'
    }
  }

  /**
   * Generate workflows section
   */
  private async generateWorkflowsSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { project, technologies } = context
    
    const prompt = `Generate a workflows section for a CLAUDE.md file.

Project: ${project.name}
Technologies: ${technologies.join(', ')}

Create practical workflow descriptions for:
1. Setting up the development environment
2. Common development tasks
3. Testing procedures
4. Deployment process
5. Debugging and troubleshooting

Format as step-by-step instructions in markdown.`

    const content = await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'workflows-generation'
    })

    return {
      title: 'Development Workflows',
      content,
      priority: 5,
      category: 'workflows'
    }
  }

  /**
   * Generate tools and commands section
   */
  private async generateToolsSection(context: ProjectContext): Promise<ClaudeMdSection> {
    const { technologies } = context
    
    const prompt = `Generate a tools and commands section for a CLAUDE.md file.

Technologies: ${technologies.join(', ')}

List essential commands and tools for:
1. Package management
2. Building and compilation
3. Testing
4. Linting and formatting
5. Development server
6. Deployment

Format as a clear command reference in markdown.`

    const content = await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'tools-generation'
    })

    return {
      title: 'Tools & Commands',
      content,
      priority: 6,
      category: 'tools'
    }
  }

  /**
   * Assemble sections into final CLAUDE.md content
   */
  private assembleSections(sections: ClaudeMdSection[], context: ProjectContext): string {
    let content = `# CLAUDE.md - ${context.project.name || 'Project'} Context\n\n`
    content += `*Generated by AWE (Awesome Workspace Engineering) on ${new Date().toISOString()}*\n\n`
    
    // Add metadata comment
    content += `<!-- 
AWE Metadata:
- Project Type: ${context.projectType}
- Technologies: ${context.technologies.join(', ')}
- Patterns Applied: ${context.patterns.length}
- Optimization Score: ${context.project.optimizationLevel || 0}
-->\n\n`

    // Add table of contents
    if (sections.length > 3) {
      content += '## Table of Contents\n\n'
      for (const section of sections) {
        content += `- [${section.title}](#${section.title.toLowerCase().replace(/\s+/g, '-')})\n`
      }
      content += '\n'
    }

    // Add sections
    for (const section of sections) {
      content += `## ${section.title}\n\n`
      content += section.content
      if (!section.content.endsWith('\n\n')) {
        content += '\n\n'
      }
    }

    // Add footer
    content += '---\n\n'
    content += '*This CLAUDE.md file was automatically generated by AWE based on project analysis and applied patterns. '
    content += 'Update it as needed to maintain accuracy.*\n'

    return content
  }

  /**
   * Check if a section should be included
   */
  private shouldIncludeSection(section: string, context: ProjectContext): boolean {
    if (context.excludeSections?.includes(section)) {
      return false
    }
    if (context.includeSections && context.includeSections.length > 0) {
      return context.includeSections.includes(section)
    }
    return true
  }

  /**
   * Optimize existing CLAUDE.md content with patterns
   */
  async optimizeExistingClaudeMd(
    existingContent: string, 
    patterns: ExtractedPattern[]
  ): Promise<string> {
    const prompt = `Optimize this existing CLAUDE.md file with new patterns and best practices.

Existing CLAUDE.md:
${existingContent}

New Patterns to Apply (${patterns.length} total):
${patterns.slice(0, 20).map(p => `- ${p.pattern}: ${p.description}`).join('\n')}

Please:
1. Integrate relevant new patterns
2. Update any outdated information
3. Improve clarity and organization
4. Ensure all sections are comprehensive
5. Maintain the original structure where appropriate

Return the complete optimized CLAUDE.md content.`

    return await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'optimization'
    })
  }

  /**
   * Generate a minimal CLAUDE.md for quick start
   */
  async generateMinimalClaudeMd(
    projectName: string,
    projectType: string,
    technologies: string[]
  ): Promise<string> {
    const prompt = `Generate a minimal but effective CLAUDE.md file for:
- Project: ${projectName}
- Type: ${projectType}
- Technologies: ${technologies.join(', ')}

Create a concise file with only essential sections:
1. Brief overview
2. Key technologies and setup
3. Most important commands
4. Critical guidelines

Keep it under 100 lines but make it immediately useful.`

    return await this.callAI(prompt, {
      source: 'claude-md-generator',
      type: 'minimal-generation'
    })
  }
}