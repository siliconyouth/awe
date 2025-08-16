import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { BaseCommand } from './base'
import { SmartScraper } from '@awe/ai'
import { getPrisma } from '@awe/database'

interface LearnOptions {
  url?: string
  depth?: string
  pages?: string
  dynamic?: boolean
  cache?: boolean
}

export class LearnCommand extends BaseCommand {
  getCommand(): Command {
    const command = new Command('learn')
      .description('🧠 Scrape and learn from documentation sources')
      .option('-u, --url <url>', 'URL to scrape')
      .option('-d, --depth <number>', 'crawl depth (default: 2)', '2')
      .option('-p, --pages <number>', 'max pages to crawl (default: 10)', '10')
      .option('--dynamic', 'force dynamic (Playwright) scraping')
      .option('--no-cache', 'disable caching')
      .action(this.execute.bind(this))

    return command
  }

  private async execute(options: LearnOptions) {
    console.log(chalk.cyan.bold('\n🧠 AWE Knowledge Gathering\n'))
    
    const spinner = ora('Initializing SmartScraper...').start()
    
    try {
      // Initialize database connection
      let db = null
      try {
        db = getPrisma()
        await db.$connect()
        spinner.text = 'Connected to database'
      } catch (error) {
        spinner.warn('Running without database - results will not be persisted')
        db = null
      }

      // Initialize SmartScraper
      spinner.text = 'Initializing SmartScraper (Playwright)...'
      
      const scraper = new SmartScraper({
        headless: true,
        maxConcurrency: 3,
        cacheEnabled: options.cache !== false,
        cacheTTL: 300
      })
      
      try {
        if (options.url) {
          spinner.text = `🎭 Scraping ${options.url}...`
          
          if (parseInt(options.pages || '1') > 1) {
            // Crawl mode
            const results = await scraper.crawl(options.url, {
              maxPages: parseInt(options.pages || '10'),
              maxDepth: parseInt(options.depth || '2')
            })
            
            spinner.succeed('Smart scraping complete!')
            
            console.log(chalk.cyan('\n📊 Scraping Results:\n'))
            console.log(chalk.white(`Starting URL: ${options.url}`))
            console.log(chalk.dim('├─'), `Pages scraped: ${chalk.green(results.length)}`)
            
            const totalWords = results.reduce((sum, page) => 
              sum + page.content.split(/\s+/).length, 0
            )
            console.log(chalk.dim('├─'), `Total words: ${chalk.green(totalWords.toLocaleString())}`)
            
            const methods = results.reduce((acc, page) => {
              acc[page.metadata.method] = (acc[page.metadata.method] || 0) + 1
              return acc
            }, {} as Record<string, number>)
            
            console.log(chalk.dim('├─'), 'Scraping methods:')
            Object.entries(methods).forEach(([method, count]) => {
              console.log(chalk.dim('│  ├─'), `${method}: ${chalk.green(count)}`)
            })
            
            const avgLoadTime = results.reduce((sum, page) => 
              sum + page.metadata.loadTime, 0
            ) / results.length
            console.log(chalk.dim('└─'), `Avg load time: ${chalk.green(avgLoadTime.toFixed(0) + 'ms')}`)
            
            // Show sample pages
            if (results.length > 0) {
              console.log(chalk.cyan('\n📄 Pages Scraped:'))
              results.slice(0, 5).forEach((page, i) => {
                console.log(chalk.dim(`\n[${i + 1}]`), chalk.white(page.title))
                console.log(chalk.dim('   '), page.url)
                console.log(chalk.dim('   '), `Method: ${page.metadata.method}, Load time: ${page.metadata.loadTime}ms`)
              })
              
              if (results.length > 5) {
                console.log(chalk.dim('\n   ... and'), chalk.green(results.length - 5), chalk.dim('more pages'))
              }
            }

            // Store in database if available
            if (db && results.length > 0) {
              await this.storeResults(db, results)
            }
          } else {
            // Single page mode
            const result = await scraper.scrape(options.url, {
              dynamic: options.dynamic
            })
            
            spinner.succeed('Smart scraping complete!')
            
            console.log(chalk.cyan('\n📊 Scraping Results:\n'))
            console.log(chalk.white(`URL: ${result.url}`))
            console.log(chalk.dim('├─'), `Title: ${chalk.green(result.title)}`)
            console.log(chalk.dim('├─'), `Content: ${chalk.green(result.content.split(/\s+/).length)} words`)
            console.log(chalk.dim('├─'), `Links found: ${chalk.green(result.links.length)}`)
            console.log(chalk.dim('├─'), `Images found: ${chalk.green(result.images.length)}`)
            console.log(chalk.dim('├─'), `Method: ${chalk.green(result.metadata.method)}`)
            console.log(chalk.dim('└─'), `Load time: ${chalk.green(result.metadata.loadTime + 'ms')}`)
            
            if (result.markdown) {
              console.log(chalk.cyan('\n📝 Content Preview:'))
              const preview = result.markdown.substring(0, 500).trim()
              console.log(chalk.dim(preview + (result.markdown.length > 500 ? '...' : '')))
            }

            // Store in database if available
            if (db) {
              await this.storeResults(db, [result])
            }
          }
        } else {
          console.log(chalk.yellow('\n⚠️  No URL provided. Please use --url <url> to specify a URL to scrape.'))
          console.log(chalk.dim('\nExamples:'))
          console.log(chalk.dim('  Single page:  awe learn --url https://docs.anthropic.com'))
          console.log(chalk.dim('  Crawl site:   awe learn --url https://example.com --pages 10 --depth 2'))
          console.log(chalk.dim('  Force dynamic: awe learn --url https://react-app.com --dynamic'))
          console.log(chalk.dim('  No cache:     awe learn --url https://site.com --no-cache'))
        }
      } finally {
        await scraper.close()
      }
      
      if (db) {
        await db.$disconnect()
      }
      
    } catch (error) {
      spinner.fail('Scraping failed')
      this.logger.error('Learn command error:', error)
      throw error
    }
  }

