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
      strategies: ['css-selectors', 'json-ld'],
      fallbackToText: true,
      customRules: [],
      ai: {
        enabled: false,
        model: 'claude-3-sonnet',
        maxTokens: 4096
      }
    },
    pdf: {
      enabled: false,
      ocrEnabled: false,
      ocrLanguage: 'eng',
      extractImages: false,
      maxPages: 100
    },
    crawling: {
      maxDepth: 3,
      maxPages: 100,
      followExternalLinks: false,
      respectRobotsTxt: true,
      patterns: {
        include: ['**/*'],
        exclude: ['*.pdf', '*.zip', '*.exe']
      }
    },
    distributed: {
      enabled: false,
      workerCount: 4,
      queueType: 'bull',
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1
      }
    },
    cloudBrowser: {
      enabled: false,
      provider: 'browserless',
      apiUrl: 'https://chrome.browserless.io',
      apiKey: undefined,
      timeout: 30000
    },
    rateLimit: {
      enabled: true,
      maxConcurrent: 5,
      maxPerSecond: 10,
      retryDelay: 1000
    },
    cache: {
      enabled: true,
      ttl: 3600,
      strategy: 'memory',
      redis: undefined,
      maxSize: 100
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
      interval: 3600000,
      alerts: {
        enabled: false,
        channels: []
      },
      metrics: ['total-sources', 'update-frequency']
    },
    moderation: {
      enabled: false,
      autoApprove: false,
      reviewers: [],
      rules: []
    },
    patterns: {
      enabled: false,
      aiExtraction: false,
      templates: [],
      customRules: []
    },
    processing: {
      batchSize: 10,
      maxConcurrent: 5,
      retryAttempts: 3,
      timeout: 30000,
      deduplication: {
        enabled: true,
        strategy: 'content-hash'
      }
    },
    scheduling: {
      enabled: true,
      defaultCron: '0 0 * * *',
      timezone: 'UTC',
      retryOnFailure: true,
      maxRetries: 3
    },
    versioning: {
      enabled: true,
      maxVersions: 10,
      diffStrategy: 'line-by-line',
      compression: false
    },
    analytics: {
      enabled: false,
      trackUsage: false,
      trackQuality: false,
      reportingInterval: 86400000
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