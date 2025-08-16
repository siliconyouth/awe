// Types will be passed in from the CLI layer
export interface DatabaseClient {
  knowledgeSource: any
  knowledgeUpdate: any
  knowledgePattern: any
  $connect: () => Promise<void>
  $disconnect: () => Promise<void>
}

export interface ScraperConfig {
  url: string
  selectors: {
    title?: string
    content?: string
    code?: string
    links?: string
  }
  frequency: 'daily' | 'weekly' | 'monthly'
  maxDepth?: number
}

export interface ScrapedContent {
  url: string
  title: string
  content: string
  codeExamples: string[]
  metadata: {
    scrapedAt: Date
    contentHash: string
    wordCount: number
  }
}

export class DocumentationScraper {
  private db: DatabaseClient | null
  private sources: Map<string, ScraperConfig>
  
  constructor(db?: DatabaseClient) {
    this.db = db || null
    this.sources = new Map()
    this.initializeSources()
  }

  /**
   * Initialize default documentation sources
   */
  private initializeSources() {
    // Claude documentation
    this.sources.set('claude-docs', {
      url: 'https://docs.anthropic.com/en/docs/claude-code',
      selectors: {
        title: 'h1, h2',
        content: 'main, article, .content',
        code: 'pre code, .code-block',
        links: 'a[href^="/docs"]'
      },
      frequency: 'weekly',
      maxDepth: 3
    })

    // Next.js documentation (for web development patterns)
    this.sources.set('nextjs-docs', {
      url: 'https://nextjs.org/docs',
      selectors: {
        title: 'h1',
        content: '.docs-content',
        code: 'pre code',
        links: 'a[href^="/docs"]'
      },
      frequency: 'weekly',
      maxDepth: 2
    })

    // React patterns
    this.sources.set('react-patterns', {
      url: 'https://react.dev/learn',
      selectors: {
        title: 'h1',
        content: 'article',
        code: 'pre code',
        links: 'a[href^="/learn"]'
      },
      frequency: 'monthly',
      maxDepth: 2
    })
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(url: string, config: ScraperConfig): Promise<ScrapedContent> {
    try {
      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AWE-Bot/1.0 (Knowledge Gathering for Development Assistance)'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }

      const html = await response.text()
      
      // Parse HTML (simplified - in production use cheerio or jsdom)
      const content = this.extractContent(html, config.selectors)
      
      return {
        url,
        title: content.title,
        content: content.text,
        codeExamples: content.code,
        metadata: {
          scrapedAt: new Date(),
          contentHash: this.hashContent(content.text),
          wordCount: content.text.split(/\s+/).length
        }
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error)
      throw error
    }
  }

  /**
   * Extract content from HTML
   */
  private extractContent(html: string, selectors: ScraperConfig['selectors']) {
    // Simplified extraction - in production use proper HTML parser
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    const codeMatches = html.match(/<code[^>]*>(.*?)<\/code>/gi) || []
    
    // Remove HTML tags for content
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      text: textContent,
      code: codeMatches.map(match => match.replace(/<[^>]+>/g, ''))
    }
  }

  /**
   * Scrape all configured sources
   */
  async scrapeAllSources(): Promise<Map<string, ScrapedContent[]>> {
    const results = new Map<string, ScrapedContent[]>()
    
    for (const [name, config] of this.sources) {
      console.log(`📊 Scraping ${name}...`)
      try {
        const content = await this.scrapeWithDepth(config.url, config, config.maxDepth || 1)
        results.set(name, content)
        
        // Store in database if available
        if (this.db) {
          await this.storeScrapedContent(name, content)
        }
      } catch (error) {
        console.error(`Failed to scrape ${name}:`, error)
      }
    }
    
    return results
  }