  private async storeResults(db: any, pages: any[]) {
    try {
      // Extract patterns from scraped content
      const patterns = this.extractPatterns(pages)
      
      // Store patterns in database
      for (const pattern of patterns) {
        await db.knowledgePattern.create({
          data: {
            type: pattern.type,
            category: pattern.category,
            name: pattern.name,
            description: pattern.description,
            pattern: pattern.pattern,
            confidence: pattern.confidence,
            source: pattern.source,
            sourceUrl: pattern.sourceUrl
          }
        })
      }
      
      console.log(chalk.green(`\n📚 Stored ${patterns.length} patterns in knowledge base`))
      
      const totalPatterns = await db.knowledgePattern.count()
      console.log(chalk.dim(`   Total patterns in database: ${totalPatterns}`))
    } catch (error) {
      console.error('Failed to store results:', error)
    }
  }

  private extractPatterns(pages: any[]): any[] {
    const patterns: any[] = []
    
    for (const page of pages) {
      // Extract code blocks as patterns
      const codeBlocks = (page.markdown || '').match(/```[\s\S]*?```/g) || []
      for (const code of codeBlocks) {
        if (code.length > 100) {
          patterns.push({
            type: 'code-example',
            category: 'code',
            name: `Code from ${page.title}`,
            description: page.title,
            pattern: { code, url: page.url },
            confidence: 0.8,
            source: 'SmartScraper',
            sourceUrl: page.url
          })
        }
      }
      
      // Extract configuration patterns
      const content = page.content.toLowerCase()
      if (content.includes('configuration') || content.includes('setup') || content.includes('install')) {
        patterns.push({
          type: 'configuration',
          category: 'setup',
          name: `Config from ${page.title}`,
          description: 'Configuration or setup instructions',
          pattern: { url: page.url, content: page.markdown?.substring(0, 1000) },
          confidence: 0.7,
          source: 'SmartScraper',
          sourceUrl: page.url
        })
      }
      
      // Extract best practices
      if (content.includes('best practice') || content.includes('recommended') || content.includes('should')) {
        patterns.push({
          type: 'best-practice',
          category: 'guidelines',
          name: `Best practice from ${page.title}`,
          description: 'Recommended approach',
          pattern: { url: page.url, content: page.markdown?.substring(0, 1000) },
          confidence: 0.7,
          source: 'SmartScraper',
          sourceUrl: page.url
        })
      }
    }
    
    return patterns
  }
}