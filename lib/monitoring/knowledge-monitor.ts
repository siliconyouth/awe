import { SmartScraper, ScrapedPage } from '@awe/ai'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

export interface MonitorConfig {
  db: PrismaClient
  scraper?: SmartScraper
  aiService?: AIAnalysisService
}

export interface ChangeResult {
  changed: boolean
  content?: ScrapedPage
  newHash?: string
  changeType?: 'MAJOR' | 'MINOR' | 'PATCH'
  changelog?: string
}

export interface AnalysisContext {
  sourceId: string
  name: string
  description?: string
  category: string
  aiPrompt?: string
  extractionRules?: any
}

export class KnowledgeMonitor {
  private db: PrismaClient
  private scraper: SmartScraper
  private aiService?: AIAnalysisService
  
  constructor(config: MonitorConfig) {
    this.db = config.db
    this.scraper = config.scraper || new SmartScraper({
      headless: true,
      cacheEnabled: false, // Always get fresh content
      maxConcurrency: 1
    })
    this.aiService = config.aiService
  }

  /**
   * Check a source for changes
   */
  async checkSource(source: any): Promise<ChangeResult> {
    try {
      // Scrape current content
      const content = await this.scraper.scrape(source.url)
      
      // Calculate content hash
      const newHash = this.hashContent(content.content)
      
      // Check if changed
      if (newHash !== source.contentHash) {
        const changeType = await this.detectChangeType(source, content, newHash)
        const changelog = await this.generateChangelog(source, content)
        
        return {
          changed: true,
          content,
          newHash,
          changeType,
          changelog
        }
      }
      
      // Update last checked
      await this.db.knowledgeSource.update({
        where: { id: source.id },
        data: { lastChecked: new Date() }
      })
      
      return { changed: false }
    } catch (error) {
      // Handle errors
      await this.handleSourceError(source, error)
      throw error
    }
  }

