import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseCommand } from './base'
import { AdvancedSmartScraper, AdvancedScrapeOptions } from '@awe/ai'

interface ScrapeOptions {
  output?: string
  pdf?: boolean
  ocr?: boolean
  websocket?: boolean
  distributed?: boolean
  proxy?: string
  auth?: string
  cloud?: string
  rules?: string
  format?: string
  verbose?: boolean
}

export class ScrapeCommand extends BaseCommand {
  private scraper: AdvancedSmartScraper

  constructor() {
    super()
    this.scraper = new AdvancedSmartScraper()
  }

  getCommand(): Command {
    const command = new Command('scrape')
      .description('🌐 Advanced web scraping with PDF, OCR, and more')
      .argument('<url>', 'URL to scrape')
      .option('-o, --output <file>', 'Save output to file')
      .option('--pdf', 'Extract PDF content')
      .option('--ocr', 'Enable OCR for images')
      .option('--websocket', 'Use WebSocket connection')
      .option('--distributed', 'Enable distributed crawling')
      .option('--proxy <url>', 'Use proxy server')
      .option('--auth <type>', 'Authentication type (basic, bearer, oauth2, cookies)')
      .option('--cloud <provider>', 'Use cloud browser (browserless, puppeteer-cloud)')
      .option('--rules <file>', 'Custom extraction rules JSON file')
      .option('--format <type>', 'Output format (json, markdown, text)', 'json')
      .option('-v, --verbose', 'Verbose output')
      .action(async (url: string, options: ScrapeOptions) => {
        await this.scrape(url, options)
      })

    // Batch scraping
    command
      .command('batch <file>')
      .description('Batch scrape multiple URLs from file')
      .option('-o, --output-dir <dir>', 'Output directory', './scraped')
      .option('--parallel <n>', 'Number of parallel workers', '4')
      .option('--delay <ms>', 'Delay between requests', '1000')
      .action(async (file: string, options: any) => {
        await this.batchScrape(file, options)
      })

    // PDF extraction
    command
      .command('pdf <url>')
      .description('Extract text from PDF')
      .option('-o, --output <file>', 'Save output to file')
      .option('--ocr', 'Enable OCR for scanned PDFs')
      .action(async (url: string, options: ScrapeOptions) => {
        await this.scrapePDF(url, options)
      })

    // Monitor WebSocket
    command
      .command('monitor <url>')
      .description('Monitor WebSocket connection')
      .option('-d, --duration <seconds>', 'Monitoring duration', '60')
      .option('-o, --output <file>', 'Save messages to file')
      .action(async (url: string, options: any) => {
        await this.monitorWebSocket(url, options)
      })

    // Queue status (for distributed crawling)
    command
      .command('status')
      .description('Show distributed crawling queue status')
      .action(async () => {
        await this.showQueueStatus()
      })

    return command
  }

