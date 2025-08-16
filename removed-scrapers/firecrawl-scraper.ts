import FirecrawlApp from '@mendable/firecrawl-js'

export interface FirecrawlConfig {
  apiKey?: string
  apiUrl?: string // For self-hosted instances
  selfHosted?: boolean // Flag to indicate self-hosted mode
}

export interface ScrapedPage {
  url: string
  title: string
  markdown: string
  links?: string[]
  metadata?: {
    sourceURL: string
    statusCode?: number
    error?: string
  }
}

export interface CrawlResult {
  pages: ScrapedPage[]
  totalPages: number
  patterns: ExtractedPattern[]
}

export interface ExtractedPattern {
  type: 'configuration' | 'best-practice' | 'code-example' | 'anti-pattern' | 'documentation'
  name: string
  description: string
  content: any
  source: string
  confidence: number
}

export class FirecrawlScraper {
  private firecrawl: FirecrawlApp | null = null
  private db: any // Database client passed from CLI
  private selfHosted: boolean = false
  
  constructor(config?: FirecrawlConfig, db?: any) {
    // Initialize for self-hosted (no API key required) or cloud (API key required)
    if (config?.selfHosted && config?.apiUrl) {
      // Self-hosted mode - use a dummy API key if none provided
      this.firecrawl = new FirecrawlApp({
        apiKey: config.apiKey || 'self-hosted',
        apiUrl: config.apiUrl
      })
      this.selfHosted = true
      console.log(`🏠 Using self-hosted Firecrawl at ${config.apiUrl}`)
    } else if (config?.apiKey) {
      // Cloud mode with API key
      this.firecrawl = new FirecrawlApp({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl || 'https://api.firecrawl.dev'
      })
      console.log('☁️  Using Firecrawl Cloud API')
    }
    this.db = db
  }

  /**
   * Check if Firecrawl is configured
   */
  isConfigured(): boolean {
    return this.firecrawl !== null
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(url: string): Promise<ScrapedPage | null> {
    if (!this.firecrawl) {
      console.warn('⚠️  Firecrawl not configured. Please provide API key or self-hosted URL.')
      return null
    }

    try {
      console.log(`📄 Scraping ${url}...`)
      
      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'links'],
        onlyMainContent: true
      })

      if (!result.success) {
        throw new Error(result.error || 'Scraping failed')
      }

