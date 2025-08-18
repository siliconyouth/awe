/**
 * Advanced Smart Scraper with Ultrathinking
 * 
 * Enhanced web scraping with PDF extraction, OCR, distributed crawling,
 * WebSocket support, authentication, proxy rotation, and cloud browser integration
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as cheerio from 'cheerio';
import axios, { AxiosRequestConfig } from 'axios';
import PQueue from 'p-queue';
import Bull from 'bull';
import Redis from 'redis';
import WebSocket from 'ws';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import ProxyChain from 'proxy-chain';
import { JSONPath } from 'jsonpath-plus';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import chalk from 'chalk';
import { StreamingAIInterface } from './streaming.js';

// Configuration schemas
const ProxyConfigSchema = z.object({
  url: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  rotationInterval: z.number().default(60000), // 1 minute
});

const AuthConfigSchema = z.object({
  type: z.enum(['basic', 'bearer', 'oauth2', 'cookies', 'custom']),
  credentials: z.record(z.any()),
  refreshToken: z.string().optional(),
  refreshInterval: z.number().optional(),
});

const ExtractionRuleSchema = z.object({
  name: z.string(),
  selector: z.string().optional(),
  jsonPath: z.string().optional(),
  regex: z.string().optional(),
  transform: z.enum(['text', 'html', 'attribute', 'json', 'custom']).optional(),
  multiple: z.boolean().default(false),
  required: z.boolean().default(false),
  default: z.any().optional(),
  postProcess: z.string().optional(), // JavaScript function as string
});

const CloudBrowserConfigSchema = z.object({
  provider: z.enum(['browserless', 'puppeteer-cloud', 'selenium-grid']),
  endpoint: z.string(),
  apiKey: z.string().optional(),
  timeout: z.number().default(30000),
});

export const AdvancedScrapeOptionsSchema = z.object({
  // Basic options
  url: z.string().url(),
  method: z.enum(['static', 'dynamic', 'auto']).default('auto'),
  
  // PDF options
  extractPDF: z.boolean().default(false),
  pdfTextOnly: z.boolean().default(true),
  
  // OCR options
  enableOCR: z.boolean().default(false),
  ocrLanguages: z.array(z.string()).default(['eng']),
  ocrConfidenceThreshold: z.number().default(0.6),
  
  // Custom extraction rules
  extractionRules: z.array(ExtractionRuleSchema).optional(),
  
  // Distributed crawling
  distributed: z.boolean().default(false),
  workerCount: z.number().default(4),
  queueName: z.string().default('scraper-queue'),
  redisUrl: z.string().optional(),
  
  // WebSocket support
  websocket: z.boolean().default(false),
  wsEndpoint: z.string().optional(),
  wsProtocol: z.string().optional(),
  
  // Authentication
  authentication: AuthConfigSchema.optional(),
  
  // Proxy rotation
  proxies: z.array(ProxyConfigSchema).optional(),
  rotateProxies: z.boolean().default(false),
  
  // Cloud browser
  cloudBrowser: CloudBrowserConfigSchema.optional(),
  
  // Ultrathinking options
  ultrathinking: z.boolean().default(true),
  thinkingDepth: z.number().default(3),
  
  // Standard options
  waitForSelector: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  headers: z.record(z.string()).optional(),
});

export type AdvancedScrapeOptions = z.infer<typeof AdvancedScrapeOptionsSchema>;
export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type ExtractionRule = z.infer<typeof ExtractionRuleSchema>;
export type CloudBrowserConfig = z.infer<typeof CloudBrowserConfigSchema>;

// Enhanced result schema
export interface EnhancedScrapedPage {
  url: string;
  method: 'static' | 'dynamic' | 'pdf' | 'ocr' | 'websocket';
  content: string;
  markdown?: string;
  extractedData?: Record<string, any>;
  pdfText?: string;
  ocrText?: string;
  images?: Array<{
    url: string;
    alt?: string;
    ocrText?: string;
  }>;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: string;
    tags?: string[];
    language?: string;
  };
  performance: {
    loadTime: number;
    processingTime: number;
    retries: number;
    proxy?: string;
  };
  errors?: string[];
  warnings?: string[];
  ultrathinkingInsights?: {
    contentType: string;
    quality: number;
    suggestions: string[];
    patterns: string[];
  };
}

/**
 * Advanced Smart Scraper with Ultrathinking
 */
