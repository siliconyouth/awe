/**
 * Scraper Configuration Schema
 * 
 * Configuration for web scraping, content extraction, and crawling
 */

import { z } from 'zod'

/**
 * Scraper engine configuration
 */
export const ScraperEngineSchema = z.object({
  defaultEngine: z.enum(['playwright', 'puppeteer', 'cheerio', 'auto']).default('auto'),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  retryDelay: z.number().default(1000),
  userAgent: z.string().optional(),
  headers: z.record(z.string()).default({}),
  viewport: z.object({
    width: z.number().default(1920),
    height: z.number().default(1080),
  }),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).default('networkidle'),
})

/**
 * Proxy configuration for scraping
 */
export const ProxyConfigSchema = z.object({
  enabled: z.boolean().default(false),
  rotation: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().default(60000), // 1 minute
    strategy: z.enum(['round-robin', 'random', 'least-used', 'geo-based']).default('round-robin'),
  }),
  proxies: z.array(z.object({
    url: z.string().url(),
    username: z.string().optional(),
    password: z.string().optional(),
    country: z.string().optional(),
    priority: z.number().default(1),
    maxConcurrent: z.number().default(10),
  })).default([]),
  fallback: z.object({
    enabled: z.boolean().default(true),
    direct: z.boolean().default(true),
  }),
})

/**
 * Browser pool configuration
 */
export const BrowserPoolSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.object({
    min: z.number().default(1),
    max: z.number().default(5),
  }),
  instanceTimeout: z.number().default(300000), // 5 minutes
  launchOptions: z.object({
    headless: z.boolean().default(true),
    devtools: z.boolean().default(false),
    args: z.array(z.string()).default([
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ]),
  }),
  recycleAfter: z.number().default(100), // Recycle browser after N pages
})

/**
 * Content extraction configuration
 */
export const ExtractionConfigSchema = z.object({
  selectors: z.object({
    title: z.array(z.string()).default(['title', 'h1', 'meta[property="og:title"]']),
    description: z.array(z.string()).default(['meta[name="description"]', 'meta[property="og:description"]']),
    content: z.array(z.string()).default(['main', 'article', '[role="main"]', '#content', '.content']),
    author: z.array(z.string()).default(['meta[name="author"]', '[rel="author"]', '.author']),
    date: z.array(z.string()).default(['time', 'meta[property="article:published_time"]', '.date']),
    images: z.array(z.string()).default(['img', 'picture img']),
  }),
  rules: z.array(z.object({
    name: z.string(),
    pattern: z.string(), // URL pattern
    selectors: z.record(z.string()),
    transform: z.string().optional(), // JavaScript transformation
  })).default([]),
  readability: z.object({
    enabled: z.boolean().default(true),
    minScore: z.number().default(0.5),
  }),
  markdown: z.object({
    enabled: z.boolean().default(true),
    includeImages: z.boolean().default(true),
    includeLinks: z.boolean().default(true),
    maxLength: z.number().optional(),
  }),
})

/**
 * PDF extraction configuration
 */
export const PdfExtractionSchema = z.object({
  enabled: z.boolean().default(true),
  ocr: z.object({
    enabled: z.boolean().default(false),
    languages: z.array(z.string()).default(['eng']),
    confidence: z.number().default(0.6),
  }),
  maxPages: z.number().optional(),
  extractImages: z.boolean().default(false),
  extractMetadata: z.boolean().default(true),
})

/**
 * Crawling configuration
 */
export const CrawlingConfigSchema = z.object({
  maxDepth: z.number().default(3),
  maxPages: z.number().default(100),
  concurrency: z.number().default(5),
  delay: z.number().default(1000),
  respectRobotsTxt: z.boolean().default(true),
  followRedirects: z.boolean().default(true),
  maxRedirects: z.number().default(5),
  urlFilters: z.object({
    allowed: z.array(z.string()).default([]),
    blocked: z.array(z.string()).default([]),
    allowedDomains: z.array(z.string()).default([]),
    blockedDomains: z.array(z.string()).default([]),
  }),
  queueStrategy: z.enum(['fifo', 'lifo', 'priority']).default('fifo'),
  deduplication: z.object({
    enabled: z.boolean().default(true),
    strategy: z.enum(['url', 'content-hash', 'both']).default('url'),
  }),
})

/**
 * Distributed crawling configuration
 */
export const DistributedCrawlingSchema = z.object({
  enabled: z.boolean().default(false),
  redis: z.object({
    url: z.string().url().optional(),
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(2),
  }),
  queue: z.object({
    name: z.string().default('scraper-queue'),
    workers: z.number().default(4),
    stallInterval: z.number().default(30000),
    maxStalledCount: z.number().default(1),
  }),
  coordination: z.object({
    heartbeatInterval: z.number().default(5000),
    lockTimeout: z.number().default(30000),
  }),
})

/**
 * Cloud browser configuration
 */
export const CloudBrowserSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['browserless', 'puppeteer-cloud', 'selenium-grid', 'custom']).default('browserless'),
  browserless: z.object({
    endpoint: z.string().url().default('wss://chrome.browserless.io'),
    apiKey: z.string().optional(),
    timeout: z.number().default(30000),
  }).optional(),
  customEndpoint: z.string().url().optional(),
  fallbackToLocal: z.boolean().default(true),
})

/**
 * Rate limiting configuration
 */
export const ScraperRateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  default: z.object({
    requests: z.number().default(10),
    window: z.number().default(60000), // 1 minute
  }),
  perDomain: z.record(z.object({
    requests: z.number(),
    window: z.number(),
  })).default({}),
  backoff: z.object({
    enabled: z.boolean().default(true),
    initialDelay: z.number().default(1000),
    maxDelay: z.number().default(60000),
    factor: z.number().default(2),
  }),
})

/**
 * Caching configuration for scraper
 */
export const ScraperCacheSchema = z.object({
  enabled: z.boolean().default(true),
  ttl: z.number().default(3600000), // 1 hour
  maxSize: z.number().default(100), // MB
  strategy: z.enum(['lru', 'lfu', 'ttl']).default('lru'),
  storage: z.enum(['memory', 'disk', 'redis']).default('memory'),
  diskPath: z.string().default('./cache/scraper'),
  keyStrategy: z.enum(['url', 'url-hash', 'custom']).default('url-hash'),
})

/**
 * Complete scraper configuration
 */
export const ScraperConfigSchema = z.object({
  engine: ScraperEngineSchema,
  proxy: ProxyConfigSchema,
  browserPool: BrowserPoolSchema,
  extraction: ExtractionConfigSchema,
  pdf: PdfExtractionSchema,
  crawling: CrawlingConfigSchema,
  distributed: DistributedCrawlingSchema,
  cloudBrowser: CloudBrowserSchema,
  rateLimit: ScraperRateLimitSchema,
  cache: ScraperCacheSchema,
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metrics: z.array(z.enum(['success-rate', 'response-time', 'error-rate', 'cache-hit-rate'])).default(['success-rate', 'response-time']),
    alerting: z.object({
      enabled: z.boolean().default(false),
      thresholds: z.object({
        errorRate: z.number().default(0.1), // 10%
        responseTime: z.number().default(10000), // 10 seconds
      }),
    }),
  }),
})

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>