  private async scrape(url: string, options: ScrapeOptions): Promise<void> {
    const spinner = ora(`Scraping ${url}...`).start()

    try {
      // Build scrape options
      const scrapeOptions: AdvancedScrapeOptions = {
        url,
        extractPDF: options.pdf || false,
        enableOCR: options.ocr || false,
        websocket: options.websocket || false,
        distributed: options.distributed || false,
        ultrathinking: true,
      }

      // Add proxy if provided
      if (options.proxy) {
        scrapeOptions.proxies = [{
          url: options.proxy,
          rotationInterval: 60000,
        }]
        scrapeOptions.rotateProxies = true
      }

      // Add authentication if provided
      if (options.auth) {
        const authConfig = await this.getAuthConfig(options.auth)
        scrapeOptions.authentication = authConfig
      }

      // Add cloud browser if provided
      if (options.cloud) {
        scrapeOptions.cloudBrowser = await this.getCloudConfig(options.cloud)
      }

      // Load extraction rules if provided
      if (options.rules) {
        const rulesContent = await fs.readFile(options.rules, 'utf-8')
        scrapeOptions.extractionRules = JSON.parse(rulesContent)
      }

      // Perform scraping
      spinner.text = 'Analyzing with ultrathinking...'
      const result = await this.scraper.scrape(scrapeOptions)

      spinner.succeed(chalk.green('Scraping completed!'))

      // Display results
      this.displayResult(result, options)

      // Save output if requested
      if (options.output) {
        await this.saveOutput(result, options.output, options.format || 'json')
        console.log(chalk.green(`✅ Output saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red('Scraping failed'))
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    } finally {
      await this.scraper.cleanup()
    }
  }

  private async batchScrape(file: string, options: any): Promise<void> {
    const spinner = ora('Loading URLs...').start()

    try {
      // Read URLs from file
      const content = await fs.readFile(file, 'utf-8')
      const urls = content.split('\n').filter(url => url.trim())

      spinner.succeed(`Loaded ${urls.length} URLs`)

      // Create output directory
      await fs.mkdir(options.outputDir, { recursive: true })

      // Process URLs
      const delay = parseInt(options.delay) || 1000
      const parallel = parseInt(options.parallel) || 4

      console.log(chalk.cyan(`\nProcessing ${urls.length} URLs with ${parallel} workers...\n`))

      for (let i = 0; i < urls.length; i += parallel) {
        const batch = urls.slice(i, i + parallel)
        
        await Promise.all(batch.map(async (url, index) => {
          const urlSpinner = ora(`Scraping ${url}...`).start()
          
          try {
            const result = await this.scraper.scrape({ url })
            
            // Save result
            const filename = `${i + index + 1}_${url.replace(/[^a-z0-9]/gi, '_')}.json`
            const outputPath = path.join(options.outputDir, filename)
            await fs.writeFile(outputPath, JSON.stringify(result, null, 2))
            
            urlSpinner.succeed(chalk.green(`✓ ${url}`))
          } catch (error) {
            urlSpinner.fail(chalk.red(`✗ ${url}: ${error}`))
          }
        }))

        // Delay between batches
        if (i + parallel < urls.length) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      console.log(chalk.green(`\n✅ Batch scraping completed! Results saved to ${options.outputDir}`))

    } catch (error) {
      spinner.fail(chalk.red('Batch scraping failed'))
      console.error(error)
      process.exit(1)
    } finally {
      await this.scraper.cleanup()
    }
  }

  private async scrapePDF(url: string, options: ScrapeOptions): Promise<void> {
    const spinner = ora(`Extracting PDF from ${url}...`).start()

    try {
      const result = await this.scraper.scrape({
        url,
        extractPDF: true,
        enableOCR: options.ocr || false,
      })

      spinner.succeed(chalk.green('PDF extraction completed!'))

      // Display PDF text
      if (result.pdfText) {
        console.log(chalk.cyan('\n📄 PDF Content:\n'))
        console.log(result.pdfText.substring(0, 1000))
        
        if (result.pdfText.length > 1000) {
          console.log(chalk.gray('\n... (truncated)'))
        }
      }

      // Save output if requested
      if (options.output) {
        await fs.writeFile(options.output, result.pdfText || '')
        console.log(chalk.green(`\n✅ PDF text saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red('PDF extraction failed'))
      console.error(error)
      process.exit(1)
    } finally {
      await this.scraper.cleanup()
    }
  }

  private async monitorWebSocket(url: string, options: any): Promise<void> {
    const duration = parseInt(options.duration) || 60
    const spinner = ora(`Monitoring WebSocket for ${duration} seconds...`).start()

    try {
      const result = await this.scraper.scrape({
        url,
        websocket: true,
        timeout: duration * 1000,
      })

      spinner.succeed(chalk.green('WebSocket monitoring completed!'))

      // Display messages
      console.log(chalk.cyan('\n📡 WebSocket Messages:\n'))
      console.log(result.content)

      // Save output if requested
      if (options.output) {
        await fs.writeFile(options.output, result.content)
        console.log(chalk.green(`\n✅ Messages saved to ${options.output}`))
      }

    } catch (error) {
      spinner.fail(chalk.red('WebSocket monitoring failed'))
      console.error(error)
      process.exit(1)
    } finally {
      await this.scraper.cleanup()
    }
  }

  private async showQueueStatus(): Promise<void> {
    try {
      const status = await this.scraper.getQueueStatus()
      
      console.log(chalk.cyan('\n📊 Queue Status:\n'))
      console.log(`Waiting:   ${chalk.yellow(status.waiting)}`)
      console.log(`Active:    ${chalk.blue(status.active)}`)
      console.log(`Completed: ${chalk.green(status.completed)}`)
      console.log(`Failed:    ${chalk.red(status.failed)}`)
      
    } catch (error) {
      console.error(chalk.red('Could not get queue status'))
      console.error(chalk.gray('Make sure distributed crawling is enabled'))
    }
  }

  private displayResult(result: any, options: ScrapeOptions): void {
    if (!options.verbose) {
      // Basic output
      console.log(chalk.cyan('\n📋 Scraping Result:\n'))
      console.log(`URL: ${result.url}`)
      console.log(`Method: ${result.method}`)
      
      if (result.metadata?.title) {
        console.log(`Title: ${result.metadata.title}`)
      }
      
      console.log(`Content length: ${result.content.length} characters`)
      
      if (result.performance) {
        console.log(`Load time: ${result.performance.loadTime}ms`)
      }
      
      if (result.extractedData) {
        console.log(chalk.yellow('\nExtracted Data:'))
        console.log(JSON.stringify(result.extractedData, null, 2))
      }
      
      if (result.ultrathinkingInsights) {
        console.log(chalk.cyan('\n🧠 Ultrathinking Insights:'))
        console.log(`Content Type: ${result.ultrathinkingInsights.contentType}`)
        console.log(`Quality: ${Math.round(result.ultrathinkingInsights.quality * 100)}%`)
        
        if (result.ultrathinkingInsights.suggestions.length > 0) {
          console.log(chalk.yellow('\nSuggestions:'))
          for (const suggestion of result.ultrathinkingInsights.suggestions) {
            console.log(`  • ${suggestion}`)
          }
        }
      }
    } else {
      // Verbose output
      console.log(chalk.cyan('\n📋 Full Scraping Result:\n'))
      console.log(JSON.stringify(result, null, 2))
    }
  }

  private async saveOutput(result: any, outputPath: string, format: string): Promise<void> {
    let content: string;
    
    switch (format) {
      case 'markdown':
        content = result.markdown || this.convertToMarkdown(result)
        break
      case 'text':
        content = result.content
        break
      case 'json':
      default:
        content = JSON.stringify(result, null, 2)
        break
    }
    
    await fs.writeFile(outputPath, content, 'utf-8')
  }

  private convertToMarkdown(result: any): string {
    let markdown = `# Scraped Content\n\n`
    markdown += `**URL:** ${result.url}\n`
    markdown += `**Method:** ${result.method}\n`
    
    if (result.metadata?.title) {
      markdown += `**Title:** ${result.metadata.title}\n`
    }
    
    markdown += `\n## Content\n\n`
    markdown += result.content.substring(0, 5000)
    
    if (result.content.length > 5000) {
      markdown += '\n\n... (truncated)'
    }
    
    return markdown
  }

  private async getAuthConfig(authType: string): Promise<any> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
        when: authType === 'basic',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        when: authType === 'basic',
      },
      {
        type: 'input',
        name: 'token',
        message: 'Bearer token:',
        when: authType === 'bearer',
      },
    ])

    switch (authType) {
      case 'basic':
        return {
          type: 'basic',
          credentials: {
            username: answers.username,
            password: answers.password,
          },
        }
      case 'bearer':
        return {
          type: 'bearer',
          credentials: {
            token: answers.token,
          },
        }
      default:
        return { type: authType, credentials: {} }
    }
  }

  private async getCloudConfig(provider: string): Promise<any> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'Cloud browser endpoint:',
        default: provider === 'browserless' ? 'wss://chrome.browserless.io' : '',
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API key:',
      },
    ])

    return {
      provider,
      endpoint: answers.endpoint,
      apiKey: answers.apiKey,
    }
  }
}

// Export for standalone use
export const scrapeCommand = new ScrapeCommand().getCommand()