      return {
        url,
        title: result.metadata?.title || 'Untitled',
        markdown: result.markdown || '',
        links: result.links || [],
        metadata: result.metadata ? {
          sourceURL: result.metadata.sourceURL || url,
          statusCode: result.metadata.statusCode,
          error: result.metadata.error
        } : undefined
      }
    } catch (error: any) {
      console.error(`❌ Failed to scrape ${url}:`, error.message)
      return null
    }
  }

  /**
   * Crawl a website with depth
   */
  async crawlWebsite(url: string, options?: {
    maxPages?: number
    maxDepth?: number
    includePaths?: string[]
    excludePaths?: string[]
  }): Promise<CrawlResult> {
    if (!this.firecrawl) {
      console.warn('⚠️  Firecrawl API key not configured. Skipping crawling.')
      return { pages: [], totalPages: 0, patterns: [] }
    }

    try {
      console.log(`🌐 Crawling ${url}...`)
      
      const crawlResult = await this.firecrawl.crawlUrl(url, {
        limit: options?.maxPages || 10,
        maxDepth: options?.maxDepth || 2,
        includePaths: options?.includePaths,
        excludePaths: options?.excludePaths,
        scrapeOptions: {
          formats: ['markdown', 'links'],
          onlyMainContent: true
        }
      })

      if (!crawlResult.success) {
        throw new Error(crawlResult.error || 'Crawling failed')
      }

      // Wait for crawl to complete
      let crawlId = (crawlResult as any).id || (crawlResult as any).crawl_id
      if (!crawlId) {
        throw new Error('No crawl ID returned')
      }
      
      let status: any = await this.firecrawl.checkCrawlStatus(crawlId)
      
      while (status.status === 'scraping' || status.status === 'processing') {
        const completed = status.completed || status.current || 0
        const total = status.total || 0
        console.log(`⏳ Crawling progress: ${completed}/${total} pages`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        status = await this.firecrawl.checkCrawlStatus(crawlId)
      }

      if (status.status === 'failed') {
        throw new Error('Crawl failed')
      }

      const pages: ScrapedPage[] = (status.data || []).map((page: any) => ({
        url: page.url,
        title: page.metadata?.title || 'Untitled',
        markdown: page.markdown || '',
        links: page.links || [],
        metadata: page.metadata
      }))

      // Extract patterns from crawled content
      const patterns = this.extractPatterns(pages)

      // Store in database if available
      if (this.db) {
        await this.storeInDatabase(url, pages, patterns)
      }

      return {
        pages,
        totalPages: pages.length,
        patterns
      }
    } catch (error: any) {
      console.error(`❌ Failed to crawl ${url}:`, error.message)
      return { pages: [], totalPages: 0, patterns: [] }
    }
  }

  /**
   * Scrape multiple URLs efficiently
   */
  async batchScrape(urls: string[]): Promise<ScrapedPage[]> {
    if (!this.firecrawl) {
      console.warn('⚠️  Firecrawl API key not configured. Skipping batch scraping.')
      return []
    }

    try {
      console.log(`📦 Batch scraping ${urls.length} URLs...`)
      
      const results = await this.firecrawl.batchScrapeUrls(urls, {
        formats: ['markdown', 'links'],
        onlyMainContent: true
      })

      if (!results.success) {
        throw new Error(results.error || 'Batch scraping failed')  
      }

      // Wait for batch to complete
      let batchId = (results as any).id || (results as any).batch_id
      if (!batchId) {
        throw new Error('No batch ID returned')
      }
      
      // Use checkCrawlStatus for batch operations as well
      let status: any = await this.firecrawl.checkCrawlStatus(batchId)
      
      while (status.status === 'scraping' || status.status === 'processing') {
        const completed = status.completed || status.current || 0
        const total = status.total || 0
        console.log(`⏳ Batch progress: ${completed}/${total} URLs`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        status = await this.firecrawl.checkCrawlStatus(batchId)
      }

      return (status.data || []).map((page: any) => ({
        url: page.url,
        title: page.metadata?.title || 'Untitled',
        markdown: page.markdown || '',
        links: page.links || [],
        metadata: page.metadata
      }))
    } catch (error: any) {
      console.error(`❌ Batch scraping failed:`, error.message)
      return []
    }
  }

  /**
   * Map a website to discover all URLs
   */
  async mapWebsite(url: string): Promise<string[]> {
    if (!this.firecrawl) {
      console.warn('⚠️  Firecrawl API key not configured.')
      return []
    }

    try {
      console.log(`🗺️  Mapping ${url}...`)
      
      const result = await this.firecrawl.mapUrl(url, {
        limit: 100,
        includeSubdomains: false
      })

      if (!result.success) {
        throw new Error(result.error || 'Mapping failed')
      }

      const links = result.links || []
      console.log(`✅ Found ${links.length} URLs`)
      return links
    } catch (error: any) {
      console.error(`❌ Failed to map ${url}:`, error.message)
      return []
    }
  }

  /**
   * Extract structured data using LLM
   */
  async extractStructuredData(url: string, schema: any, prompt?: string): Promise<any> {
    if (!this.firecrawl) {
      console.warn('⚠️  Firecrawl API key not configured.')
      return null
    }

    try {
      console.log(`🔍 Extracting structured data from ${url}...`)
      
      const result = await this.firecrawl.extract([url], {
        schema,
        prompt: prompt || 'Extract the relevant information according to the schema'
      })

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed')
      }

      return result.data
    } catch (error: any) {
      console.error(`❌ Failed to extract from ${url}:`, error.message)
      return null
    }
  }

  /**
   * Extract patterns from scraped content
   */
  extractPatterns(pages: ScrapedPage[]): ExtractedPattern[] {
    const patterns: ExtractedPattern[] = []

    for (const page of pages) {
      const content = page.markdown.toLowerCase()

      // Look for CLAUDE.md patterns
      if (content.includes('claude.md') || content.includes('claude code')) {
        patterns.push({
          type: 'documentation',
          name: 'Claude Code Reference',
          description: `Claude Code documentation found in ${page.title}`,
          content: { url: page.url, context: this.extractContext(page.markdown, 'claude') },
          source: page.url,
          confidence: 0.9
        })
      }

      // Look for configuration patterns
      if (content.includes('configuration') || content.includes('setup') || content.includes('install')) {
        patterns.push({
          type: 'configuration',
          name: `Configuration from ${page.title}`,
          description: 'Configuration or setup instructions',
          content: { url: page.url, markdown: page.markdown.substring(0, 1000) },
          source: page.url,
          confidence: 0.7
        })
      }

      // Extract code blocks
      const codeBlocks = page.markdown.match(/```[\s\S]*?```/g) || []
      for (const block of codeBlocks) {
        if (block.length > 100) {
          patterns.push({
            type: 'code-example',
            name: `Code example from ${page.title}`,
            description: 'Code snippet extracted from documentation',
            content: { code: block, url: page.url },
            source: page.url,
            confidence: 0.8
          })
        }
      }

      // Look for best practices
      if (content.includes('best practice') || content.includes('recommended') || content.includes('should')) {
        patterns.push({
          type: 'best-practice',
          name: `Best practice from ${page.title}`,
          description: 'Recommended approach or best practice',
          content: { url: page.url, context: this.extractContext(page.markdown, 'best|recommend|should') },
          source: page.url,
          confidence: 0.75
        })
      }

      // Look for anti-patterns
      if (content.includes('avoid') || content.includes('don\'t') || content.includes('anti-pattern')) {
        patterns.push({
          type: 'anti-pattern',
          name: `Anti-pattern from ${page.title}`,
          description: 'Practice to avoid',
          content: { url: page.url, context: this.extractContext(page.markdown, 'avoid|don\'t|anti') },
          source: page.url,
          confidence: 0.75
        })
      }
    }

    return patterns
  }

  /**
   * Extract context around keywords
   */
  private extractContext(text: string, keywords: string, contextLength: number = 200): string {
    const regex = new RegExp(`(${keywords})`, 'gi')
    const match = text.match(regex)
    
    if (!match) return ''
    
    const index = text.toLowerCase().indexOf(match[0].toLowerCase())
    const start = Math.max(0, index - contextLength)
    const end = Math.min(text.length, index + contextLength)
    
    return text.substring(start, end).trim()
  }

  /**
   * Store scraped content in database
   */
  private async storeInDatabase(sourceUrl: string, pages: ScrapedPage[], patterns: ExtractedPattern[]) {
    if (!this.db) return

    try {
      // Find or create knowledge source
      let source = await this.db.knowledgeSource.findFirst({
        where: { url: sourceUrl }
      })

      if (!source) {
        source = await this.db.knowledgeSource.create({
          data: {
            name: new URL(sourceUrl).hostname,
            type: 'documentation',
            url: sourceUrl,
            scrapeConfig: { type: 'firecrawl' },
            frequency: 'weekly',
            lastScraped: new Date()
          }
        })
      } else {
        await this.db.knowledgeSource.update({
          where: { id: source.id },
          data: { lastScraped: new Date() }
        })
      }

      // Store knowledge update
      await this.db.knowledgeUpdate.create({
        data: {
          sourceId: source.id,
          content: { pages, patterns },
          patternsFound: patterns.length,
          processed: true,
          processedAt: new Date()
        }
      })

      // Store patterns
      for (const pattern of patterns) {
        await this.db.knowledgePattern.create({
          data: {
            type: pattern.type,
            category: pattern.type,
            name: pattern.name,
            description: pattern.description,
            pattern: pattern.content,
            confidence: pattern.confidence,
            source: source.name,
            sourceUrl: pattern.source
          }
        })
      }

      console.log(`✅ Stored ${pages.length} pages and ${patterns.length} patterns in database`)
    } catch (error: any) {
      console.error('Failed to store in database:', error.message)
    }
  }
}