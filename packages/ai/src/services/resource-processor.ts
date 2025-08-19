/**
 * Resource Processor Service
 * Handles processing of different file types for the Resource Hub
 * Converts various formats to Claude-friendly markdown when needed
 */

import { readFileSync } from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

export interface ProcessedResource {
  title: string
  description: string
  content: string
  rawContent: string
  fileType: string
  type: string
  category?: string
  tags: string[]
  keywords: string[]
  author?: string
  authorGithub?: string
  sourceUrl?: string
  sourceRepo?: string
  license?: string
  metadata?: any
}

export class ResourceProcessor {
  /**
   * Process a resource file and extract structured data
   */
  static async processFile(
    filePath: string,
    fileContent: string,
    additionalMetadata?: any
  ): Promise<ProcessedResource> {
    const fileExt = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath, fileExt)
    
    // Determine file type
    const fileType = this.getFileType(fileExt)
    
    // Process based on file type
    let processed: ProcessedResource
    
    switch (fileType) {
      case 'markdown':
        processed = await this.processMarkdown(fileContent, fileName)
        break
      case 'yaml':
        processed = await this.processYaml(fileContent, fileName)
        break
      case 'json':
        processed = await this.processJson(fileContent, fileName)
        break
      case 'javascript':
      case 'typescript':
        processed = await this.processCode(fileContent, fileName, fileType)
        break
      case 'shell':
        processed = await this.processShell(fileContent, fileName)
        break
      default:
        processed = await this.processGeneric(fileContent, fileName, fileType)
    }
    
    // Merge with additional metadata
    if (additionalMetadata) {
      processed = { ...processed, ...additionalMetadata }
    }
    
    // Auto-categorize if not set
    if (!processed.type) {
      processed.type = this.inferResourceType(filePath, fileContent)
    }
    
    // Extract keywords if not present
    if (!processed.keywords || processed.keywords.length === 0) {
      processed.keywords = this.extractKeywords(fileContent)
    }
    