  /**
   * Scrape with depth (follow links)
   */
  private async scrapeWithDepth(
    url: string, 
    config: ScraperConfig, 
    depth: number,
    visited: Set<string> = new Set()
  ): Promise<ScrapedContent[]> {
    if (depth <= 0 || visited.has(url)) {
      return []
    }

    visited.add(url)
    const results: ScrapedContent[] = []

    try {
      const content = await this.scrapeUrl(url, config)
      results.push(content)

      // Extract and follow links (simplified)
      if (depth > 1 && config.selectors.links) {
        const links = this.extractLinks(content.content, url)
        
        for (const link of links.slice(0, 10)) { // Limit to 10 links per page
          const subContent = await this.scrapeWithDepth(link, config, depth - 1, visited)
          results.push(...subContent)
        }
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
    }

    return results
  }

  /**
   * Extract links from content
   */
  private extractLinks(content: string, baseUrl: string): string[] {
    const linkMatches = content.match(/https?:\/\/[^\s<>"]+/g) || []
    const base = new URL(baseUrl)
    
    return linkMatches
      .map(link => {
        try {
          const url = new URL(link, baseUrl)
          // Only follow same-domain links
          if (url.hostname === base.hostname) {
            return url.href
          }
        } catch {}
        return null
      })
      .filter((link): link is string => link !== null)
  }

  /**
   * Store scraped content in database
   */
  private async storeScrapedContent(sourceName: string, content: ScrapedContent[]) {
    if (!this.db) return

    try {
      // Find or create knowledge source
      let source = await this.db.knowledgeSource.findUnique({
        where: { name: sourceName }
      })

      if (!source) {
        const config = this.sources.get(sourceName)!
        source = await this.db.knowledgeSource.create({
          data: {
            name: sourceName,
            type: 'documentation',
            url: config.url,
            scrapeConfig: config as any,
            frequency: config.frequency,
            lastScraped: new Date()
          }
        })
      }

      // Store knowledge update
      const update = await this.db.knowledgeUpdate.create({
        data: {
          sourceId: source.id,
          content: content as any,
          processed: false,
          scrapedAt: new Date()
        }
      })

      // Extract patterns from content
      const patterns = await this.extractPatterns(content)
      
      // Store patterns
      for (const pattern of patterns) {
        await this.db.knowledgePattern.create({
          data: {
            type: pattern.type,
            category: pattern.category,
            name: pattern.name,
            description: pattern.description,
            pattern: pattern.pattern as any,
            confidence: pattern.confidence,
            source: sourceName,
            sourceUrl: pattern.sourceUrl
          }
        })
      }

      console.log(`✅ Stored ${content.length} pages and ${patterns.length} patterns from ${sourceName}`)
    } catch (error) {
      console.error(`Failed to store content for ${sourceName}:`, error)
    }
  }

  /**
   * Extract patterns from scraped content
   */
  private async extractPatterns(content: ScrapedContent[]): Promise<any[]> {
    const patterns: any[] = []

    for (const page of content) {
      // Extract code patterns
      for (const code of page.codeExamples) {
        if (code.length > 50) { // Meaningful code blocks
          patterns.push({
            type: 'code-example',
            category: this.categorizeCode(code),
            name: `Pattern from ${page.title}`,
            description: page.title,
            pattern: { code, context: page.content.substring(0, 500) },
            confidence: 0.7,
            source: 'documentation',
            sourceUrl: page.url
          })
        }
      }

      // Extract configuration patterns
      if (page.content.includes('configuration') || page.content.includes('setup')) {
        patterns.push({
          type: 'configuration',
          category: 'setup',
          name: `Config from ${page.title}`,
          description: page.title,
          pattern: { content: page.content },
          confidence: 0.6,
          source: 'documentation',
          sourceUrl: page.url
        })
      }
    }

    return patterns
  }

  /**
   * Categorize code based on content
   */
  private categorizeCode(code: string): string {
    if (code.includes('useState') || code.includes('useEffect')) return 'react-hooks'
    if (code.includes('async') || code.includes('await')) return 'async-patterns'
    if (code.includes('test(') || code.includes('expect(')) return 'testing'
    if (code.includes('import') || code.includes('export')) return 'modules'
    return 'general'
  }

  /**
   * Hash content for change detection
   */
  private hashContent(content: string): string {
    const crypto = require('crypto')
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Check if content has changed since last scrape
   */
  async hasContentChanged(url: string, currentHash: string): Promise<boolean> {
    if (!this.db) return true

    const lastUpdate = await this.db.knowledgeUpdate.findFirst({
      where: {
        content: {
          path: ['url'],
          equals: url
        }
      },
      orderBy: { scrapedAt: 'desc' }
    })

    if (!lastUpdate) return true

    const lastHash = (lastUpdate.content as any).metadata?.contentHash
    return lastHash !== currentHash
  }
}