  /**
   * Process detected changes
   */
  async processChange(source: any, change: ChangeResult): Promise<void> {
    // Create new version
    const version = await this.createVersion(source, change.content!)
    
    // Update source
    await this.db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        lastChecked: new Date(),
        lastChanged: new Date(),
        contentHash: change.newHash,
        errorCount: 0,
        lastError: null
      }
    })
    
    // Extract patterns with AI if available
    if (this.aiService) {
      const patterns = await this.extractPatterns(
        change.content!,
        {
          sourceId: source.id,
          name: source.name,
          description: source.description,
          category: source.category,
          aiPrompt: source.aiPrompt,
          extractionRules: source.extractionRules
        }
      )
      
      // Store patterns for review
      await this.storePatterns(source, version, patterns)
      
      // Send notification for review (implement based on your notification system)
      await this.notifyForReview(source, version, patterns)
    }
  }

  /**
   * Create a new version of content
   */
  private async createVersion(source: any, content: ScrapedPage): Promise<any> {
    // Get latest version number
    const latestVersion = await this.db.knowledgeVersion.findFirst({
      where: { sourceId: source.id },
      orderBy: { version: 'desc' }
    })
    
    const nextVersion = (latestVersion?.version || 0) + 1
    
    // Store large content in S3/R2 if configured
    const s3Key = content.content.length > 100000 
      ? await this.uploadToS3(source.id, nextVersion, content)
      : null
    
    // Create version record
    return await this.db.knowledgeVersion.create({
      data: {
        sourceId: source.id,
        version: nextVersion,
        timestamp: new Date(),
        rawContent: s3Key ? '' : content.content,
        markdown: content.markdown || '',
        summary: await this.generateSummary(content),
        title: content.title,
        wordCount: content.content.split(/\s+/).length,
        links: content.links,
        images: content.images,
        changeType: null, // Will be set based on change detection
        changelog: null,
        s3Key
      }
    })
  }

  /**
   * Extract patterns using AI
   */
  private async extractPatterns(
    content: ScrapedPage,
    context: AnalysisContext
  ): Promise<any[]> {
    if (!this.aiService) return []
    
    const prompt = context.aiPrompt || this.getDefaultPrompt(context.category)
    
    const analysis = await this.aiService.analyze(content, {
      prompt,
      context: context.description,
      category: context.category,
      extractionRules: context.extractionRules
    })
    
    return analysis.patterns.map((pattern: any) => ({
      ...pattern,
      sourceId: context.sourceId,
      status: 'PENDING',
      confidence: pattern.confidence || 0.7
    }))
  }

  /**
   * Store extracted patterns
   */
  private async storePatterns(source: any, version: any, patterns: any[]): Promise<void> {
    for (const pattern of patterns) {
      await this.db.extractedPattern.create({
        data: {
          sourceId: source.id,
          versionId: version.id,
          type: pattern.type,
          name: pattern.name,
          content: pattern.content,
          aiAnalysis: pattern.aiAnalysis,
          confidence: pattern.confidence,
          status: 'PENDING',
          category: pattern.category || source.category,
          tags: pattern.tags || [],
          useCases: pattern.useCases || []
        }
      })
    }
  }

  /**
   * Detect type of change
   */
  private async detectChangeType(
    source: any,
    newContent: ScrapedPage,
    newHash: string
  ): Promise<'MAJOR' | 'MINOR' | 'PATCH'> {
    // Get previous version
    const previousVersion = await this.db.knowledgeVersion.findFirst({
      where: { sourceId: source.id },
      orderBy: { version: 'desc' }
    })
    
    if (!previousVersion) return 'MAJOR'
    
    // Compare word counts
    const wordDiff = Math.abs(
      newContent.content.split(/\s+/).length - previousVersion.wordCount
    )
    const percentChange = wordDiff / previousVersion.wordCount
    
    // Determine change type
    if (percentChange > 0.3) return 'MAJOR'
    if (percentChange > 0.1) return 'MINOR'
    return 'PATCH'
  }

  /**
   * Generate changelog
   */
  private async generateChangelog(source: any, content: ScrapedPage): Promise<string> {
    if (!this.aiService) {
      return `Content updated on ${new Date().toISOString()}`
    }
    
    const previousVersion = await this.db.knowledgeVersion.findFirst({
      where: { sourceId: source.id },
      orderBy: { version: 'desc' }
    })
    
    if (!previousVersion) {
      return 'Initial version captured'
    }
    
    return await this.aiService.generateChangelog(
      previousVersion.markdown,
      content.markdown || content.content
    )
  }

  /**
   * Generate summary
   */
  private async generateSummary(content: ScrapedPage): Promise<string> {
    if (!this.aiService) {
      return content.content.substring(0, 500)
    }
    
    return await this.aiService.summarize(content.markdown || content.content)
  }

  /**
   * Handle source errors
   */
  private async handleSourceError(source: any, error: any): Promise<void> {
    const errorCount = source.errorCount + 1
    const status = errorCount > 5 ? 'ERROR' : source.status
    
    await this.db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        errorCount,
        lastError: error.message,
        status,
        lastChecked: new Date()
      }
    })
  }

  /**
   * Upload to S3/R2
   */
  private async uploadToS3(
    sourceId: string,
    version: number,
    content: ScrapedPage
  ): Promise<string> {
    // Implement S3/R2 upload
    // This is a placeholder
    const key = `knowledge/${sourceId}/v${version}/content.json`
    // await s3.upload({ Key: key, Body: JSON.stringify(content) })
    return key
  }

  /**
   * Get default prompt for category
   */
  private getDefaultPrompt(category: string): string {
    const prompts: Record<string, string> = {
      documentation: `
        Extract technical documentation patterns including:
        - API usage examples
        - Configuration patterns
        - Best practices
        - Common pitfalls
        - Integration guides
      `,
      blog: `
        Extract insights and patterns from blog content:
        - Key concepts explained
        - Code examples
        - Tutorials and guides
        - Tips and tricks
        - Author recommendations
      `,
      api: `
        Extract API patterns:
        - Endpoint structures
        - Authentication methods
        - Request/response formats
        - Error handling patterns
        - Rate limiting info
      `,
      changelog: `
        Extract change information:
        - New features
        - Breaking changes
        - Bug fixes
        - Deprecations
        - Migration guides
      `
    }
    
    return prompts[category] || prompts.documentation
  }

  /**
   * Notify for review
   */
  private async notifyForReview(source: any, version: any, patterns: any[]): Promise<void> {
    // Implement notification logic
    // Could be email, Slack, Discord, etc.
    console.log(`New patterns ready for review:
      Source: ${source.name}
      Version: ${version.version}
      Patterns: ${patterns.length}
    `)
  }

  /**
   * Hash content for comparison
   */
  private hashContent(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.scraper.close()
  }
}

/**
 * AI Analysis Service Interface
 */
export interface AIAnalysisService {
  analyze(content: ScrapedPage, options: any): Promise<any>
  summarize(content: string): Promise<string>
  generateChangelog(oldContent: string, newContent: string): Promise<string>
}