    return processed
  }
  
  /**
   * Determine file type from extension
   */
  private static getFileType(ext: string): string {
    const typeMap: Record<string, string> = {
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.mdx': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.json': 'json',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.sh': 'shell',
      '.bash': 'shell',
      '.zsh': 'shell',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.txt': 'text',
      '': 'text' // No extension
    }
    
    return typeMap[ext] || 'unknown'
  }
  
  /**
   * Process Markdown files
   */
  private static async processMarkdown(
    content: string,
    fileName: string
  ): Promise<ProcessedResource> {
    // Extract frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let metadata: any = {}
    let mainContent = content
    
    if (frontmatterMatch) {
      try {
        metadata = yaml.load(frontmatterMatch[1]) as any
        mainContent = content.slice(frontmatterMatch[0].length).trim()
      } catch (e) {
        console.warn('Failed to parse frontmatter:', e)
      }
    }
    
    // Extract title from first heading or frontmatter
    const title = metadata.title || 
      mainContent.match(/^#\s+(.+)$/m)?.[1] || 
      fileName
    
    // Extract description from frontmatter or first paragraph
    const description = metadata.description || 
      mainContent.match(/^(?!#)(.+)$/m)?.[1]?.slice(0, 200) || 
      'No description available'
    
    // Extract tags from frontmatter or content
    const tags = metadata.tags || this.extractHashtags(content)
    
    return {
      title,
      description,
      content: mainContent,
      rawContent: content,
      fileType: 'markdown',
      type: metadata.type || 'guide',
      category: metadata.category,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      keywords: metadata.keywords || [],
      author: metadata.author,
      authorGithub: metadata.authorGithub,
      sourceUrl: metadata.sourceUrl,
      sourceRepo: metadata.sourceRepo,
      license: metadata.license,
      metadata
    }
  }
  
  /**
   * Process YAML files
   */
  private static async processYaml(
    content: string,
    fileName: string
  ): Promise<ProcessedResource> {
    let data: any = {}
    
    try {
      data = yaml.load(content) as any
    } catch (e) {
      console.warn('Failed to parse YAML:', e)
    }
    
    // Convert YAML to markdown for display
    const markdownContent = `# ${data.name || fileName}

${data.description || 'YAML Configuration'}

\`\`\`yaml
${content}
\`\`\`

${data.documentation || ''}`
    
    return {
      title: data.name || fileName,
      description: data.description || 'YAML configuration file',
      content: markdownContent,
      rawContent: content,
      fileType: 'yaml',
      type: 'config',
      category: data.category,
      tags: data.tags || ['configuration', 'yaml'],
      keywords: [],
      author: data.author,
      authorGithub: data.authorGithub,
      sourceUrl: data.sourceUrl,
      sourceRepo: data.sourceRepo,
      license: data.license,
      metadata: data
    }
  }
  
  /**
   * Process JSON files
   */
  private static async processJson(
    content: string,
    fileName: string
  ): Promise<ProcessedResource> {
    let data: any = {}
    
    try {
      data = JSON.parse(content)
    } catch (e) {
      console.warn('Failed to parse JSON:', e)
    }
    
    // Convert JSON to markdown for display
    const markdownContent = `# ${data.name || fileName}

${data.description || 'JSON Configuration'}

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

${data.documentation || ''}`
    
    return {
      title: data.name || fileName,
      description: data.description || 'JSON configuration file',
      content: markdownContent,
      rawContent: content,
      fileType: 'json',
      type: 'config',
      category: data.category,
      tags: data.tags || ['configuration', 'json'],
      keywords: [],
      author: data.author,
      authorGithub: data.authorGithub,
      sourceUrl: data.sourceUrl,
      sourceRepo: data.sourceRepo,
      license: data.license,
      metadata: data
    }
  }
  
  /**
   * Process JavaScript/TypeScript code files
   */
  private static async processCode(
    content: string,
    fileName: string,
    language: string
  ): Promise<ProcessedResource> {
    // Extract JSDoc comments
    const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//)
    let description = 'Code snippet'
    
    if (jsdocMatch) {
      const jsdoc = jsdocMatch[1]
      const descMatch = jsdoc.match(/@description\s+(.+)/) || 
                       jsdoc.match(/^\s*\*\s+([^@].+)/m)
      if (descMatch) {
        description = descMatch[1].trim()
      }
    }
    
    // Check if it's a command file
    const isCommand = fileName.includes('command') || 
                     content.includes('slash-command') ||
                     content.includes('//')
    
    // Create markdown representation
    const markdownContent = `# ${fileName}

${description}

\`\`\`${language}
${content}
\`\`\``
    
    return {
      title: fileName,
      description,
      content: markdownContent,
      rawContent: content,
      fileType: language,
      type: isCommand ? 'command' : 'pattern',
      category: undefined,
      tags: [language],
      keywords: [],
      author: undefined,
      authorGithub: undefined,
      sourceUrl: undefined,
      sourceRepo: undefined,
      license: undefined,
      metadata: {}
    }
  }
  
  /**
   * Process Shell scripts
   */
  private static async processShell(
    content: string,
    fileName: string
  ): Promise<ProcessedResource> {
    // Extract description from comments
    const descMatch = content.match(/^#\s+(.+)$/m)
    const description = descMatch?.[1] || 'Shell script'
    
    // Check if it's a hook
    const isHook = fileName.includes('hook') || 
                  content.includes('pre-commit') ||
                  content.includes('post-')
    
    const markdownContent = `# ${fileName}

${description}

\`\`\`bash
${content}
\`\`\``
    
    return {
      title: fileName,
      description,
      content: markdownContent,
      rawContent: content,
      fileType: 'shell',
      type: isHook ? 'hook' : 'command',
      category: undefined,
      tags: ['shell', 'bash'],
      keywords: [],
      author: undefined,
      authorGithub: undefined,
      sourceUrl: undefined,
      sourceRepo: undefined,
      license: undefined,
      metadata: {}
    }
  }
  
  /**
   * Process generic text files
   */
  private static async processGeneric(
    content: string,
    fileName: string,
    fileType: string
  ): Promise<ProcessedResource> {
    const markdownContent = `# ${fileName}

\`\`\`${fileType}
${content}
\`\`\``
    
    return {
      title: fileName,
      description: `${fileType} file`,
      content: markdownContent,
      rawContent: content,
      fileType,
      type: 'example',
      category: undefined,
      tags: [fileType],
      keywords: [],
      author: undefined,
      authorGithub: undefined,
      sourceUrl: undefined,
      sourceRepo: undefined,
      license: undefined,
      metadata: {}
    }
  }
  
  /**
   * Infer resource type from file path and content
   */
  private static inferResourceType(filePath: string, content: string): string {
    const pathLower = filePath.toLowerCase()
    const contentLower = content.toLowerCase()
    
    if (pathLower.includes('template') || contentLower.includes('template')) {
      return 'template'
    }
    if (pathLower.includes('command') || contentLower.includes('slash-command')) {
      return 'command'
    }
    if (pathLower.includes('hook') || contentLower.includes('pre-commit')) {
      return 'hook'
    }
    if (pathLower.includes('workflow') || contentLower.includes('workflow')) {
      return 'workflow'
    }
    if (pathLower.includes('pattern') || contentLower.includes('pattern')) {
      return 'pattern'
    }
    if (pathLower.includes('config') || pathLower.includes('.config')) {
      return 'config'
    }
    if (pathLower.includes('guide') || pathLower.includes('tutorial')) {
      return 'guide'
    }
    
    return 'example'
  }
  
  /**
   * Extract keywords from content
   */
  private static extractKeywords(content: string): string[] {
    const keywords = new Set<string>()
    
    // Common programming keywords
    const commonKeywords = [
      'typescript', 'javascript', 'python', 'react', 'vue', 'angular',
      'nextjs', 'nodejs', 'express', 'fastapi', 'django', 'rails',
      'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes',
      'aws', 'gcp', 'azure', 'vercel', 'netlify', 'supabase',
      'testing', 'jest', 'vitest', 'playwright', 'cypress',
      'tailwind', 'css', 'sass', 'styled-components',
      'graphql', 'rest', 'api', 'websocket', 'grpc'
    ]
    
    const contentLower = content.toLowerCase()
    for (const keyword of commonKeywords) {
      if (contentLower.includes(keyword)) {
        keywords.add(keyword)
      }
    }
    
    return Array.from(keywords)
  }
  
  /**
   * Extract hashtags from content
   */
  private static extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g) || []
    return hashtags.map(tag => tag.slice(1).toLowerCase())
  }
}