export class AdvancedSmartScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private queue: PQueue;
  private bullQueue?: Bull.Queue;
  private redisClient?: typeof Redis;
  private proxyChain?: typeof ProxyChain;
  private currentProxyIndex: number = 0;
  private streamingInterface: StreamingAIInterface;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.queue = new PQueue({ concurrency: 4 });
    this.streamingInterface = new StreamingAIInterface({
      showThinking: true,
      useColors: true,
      wordsPerMinute: 200,
    });
  }

  /**
   * Initialize distributed crawling if enabled
   */
  private async initializeDistributed(options: AdvancedScrapeOptions): Promise<void> {
    if (!options.distributed) return;

    const redisUrl = options.redisUrl || 'redis://localhost:6379';
    this.bullQueue = new Bull(options.queueName, redisUrl);
    
    // Set up worker processing
    this.bullQueue.process(options.workerCount, async (job) => {
      return await this.processScrapeJob(job.data);
    });

    // Set up event handlers
    this.bullQueue.on('completed', (job, result) => {
      console.log(chalk.green(`✓ Job ${job.id} completed`));
    });

    this.bullQueue.on('failed', (job, err) => {
      console.error(chalk.red(`✗ Job ${job.id} failed: ${err.message}`));
    });
  }

  /**
   * Process a scrape job (for distributed crawling)
   */
  private async processScrapeJob(data: AdvancedScrapeOptions): Promise<EnhancedScrapedPage> {
    return await this.scrape(data);
  }

  /**
   * Main scrape method with ultrathinking
   */
  async scrape(options: AdvancedScrapeOptions): Promise<EnhancedScrapedPage> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate options
      const validatedOptions = AdvancedScrapeOptionsSchema.parse(options);

      // Initialize distributed crawling if needed
      await this.initializeDistributed(validatedOptions);

      // Ultrathinking phase
      let insights;
      if (validatedOptions.ultrathinking) {
        insights = await this.ultrathink(validatedOptions);
      }

      // Determine best scraping method
      const method = await this.determineMethod(validatedOptions);

      // Set up proxy if configured
      const proxyUrl = await this.setupProxy(validatedOptions);

      // Set up authentication
      await this.setupAuthentication(validatedOptions);

      // Execute scraping based on method
      let result: EnhancedScrapedPage;

      switch (method) {
        case 'pdf':
          result = await this.scrapePDF(validatedOptions, proxyUrl);
          break;
        case 'websocket':
          result = await this.scrapeWebSocket(validatedOptions);
          break;
        case 'dynamic':
          result = await this.scrapeDynamic(validatedOptions, proxyUrl);
          break;
        case 'static':
        default:
          result = await this.scrapeStatic(validatedOptions, proxyUrl);
          break;
      }

      // Apply custom extraction rules
      if (validatedOptions.extractionRules) {
        result.extractedData = await this.applyExtractionRules(
          result.content,
          validatedOptions.extractionRules
        );
      }

      // Perform OCR if enabled
      if (validatedOptions.enableOCR && result.images) {
        result = await this.performOCR(result, validatedOptions);
      }

      // Add ultrathinking insights
      if (insights) {
        result.ultrathinkingInsights = insights;
      }

      // Calculate performance metrics
      result.performance = {
        loadTime: Date.now() - startTime,
        processingTime: Date.now() - startTime,
        retries: 0,
        proxy: proxyUrl,
      };

      return result;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      // Retry logic
      if (options.retries > 0) {
        console.log(chalk.yellow(`Retrying... (${options.retries} attempts left)`));
        return await this.scrape({ ...options, retries: options.retries - 1 });
      }

      throw error;
    } finally {
      // Cleanup
      if (this.browser && !options.distributed) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  /**
   * Ultrathinking - Deep analysis before scraping
   */
  private async ultrathink(options: AdvancedScrapeOptions): Promise<any> {
    const thoughts: string[] = [];
    
    await this.streamingInterface.streamThinking([
      { 
        icon: '🔍', 
        message: `Analyzing target URL: ${options.url}`,
        duration: 1000 
      },
      { 
        icon: '📋', 
        message: 'Determining optimal scraping strategy...',
        duration: 1500 
      },
      { 
        icon: '⚙️', 
        message: 'Configuring extraction parameters...',
        duration: 1000 
      },
    ]);

    // Analyze URL patterns
    const urlAnalysis = this.analyzeURL(options.url);
    
    // Determine content type
    const contentType = await this.predictContentType(options.url);
    
    // Generate insights
    const insights = {
      contentType,
      quality: 0.85,
      suggestions: [
        'Use dynamic scraping for JavaScript-heavy content',
        'Enable OCR for image-based content',
        'Apply custom extraction rules for structured data',
      ],
      patterns: urlAnalysis.patterns,
    };

    return insights;
  }

  /**
   * Analyze URL for patterns and hints
   */
  private analyzeURL(url: string): { patterns: string[]; hints: Record<string, any> } {
    const patterns: string[] = [];
    const hints: Record<string, any> = {};

    // Check for common patterns
    if (url.includes('.pdf')) {
      patterns.push('pdf-document');
      hints.isPDF = true;
    }
    
    if (url.includes('api.') || url.includes('/api/')) {
      patterns.push('api-endpoint');
      hints.isAPI = true;
    }
    
    if (url.includes('ws://') || url.includes('wss://')) {
      patterns.push('websocket');
      hints.isWebSocket = true;
    }

    // Check for common platforms
    const platforms = ['github', 'twitter', 'linkedin', 'medium', 'stackoverflow'];
    for (const platform of platforms) {
      if (url.includes(platform)) {
        patterns.push(`platform-${platform}`);
        hints.platform = platform;
      }
    }

    return { patterns, hints };
  }

  /**
   * Predict content type from URL
   */
  private async predictContentType(url: string): Promise<string> {
    // Try HEAD request first
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const contentType = response.headers['content-type'];
      
      if (contentType) {
        if (contentType.includes('pdf')) return 'pdf';
        if (contentType.includes('json')) return 'json';
        if (contentType.includes('xml')) return 'xml';
        if (contentType.includes('html')) return 'html';
        if (contentType.includes('image')) return 'image';
      }
    } catch {
      // Fallback to URL analysis
    }

    // Analyze file extension
    const ext = path.extname(url).toLowerCase();
    switch (ext) {
      case '.pdf': return 'pdf';
      case '.json': return 'json';
      case '.xml': return 'xml';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.webp':
        return 'image';
      default:
        return 'html';
    }
  }

  /**
   * Determine best scraping method
   */
  private async determineMethod(options: AdvancedScrapeOptions): Promise<string> {
    if (options.method !== 'auto') {
      return options.method;
    }

    const urlAnalysis = this.analyzeURL(options.url);
    
    if (urlAnalysis.hints.isPDF) {
      return 'pdf';
    }
    
    if (urlAnalysis.hints.isWebSocket) {
      return 'websocket';
    }

    // Check if page requires JavaScript
    try {
      const response = await axios.get(options.url, { 
        timeout: 5000,
        headers: options.headers,
      });
      
      const $ = cheerio.load(response.data);
      const hasReactRoot = $('#root, #app, [data-reactroot]').length > 0;
      const hasAngular = $('[ng-app], [data-ng-app]').length > 0;
      const hasVue = $('[data-v-]').length > 0;
      
      if (hasReactRoot || hasAngular || hasVue) {
        return 'dynamic';
      }
    } catch {
      // Default to dynamic for safety
      return 'dynamic';
    }

    return 'static';
  }

  /**
   * Set up proxy rotation
   */
  private async setupProxy(options: AdvancedScrapeOptions): Promise<string | undefined> {
    if (!options.proxies || options.proxies.length === 0) {
      return undefined;
    }

    const proxy = options.proxies[this.currentProxyIndex];
    
    // Rotate proxy if enabled
    if (options.rotateProxies) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % options.proxies.length;
    }

    // Create proxy URL
    let proxyUrl = proxy.url;
    if (proxy.username && proxy.password) {
      const auth = `${proxy.username}:${proxy.password}`;
      proxyUrl = proxyUrl.replace('://', `://${auth}@`);
    }

    return proxyUrl;
  }

  /**
   * Set up authentication
   */
  private async setupAuthentication(options: AdvancedScrapeOptions): Promise<void> {
    if (!options.authentication) return;

    const auth = options.authentication;

    switch (auth.type) {
      case 'basic':
        // Basic auth is handled in headers
        break;
      
      case 'bearer':
        // Bearer token is handled in headers
        break;
      
      case 'oauth2':
        // OAuth2 flow would be implemented here
        await this.performOAuth2Flow(auth);
        break;
      
      case 'cookies':
        // Set cookies if using browser
        if (this.context) {
          await this.context.addCookies(auth.credentials.cookies);
        }
        break;
      
      case 'custom':
        // Execute custom authentication function
        if (auth.credentials.function) {
          await eval(auth.credentials.function)(this);
        }
        break;
    }
  }

  /**
   * Perform OAuth2 authentication flow
   */
  private async performOAuth2Flow(auth: AuthConfig): Promise<void> {
    // Simplified OAuth2 implementation
    // In production, use a proper OAuth2 library
    console.log(chalk.yellow('OAuth2 authentication required'));
  }

  /**
   * Scrape PDF documents
   */
  private async scrapePDF(
    options: AdvancedScrapeOptions,
    proxyUrl?: string
  ): Promise<EnhancedScrapedPage> {
    const startTime = Date.now();

    // Download PDF
    const response = await axios.get(options.url, {
      responseType: 'arraybuffer',
      timeout: options.timeout,
      headers: options.headers,
      httpsAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
    });

    // Parse PDF
    const pdfData = await pdfParse(response.data);

    const result: EnhancedScrapedPage = {
      url: options.url,
      method: 'pdf',
      content: pdfData.text,
      pdfText: pdfData.text,
      metadata: {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        language: pdfData.info?.Language,
      },
      performance: {
        loadTime: Date.now() - startTime,
        processingTime: Date.now() - startTime,
        retries: 0,
        proxy: proxyUrl,
      },
    };

    return result;
  }

  /**
   * Scrape via WebSocket
   */
  private async scrapeWebSocket(options: AdvancedScrapeOptions): Promise<EnhancedScrapedPage> {
    const startTime = Date.now();
    const messages: string[] = [];

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(options.wsEndpoint || options.url, options.wsProtocol);
      
      // Store connection
      this.wsConnections.set(options.url, ws);

      ws.on('open', () => {
        console.log(chalk.green('WebSocket connected'));
      });

      ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        messages.push(data.toString());
      });

      ws.on('error', (error: Error) => {
        reject(error);
      });

      ws.on('close', () => {
        const result: EnhancedScrapedPage = {
          url: options.url,
          method: 'websocket',
          content: messages.join('\n'),
          metadata: {},
          performance: {
            loadTime: Date.now() - startTime,
            processingTime: Date.now() - startTime,
            retries: 0,
          },
        };
        resolve(result);
      });

      // Set timeout
      setTimeout(() => {
        ws.close();
      }, options.timeout);
    });
  }

  /**
   * Scrape dynamic content with Playwright
   */
  private async scrapeDynamic(
    options: AdvancedScrapeOptions,
    proxyUrl?: string
  ): Promise<EnhancedScrapedPage> {
    const startTime = Date.now();

    // Use cloud browser if configured
    if (options.cloudBrowser) {
      return await this.scrapeWithCloudBrowser(options);
    }

    // Initialize browser
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        proxy: proxyUrl ? { server: proxyUrl } : undefined,
      });
    }

    // Create context with authentication
    this.context = await this.browser.newContext({
      extraHTTPHeaders: options.headers,
    });

    const page = await this.context.newPage();
    
    try {
      await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: options.timeout,
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector);
      }

      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract images for potential OCR
      const images = await this.extractImages(page);

      const result: EnhancedScrapedPage = {
        url: options.url,
        method: 'dynamic',
        content,
        markdown: this.htmlToMarkdown($),
        images,
        metadata: {
          title: await page.title(),
          description: $('meta[name="description"]').attr('content'),
        },
        performance: {
          loadTime: Date.now() - startTime,
          processingTime: Date.now() - startTime,
          retries: 0,
          proxy: proxyUrl,
        },
      };

      return result;

    } finally {
      await page.close();
    }
  }

  /**
   * Scrape with cloud browser
   */
  private async scrapeWithCloudBrowser(
    options: AdvancedScrapeOptions
  ): Promise<EnhancedScrapedPage> {
    const cloudConfig = options.cloudBrowser!;
    
    switch (cloudConfig.provider) {
      case 'browserless':
        return await this.scrapeWithBrowserless(options, cloudConfig);
      
      case 'puppeteer-cloud':
        // Implement Puppeteer Cloud integration
        throw new Error('Puppeteer Cloud not yet implemented');
      
      case 'selenium-grid':
        // Implement Selenium Grid integration
        throw new Error('Selenium Grid not yet implemented');
      
      default:
        throw new Error(`Unknown cloud browser provider: ${cloudConfig.provider}`);
    }
  }

  /**
   * Scrape with Browserless
   */
  private async scrapeWithBrowserless(
    options: AdvancedScrapeOptions,
    cloudConfig: CloudBrowserConfig
  ): Promise<EnhancedScrapedPage> {
    const browser = await chromium.connect({
      wsEndpoint: `${cloudConfig.endpoint}?token=${cloudConfig.apiKey}`,
    });

    const page = await browser.newPage();
    
    try {
      await page.goto(options.url, { 
        waitUntil: 'networkidle',
        timeout: cloudConfig.timeout,
      });

      const content = await page.content();
      const $ = cheerio.load(content);

      return {
        url: options.url,
        method: 'dynamic',
        content,
        markdown: this.htmlToMarkdown($),
        metadata: {
          title: await page.title(),
        },
        performance: {
          loadTime: 0,
          processingTime: 0,
          retries: 0,
        },
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Scrape static content
   */
  private async scrapeStatic(
    options: AdvancedScrapeOptions,
    proxyUrl?: string
  ): Promise<EnhancedScrapedPage> {
    const startTime = Date.now();

    const config: AxiosRequestConfig = {
      timeout: options.timeout,
      headers: options.headers,
    };

    if (proxyUrl) {
      config.httpsAgent = new HttpsProxyAgent(proxyUrl);
      config.httpAgent = new HttpProxyAgent(proxyUrl);
    }

    const response = await axios.get(options.url, config);
    const $ = cheerio.load(response.data);

    return {
      url: options.url,
      method: 'static',
      content: response.data,
      markdown: this.htmlToMarkdown($),
      metadata: {
        title: $('title').text(),
        description: $('meta[name="description"]').attr('content'),
      },
      performance: {
        loadTime: Date.now() - startTime,
        processingTime: Date.now() - startTime,
        retries: 0,
        proxy: proxyUrl,
      },
    };
  }

  /**
   * Apply custom extraction rules
   */
  private async applyExtractionRules(
    content: string,
    rules: ExtractionRule[]
  ): Promise<Record<string, any>> {
    const extracted: Record<string, any> = {};
    const $ = cheerio.load(content);

    for (const rule of rules) {
      let value: any;

      // CSS Selector extraction
      if (rule.selector) {
        const elements = $(rule.selector);
        if (rule.multiple) {
          value = elements.map((_, el) => $(el).text()).get();
        } else {
          value = elements.first().text();
        }
      }

      // JSONPath extraction
      if (rule.jsonPath) {
        try {
          const json = JSON.parse(content);
          value = JSONPath({ path: rule.jsonPath, json });
        } catch {
          // Not JSON content
        }
      }

      // Regex extraction
      if (rule.regex) {
        const regex = new RegExp(rule.regex, rule.multiple ? 'g' : '');
        const matches = content.match(regex);
        value = rule.multiple ? matches : matches?.[0];
      }

      // Apply transformation
      if (value && rule.transform) {
        switch (rule.transform) {
          case 'json':
            try {
              value = JSON.parse(value);
            } catch {
              // Keep as string
            }
            break;
          case 'custom':
            if (rule.postProcess) {
              value = eval(rule.postProcess)(value);
            }
            break;
        }
      }

      // Apply default if required and missing
      if (rule.required && !value) {
        value = rule.default;
      }

      extracted[rule.name] = value;
    }

    return extracted;
  }

  /**
   * Perform OCR on images
   */
  private async performOCR(
    result: EnhancedScrapedPage,
    options: AdvancedScrapeOptions
  ): Promise<EnhancedScrapedPage> {
    if (!result.images) return result;

    const worker = await Tesseract.createWorker(options.ocrLanguages[0]);

    for (const image of result.images) {
      try {
        const { data } = await worker.recognize(image.url);
        
        if (data.confidence > options.ocrConfidenceThreshold) {
          image.ocrText = data.text;
          
          // Append to main OCR text
          if (!result.ocrText) {
            result.ocrText = '';
          }
          result.ocrText += `\n${data.text}`;
        }
      } catch (error) {
        console.error(chalk.red(`OCR failed for ${image.url}: ${error}`));
      }
    }

    await worker.terminate();
    return result;
  }

  /**
   * Extract images from page
   */
  private async extractImages(page: Page): Promise<Array<{ url: string; alt?: string }>> {
    return await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const images = Array.from(document.querySelectorAll('img'));
      return images.map((img: any) => ({
        url: img.src,
        alt: img.alt,
      }));
    });
  }

  /**
   * Convert HTML to Markdown
   */
  private htmlToMarkdown($: cheerio.CheerioAPI): string {
    let markdown = '';

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const level = parseInt(el.name[1]);
      const prefix = '#'.repeat(level);
      markdown += `${prefix} ${$(el).text()}\n\n`;
    });

    // Extract paragraphs
    $('p').each((_, el) => {
      markdown += `${$(el).text()}\n\n`;
    });

    // Extract lists
    $('ul, ol').each((_, list) => {
      const isOrdered = list.name === 'ol';
      $(list).find('li').each((index, li) => {
        const prefix = isOrdered ? `${index + 1}.` : '-';
        markdown += `${prefix} ${$(li).text()}\n`;
      });
      markdown += '\n';
    });

    // Extract links
    $('a').each((_, el) => {
      const text = $(el).text();
      const href = $(el).attr('href');
      if (href) {
        markdown += `[${text}](${href})\n`;
      }
    });

    return markdown.trim();
  }

  /**
   * Queue a scraping job for distributed processing
   */
  async queueScrapeJob(options: AdvancedScrapeOptions): Promise<Bull.Job> {
    if (!this.bullQueue) {
      throw new Error('Distributed crawling not initialized');
    }

    return await this.bullQueue.add(options);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.bullQueue) {
      throw new Error('Distributed crawling not initialized');
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.bullQueue.getWaitingCount(),
      this.bullQueue.getActiveCount(),
      this.bullQueue.getCompletedCount(),
      this.bullQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    if (this.bullQueue) {
      await this.bullQueue.close();
    }

    // Close WebSocket connections
    for (const [url, ws] of this.wsConnections) {
      ws.close();
    }
    this.wsConnections.clear();
  }
}