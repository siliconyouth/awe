import { chromium, Browser, Page, BrowserContext } from 'playwright'
import * as cheerio from 'cheerio'
import axios from 'axios'
import PQueue from 'p-queue'

export interface SmartScraperConfig {
  headless?: boolean
  timeout?: number
  userAgent?: string
  viewport?: { width: number; height: number }
  maxConcurrency?: number
  cacheEnabled?: boolean
  cacheTTL?: number // seconds
  respectRobotsTxt?: boolean
  delayBetweenRequests?: number // ms
}

export interface ScrapedPage {
  url: string
  title: string
  content: string
  markdown?: string
  links: string[]
  images: string[]
  metadata: {
    scrapedAt: Date
    method: 'static' | 'dynamic'
    loadTime: number
    statusCode?: number
  }
}

export interface ScrapeOptions {
  dynamic?: boolean // Force dynamic scraping
  waitForSelector?: string // Wait for specific element
  extractImages?: boolean
  extractLinks?: boolean
  screenshot?: boolean
}

/**
 * Smart Scraper that automatically chooses the best scraping method
 * No API keys required, no rate limits (beyond being polite)
 */
export class SmartScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private config: SmartScraperConfig
  private queue: PQueue
  private cache: Map<string, { data: ScrapedPage; expires: number }> = new Map()
  
  constructor(config: SmartScraperConfig = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      userAgent: 'AWE-Bot/2.0 (Knowledge Gathering; +https://github.com/awe)',
      viewport: { width: 1280, height: 720 },
      maxConcurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      respectRobotsTxt: true,
      delayBetweenRequests: 1000,
      ...config
    }
    
    this.queue = new PQueue({ 
      concurrency: this.config.maxConcurrency,
      interval: 1000,
      intervalCap: this.config.maxConcurrency
    })
  }

  /**
   * Initialize Playwright browser (lazy loading)
   */
  private async initialize(): Promise<void> {
    if (!this.browser) {
      console.log('🎭 Initializing Playwright browser...')
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
      
      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent,
        viewport: this.config.viewport
      })
    }
  }

  /**
   * Check if URL requires dynamic scraping
   */
  private needsDynamicScraping(url: string): boolean {
    const dynamicIndicators = [
      'react', 'vue', 'angular', 'next', 'nuxt',
      'gatsby', 'svelte', '#!', 'ajax', 'spa',
      '/app', '/dashboard', '/portal'
    ]
    
    const staticIndicators = [
      '.html', '.htm', '.txt', '.md', '.pdf',
      'docs.', 'documentation.', 'wiki.', 'blog.'
    ]
    
    const lowerUrl = url.toLowerCase()
    
    // Check for static indicators first
    if (staticIndicators.some(indicator => lowerUrl.includes(indicator))) {
      return false
    }
    
    // Check for dynamic indicators
    if (dynamicIndicators.some(indicator => lowerUrl.includes(indicator))) {
      return true
    }
    
    // Default to static for most sites
    return false
  }

  /**
   * Scrape using Cheerio (static HTML)
   */
  private async scrapeStatic(url: string, options: ScrapeOptions = {}): Promise<ScrapedPage> {
    const startTime = Date.now()
    console.log(`📄 Static scraping: ${url}`)
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.config.timeout,
        maxRedirects: 5
      })
      
      const $ = cheerio.load(response.data)
      
      // Remove script and style elements
      $('script, style, noscript').remove()
      
      // Extract content
      const title = $('title').text() || $('h1').first().text() || 'Untitled'
      const content = $('body').text()
        .replace(/\s+/g, ' ')
        .trim()
      
      // Extract links if requested
      const links: string[] = []
      if (options.extractLinks !== false) {
        $('a[href]').each((_, elem) => {
          const href = $(elem).attr('href')
          if (href) {
            try {
              const absoluteUrl = new URL(href, url).href
              links.push(absoluteUrl)
            } catch {
              // Ignore invalid URLs
            }
          }
        })
      }
      
      // Extract images if requested
      const images: string[] = []
      if (options.extractImages) {
        $('img[src]').each((_, elem) => {
          const src = $(elem).attr('src')
          if (src) {
            try {
              const absoluteUrl = new URL(src, url).href
              images.push(absoluteUrl)
            } catch {
              // Ignore invalid URLs
            }
          }
        })
      }
      
      // Convert to markdown-like format
      const markdown = this.htmlToMarkdown($, response.data)
      
      return {
        url,
        title,
        content,
        markdown,
        links: [...new Set(links)], // Remove duplicates
        images: [...new Set(images)],
        metadata: {
          scrapedAt: new Date(),
          method: 'static',
          loadTime: Date.now() - startTime,
          statusCode: response.status
        }
      }
    } catch (error: any) {
      console.error(`❌ Static scraping failed for ${url}:`, error.message)
      throw error
    }
  }

  /**
   * Scrape using Playwright (dynamic JavaScript)
   */
  private async scrapeDynamic(url: string, options: ScrapeOptions = {}): Promise<ScrapedPage> {
    const startTime = Date.now()
    console.log(`🎭 Dynamic scraping: ${url}`)
    
    await this.initialize()
    
    const page = await this.context!.newPage()
    
    try {
      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout
      })
      
      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: this.config.timeout
        })
      }
      
      // Take screenshot if requested
      if (options.screenshot) {
        await page.screenshot({ 
          path: `screenshot-${Date.now()}.png`,
          fullPage: true 
        })
      }
      
      // Extract content
      const title = await page.title()
      
      // Get text content
      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = (globalThis as any).document.querySelectorAll('script, style, noscript')
        scripts.forEach((el: any) => el.remove())
        
        return (globalThis as any).document.body?.innerText || ''
      })
      
      // Get HTML for markdown conversion
      const html = await page.content()
      
      // Extract links
      const links = options.extractLinks !== false ? await page.evaluate(() => {
        const anchors = (globalThis as any).document.querySelectorAll('a[href]')
        return Array.from(anchors)
          .map((a: any) => a.href)
          .filter((href: string) => href && href.startsWith('http'))
      }) : []
      
      // Extract images
      const images = options.extractImages ? await page.evaluate(() => {
        const imgs = (globalThis as any).document.querySelectorAll('img[src]')
        return Array.from(imgs)
          .map((img: any) => img.src)
          .filter((src: string) => src && src.startsWith('http'))
      }) : []
      
      // Convert to markdown
      const $ = cheerio.load(html)
      const markdown = this.htmlToMarkdown($, html)
      
      return {
        url,
        title,
        content,
        markdown,
        links: [...new Set(links)],
        images: [...new Set(images)],
        metadata: {
          scrapedAt: new Date(),
          method: 'dynamic',
          loadTime: Date.now() - startTime,
          statusCode: response?.status()
        }
      }
    } finally {
      await page.close()
    }
  }

  /**
   * Convert HTML to Markdown-like format
   */
  private htmlToMarkdown($: cheerio.CheerioAPI, html: string): string {
    const lines: string[] = []
    
    // Process headings
    $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const level = parseInt(elem.tagName[1])
      const text = $(elem).text().trim()
      if (text) {
        lines.push('\n' + '#'.repeat(level) + ' ' + text + '\n')
      }
    })
    
    // Process paragraphs
    $('p').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text) {
        lines.push(text + '\n')
      }
    })
    
    // Process lists
    $('ul, ol').each((_, elem) => {
      $(elem).find('li').each((i, li) => {
        const text = $(li).text().trim()
        if (text) {
          const prefix = elem.tagName === 'ol' ? `${i + 1}. ` : '- '
          lines.push(prefix + text)
        }
      })
      lines.push('')
    })
    
    // Process code blocks
    $('pre code, code').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text && text.length > 20) {
        lines.push('\n```')
        lines.push(text)
        lines.push('```\n')
      }
    })
    
    return lines.join('\n').replace(/\n{3,}/g, '\n\n')
  }

  /**
   * Main scraping method - automatically chooses the best approach
   */
  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedPage> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(url)
      if (cached && cached.expires > Date.now()) {
        console.log(`📦 Using cached result for ${url}`)
        return cached.data
      }
    }
    
    // Queue the scraping task
    return this.queue.add(async (): Promise<ScrapedPage> => {
      // Add delay between requests to be polite
      if (this.config.delayBetweenRequests) {
        await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests))
      }
      
      let result: ScrapedPage
      
      // Determine scraping method
      const useDynamic = options.dynamic || this.needsDynamicScraping(url)
      
      if (useDynamic) {
        try {
          result = await this.scrapeDynamic(url, options)
        } catch (error) {
          console.warn('Dynamic scraping failed, trying static...', error)
          result = await this.scrapeStatic(url, options)
        }
      } else {
        try {
          result = await this.scrapeStatic(url, options)
        } catch (error) {
          console.warn('Static scraping failed, trying dynamic...', error)
          result = await this.scrapeDynamic(url, options)
        }
      }
      
      // Cache the result
      if (this.config.cacheEnabled) {
        this.cache.set(url, {
          data: result,
          expires: Date.now() + (this.config.cacheTTL! * 1000)
        })
      }
      
      return result
    }) as Promise<ScrapedPage>
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeMultiple(urls: string[], options: ScrapeOptions = {}): Promise<ScrapedPage[]> {
    console.log(`🔄 Scraping ${urls.length} URLs...`)
    
    const results = await Promise.allSettled(
      urls.map(url => this.scrape(url, options))
    )
    
    const successful: ScrapedPage[] = []
    const failed: string[] = []
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value)
      } else {
        failed.push(urls[index])
        console.error(`Failed to scrape ${urls[index]}:`, result.reason)
      }
    })
    
    console.log(`✅ Successfully scraped ${successful.length}/${urls.length} URLs`)
    if (failed.length > 0) {
      console.log(`❌ Failed URLs:`, failed)
    }
    
    return successful
  }

  /**
   * Crawl a website (follow links)
   */
  async crawl(startUrl: string, options: {
    maxPages?: number
    maxDepth?: number
    sameDomainOnly?: boolean
    includePaths?: string[]
    excludePaths?: string[]
  } = {}): Promise<ScrapedPage[]> {
    const {
      maxPages = 10,
      maxDepth = 2,
      sameDomainOnly = true,
      includePaths = [],
      excludePaths = []
    } = options
    
    console.log(`🕷️ Starting crawl from ${startUrl}`)
    
    const visited = new Set<string>()
    const toVisit: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }]
    const results: ScrapedPage[] = []
    const startDomain = new URL(startUrl).hostname
    
    while (toVisit.length > 0 && results.length < maxPages) {
      const { url, depth } = toVisit.shift()!
      
      if (visited.has(url) || depth > maxDepth) {
        continue
      }
      
      // Check include/exclude paths
      if (excludePaths.some(path => url.includes(path))) {
        continue
      }
      
      if (includePaths.length > 0 && !includePaths.some(path => url.includes(path))) {
        continue
      }
      
      visited.add(url)
      
      try {
        const page = await this.scrape(url)
        results.push(page)
        
        // Add discovered links to queue
        if (depth < maxDepth) {
          for (const link of page.links) {
            const linkDomain = new URL(link).hostname
            
            if (!visited.has(link) && 
                (!sameDomainOnly || linkDomain === startDomain)) {
              toVisit.push({ url: link, depth: depth + 1 })
            }
          }
        }
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error)
      }
    }
    
    console.log(`🕸️ Crawl complete: ${results.length} pages scraped`)
    return results
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.context = null
    }
    this.cache.clear()
  }
}