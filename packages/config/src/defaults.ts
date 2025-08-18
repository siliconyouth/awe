/**
 * Default configuration values for all schemas
 */

import type { AWEConfig } from './manager'

export const DEFAULT_CONFIG: AWEConfig = {
  app: {
    name: 'AWE',
    version: '2.0.0',
    environment: 'development',
    debug: false,
    logging: {
      level: 'info',
      format: 'pretty',
      destination: 'console',
      maxFiles: 5,
      maxSize: '10m'
    },
    metrics: {
      enabled: false,
      port: 9090,
      path: '/metrics'
    },
    healthCheck: {
      enabled: true,
      port: 8080,
      path: '/health',
      interval: 30000
    }
  },
  database: {
    pool: {
      min: 2,
      max: 10,
      acquireTimeout: 30000,
      idleTimeout: 10000
    },
    migrations: {
      directory: './migrations',
      autoRun: false
    },
    ssl: {
      enabled: false,
      rejectUnauthorized: true
    }
  },
  api: {
    port: 3000,
    cors: {
      enabled: true,
      origins: ['*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization']
    },
    rateLimit: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 100,
      message: 'Too many requests, please try again later'
    },
    timeout: {
      server: 30000,
      request: 10000
    },
    bodyParser: {
      jsonLimit: '10mb',
      textLimit: '10mb',
      urlencoded: true
    }
  },
  auth: {
    provider: 'clerk',
    session: {
      maxAge: 86400000,
      sameSite: 'lax',
      secure: true,
      httpOnly: true
    },
    jwt: {
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  },
  features: {
    provider: 'local',
    flags: {}
  },
  cache: {
    provider: 'memory',
    ttl: 3600,
    checkPeriod: 600,
    maxKeys: 1000
  },
  queue: {
    provider: 'bull',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    workers: {
      concurrency: 5,
      maxStalledCount: 3,
      stalledInterval: 30000
    }
  },
  storage: {
    provider: 'local',
    local: {
      basePath: './storage',
      publicPath: './storage/public',
      privatePath: './storage/private'
    },
    s3: {
      region: 'us-east-1'
    },
    gcs: {
      projectId: ''
    }
  },
  email: {
    provider: 'smtp',
    from: {
      name: 'AWE',
      email: 'noreply@awe.dev'
    },
    smtp: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    },
    sendgrid: {},
    ses: {
      region: 'us-east-1'
    },
    mailgun: {}
  },
  scraper: {
    engine: {
      defaultEngine: 'playwright',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      userAgent: undefined,
      headers: {},
      viewport: {
        width: 1920,
        height: 1080
      },
      waitUntil: 'networkidle'
    },
    proxy: {
      enabled: false,
      rotation: {
        enabled: false,
        interval: 60000,
        strategy: 'round-robin'
      },
      proxies: [],
      fallback: {
        enabled: true,
        direct: true
      }
    },
    browserPool: {
      enabled: true,
      size: {
        min: 1,
        max: 5
      },
      instanceTimeout: 300000,
      launchOptions: {
        headless: true,
        devtools: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run'
        ]
      },
      recycleAfter: 100
    },
    extraction: {
      selectors: {
        title: ['title', 'h1', 'meta[property="og:title"]'],
        description: ['meta[name="description"]', 'meta[property="og:description"]'],
        content: ['main', 'article', '[role="main"]', '#content', '.content'],
        author: ['meta[name="author"]', '[rel="author"]', '.author'],
        date: ['time', 'meta[property="article:published_time"]', '.date'],
        images: ['img', 'picture img']
      },
      rules: [],
      readability: {
        enabled: true,
        minScore: 0.5
      },
      markdown: {
        enabled: true,
        includeImages: true,
        includeLinks: true
      }
    },
    pdf: {
      enabled: true,
      ocr: {
        enabled: false,
        languages: ['eng'],
        confidence: 0.6
      },
      maxPages: 100,
      extractImages: false,
      extractMetadata: true
    },
    crawling: {
      maxDepth: 3,
      maxPages: 100,
      concurrency: 5,
      delay: 1000,
      respectRobotsTxt: true,
      followRedirects: true,
      maxRedirects: 5,
      urlFilters: {
        allowed: [],
        blocked: [],
        allowedDomains: [],
        blockedDomains: []
      },
      queueStrategy: 'fifo',
      deduplication: {
        enabled: true,
        strategy: 'url'
      }
    },
    distributed: {
      enabled: false,
      redis: {
        host: 'localhost',
        port: 6379,
        db: 2
      },
      queue: {
        name: 'scraper-queue',
        workers: 4,
        stallInterval: 30000,
        maxStalledCount: 1
      },
      coordination: {
        heartbeatInterval: 5000,
        lockTimeout: 30000
      }
    },
    cloudBrowser: {
      enabled: false,
      provider: 'browserless',
      browserless: {
        endpoint: 'wss://chrome.browserless.io',
        apiKey: undefined,
        timeout: 30000
      },
      fallbackToLocal: true
    },
    rateLimit: {
      enabled: true,
      default: {
        requests: 10,
        window: 60000
      },
      perDomain: {},
      backoff: {
        enabled: true,
        initialDelay: 1000,
        maxDelay: 60000,
        factor: 2
      }
    },
    cache: {
      enabled: true,
      ttl: 3600000,
      maxSize: 100,
      strategy: 'lru',
      storage: 'memory',
      diskPath: './cache/scraper',
      keyStrategy: 'url-hash'
    },
    monitoring: {
      enabled: true,
      metrics: ['success-rate', 'response-time'],
      alerting: {
        enabled: false,
        thresholds: {
          errorRate: 0.1,
          responseTime: 10000
        }
      }
    }
  },
  knowledge: {
    sources: [],
    monitoring: {
      enabled: true,
      intervals: {
        realtime: 60000,
        hourly: 3600000,
        daily: 86400000,
        weekly: 604800000
      },
      changeDetection: {
        enabled: true,
        algorithm: 'hybrid',
        threshold: 0.1,
        ignoreMinorChanges: true
      },
      alerts: {
        enabled: true,
        channels: ['database'],
        conditions: []
      },
      retention: {
        versions: 30,
        days: 90,
        compressOld: true
      }
    },
    moderation: {
      enabled: true,
      provider: 'anthropic',
      models: {
        classification: 'claude-3-haiku',
        summarization: 'claude-3-sonnet',
        extraction: 'claude-3-haiku',
        quality: 'claude-3-opus'
      },
      rules: [],
      autoApproval: {
        enabled: false,
        minScore: 0.8,
        requireAllRules: true
      },
      humanReview: {
        enabled: true,
        queue: 'moderation-queue',
        timeout: 86400000,
        autoAction: 'escalate'
      }
    },
    patterns: {
      enabled: true,
      types: ['api-endpoints', 'code-examples', 'configuration'],
      ai: {
        enabled: true,
        model: 'claude-3-haiku',
        confidence: 0.7,
        maxTokens: 4000
      },
      rules: [],
      storage: {
        format: 'database',
        groupBy: 'type'
      }
    },
    processing: {
      pipeline: ['clean', 'normalize', 'extract', 'classify'],
      cleaning: {
        removeScripts: true,
        removeStyles: true,
        removeComments: true,
        removeEmptyElements: true,
        normalizeWhitespace: true
      },
      enrichment: {
        enabled: true,
        addMetadata: true,
        generateEmbeddings: false,
        extractKeywords: true,
        detectLanguage: true,
        calculateReadability: true
      },
      transformation: {
        toMarkdown: true,
        toPlainText: false,
        toJson: true,
        customTransforms: []
      }
    },
    scheduling: {
      enabled: true,
      timezone: 'UTC',
      jobs: [],
      concurrency: {
        max: 5,
        perSource: 2
      },
      priority: {
        enabled: true,
        levels: 3,
        strategy: 'weighted'
      }
    },
    versioning: {
      enabled: true,
      strategy: 'timestamp',
      storage: {
        type: 'database',
        compression: true,
        encryption: false
      },
      comparison: {
        enabled: true,
        algorithm: 'diff',
        trackChanges: true
      },
      retention: {
        maxVersions: 100,
        maxAge: 7776000000,
        keepMilestones: true
      }
    },
    analytics: {
      enabled: true,
      metrics: ['content-growth', 'update-frequency', 'quality-scores'],
      reporting: {
        enabled: true,
        schedule: '0 9 * * MON',
        recipients: [],
        format: 'html'
      },
      dashboards: {
        enabled: true,
        refresh: 60000,
        public: false
      }
    },
    limits: {
      maxSources: 100,
      maxContentSize: 10485760,
      maxConcurrentJobs: 10,
      rateLimitPerMinute: 100
    }
  },
  custom: {}
}