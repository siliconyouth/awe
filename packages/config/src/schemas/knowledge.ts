/**
 * Knowledge Management Configuration Schema
 * 
 * Configuration for knowledge base, content monitoring, and AI moderation
 */

import { z } from 'zod'

/**
 * Knowledge source types
 */
export const SourceTypeSchema = z.enum([
  'website',
  'documentation',
  'api',
  'github',
  'rss',
  'sitemap',
  'database',
  'file',
  'custom'
])

/**
 * Content type classification
 */
export const ContentTypeSchema = z.enum([
  'documentation',
  'tutorial',
  'guide',
  'api-reference',
  'blog',
  'changelog',
  'faq',
  'example',
  'video',
  'other'
])

/**
 * Knowledge source configuration
 */
export const KnowledgeSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SourceTypeSchema,
  url: z.string().url().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().default(1),
  schedule: z.object({
    enabled: z.boolean().default(true),
    cron: z.string().default('0 0 * * *'), // Daily at midnight
    timezone: z.string().default('UTC'),
  }),
  authentication: z.object({
    type: z.enum(['none', 'basic', 'bearer', 'oauth2', 'api-key']).default('none'),
    credentials: z.record(z.string()).optional(),
  }),
  extraction: z.object({
    selectors: z.record(z.string()).optional(),
    patterns: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional(),
    maxDepth: z.number().default(3),
    maxPages: z.number().default(100),
  }),
  metadata: z.record(z.any()).default({}),
})

/**
 * Monitoring configuration
 */
export const MonitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  intervals: z.object({
    realtime: z.number().default(60000), // 1 minute
    hourly: z.number().default(3600000), // 1 hour
    daily: z.number().default(86400000), // 24 hours
    weekly: z.number().default(604800000), // 7 days
  }),
  changeDetection: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['diff', 'hash', 'semantic', 'hybrid']).default('hybrid'),
    threshold: z.number().default(0.1), // 10% change
    ignoreMinorChanges: z.boolean().default(true),
  }),
  alerts: z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(['email', 'slack', 'webhook', 'database'])).default(['database']),
    conditions: z.array(z.object({
      type: z.enum(['new-content', 'major-change', 'removed-content', 'error', 'pattern-match']),
      severity: z.enum(['info', 'warning', 'critical']),
      threshold: z.number().optional(),
      pattern: z.string().optional(),
    })).default([]),
  }),
  retention: z.object({
    versions: z.number().default(30), // Keep 30 versions
    days: z.number().default(90), // Keep for 90 days
    compressOld: z.boolean().default(true),
  }),
})

/**
 * AI moderation configuration
 */
export const ModerationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  provider: z.enum(['anthropic', 'openai', 'custom']).default('anthropic'),
  models: z.object({
    classification: z.string().default('claude-3-haiku'),
    summarization: z.string().default('claude-3-sonnet'),
    extraction: z.string().default('claude-3-haiku'),
    quality: z.string().default('claude-3-opus'),
  }),
  rules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean().default(true),
    type: z.enum(['quality', 'relevance', 'safety', 'accuracy', 'custom']),
    threshold: z.number().default(0.7),
    action: z.enum(['approve', 'review', 'reject', 'flag']),
    conditions: z.record(z.any()).optional(),
  })).default([]),
  autoApproval: z.object({
    enabled: z.boolean().default(false),
    minScore: z.number().default(0.8),
    requireAllRules: z.boolean().default(true),
  }),
  humanReview: z.object({
    enabled: z.boolean().default(true),
    queue: z.string().default('moderation-queue'),
    timeout: z.number().default(86400000), // 24 hours
    autoAction: z.enum(['approve', 'reject', 'escalate']).default('escalate'),
  }),
})

/**
 * Pattern extraction configuration
 */
export const PatternExtractionSchema = z.object({
  enabled: z.boolean().default(true),
  types: z.array(z.enum([
    'api-endpoints',
    'code-examples',
    'configuration',
    'commands',
    'errors',
    'best-practices',
    'deprecations',
    'breaking-changes'
  ])).default(['api-endpoints', 'code-examples', 'configuration']),
  ai: z.object({
    enabled: z.boolean().default(true),
    model: z.string().default('claude-3-haiku'),
    confidence: z.number().default(0.7),
    maxTokens: z.number().default(4000),
  }),
  rules: z.array(z.object({
    pattern: z.string(),
    type: z.string(),
    extract: z.record(z.string()),
    transform: z.string().optional(),
  })).default([]),
  storage: z.object({
    format: z.enum(['json', 'markdown', 'database']).default('database'),
    groupBy: z.enum(['source', 'type', 'date', 'custom']).default('type'),
  }),
})

/**
 * Content processing configuration
 */
export const ContentProcessingSchema = z.object({
  pipeline: z.array(z.enum([
    'clean',
    'normalize',
    'extract',
    'classify',
    'summarize',
    'translate',
    'enrich',
    'validate'
  ])).default(['clean', 'normalize', 'extract', 'classify']),
  cleaning: z.object({
    removeScripts: z.boolean().default(true),
    removeStyles: z.boolean().default(true),
    removeComments: z.boolean().default(true),
    removeEmptyElements: z.boolean().default(true),
    normalizeWhitespace: z.boolean().default(true),
  }),
  enrichment: z.object({
    enabled: z.boolean().default(true),
    addMetadata: z.boolean().default(true),
    generateEmbeddings: z.boolean().default(false),
    extractKeywords: z.boolean().default(true),
    detectLanguage: z.boolean().default(true),
    calculateReadability: z.boolean().default(true),
  }),
  transformation: z.object({
    toMarkdown: z.boolean().default(true),
    toPlainText: z.boolean().default(false),
    toJson: z.boolean().default(true),
    customTransforms: z.array(z.object({
      name: z.string(),
      function: z.string(), // JavaScript function as string
      input: z.string(),
      output: z.string(),
    })).default([]),
  }),
})

/**
 * Scheduling configuration
 */
export const SchedulingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  timezone: z.string().default('UTC'),
  jobs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean().default(true),
    type: z.enum(['scrape', 'monitor', 'process', 'cleanup', 'report', 'custom']),
    schedule: z.union([
      z.object({ cron: z.string() }),
      z.object({ interval: z.number() }),
      z.object({ time: z.string() })
    ]),
    config: z.record(z.any()).optional(),
    retries: z.number().default(3),
    timeout: z.number().default(300000), // 5 minutes
  })).default([]),
  concurrency: z.object({
    max: z.number().default(5),
    perSource: z.number().default(2),
  }),
  priority: z.object({
    enabled: z.boolean().default(true),
    levels: z.number().default(3),
    strategy: z.enum(['fifo', 'lifo', 'weighted']).default('weighted'),
  }),
})

/**
 * Versioning configuration
 */
export const VersioningConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strategy: z.enum(['timestamp', 'hash', 'semantic', 'incremental']).default('timestamp'),
  storage: z.object({
    type: z.enum(['database', 'filesystem', 's3', 'git']).default('database'),
    compression: z.boolean().default(true),
    encryption: z.boolean().default(false),
  }),
  comparison: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['diff', 'similarity', 'semantic']).default('diff'),
    trackChanges: z.boolean().default(true),
  }),
  retention: z.object({
    maxVersions: z.number().default(100),
    maxAge: z.number().default(7776000000), // 90 days
    keepMilestones: z.boolean().default(true),
  }),
})

/**
 * Analytics configuration
 */
export const KnowledgeAnalyticsSchema = z.object({
  enabled: z.boolean().default(true),
  metrics: z.array(z.enum([
    'content-growth',
    'update-frequency',
    'quality-scores',
    'usage-patterns',
    'source-reliability',
    'extraction-success',
    'processing-time'
  ])).default(['content-growth', 'update-frequency', 'quality-scores']),
  reporting: z.object({
    enabled: z.boolean().default(true),
    schedule: z.string().default('0 9 * * MON'), // Weekly on Monday at 9 AM
    recipients: z.array(z.string().email()).default([]),
    format: z.enum(['html', 'pdf', 'json', 'csv']).default('html'),
  }),
  dashboards: z.object({
    enabled: z.boolean().default(true),
    refresh: z.number().default(60000), // 1 minute
    public: z.boolean().default(false),
  }),
})

/**
 * Complete knowledge management configuration
 */
export const KnowledgeConfigSchema = z.object({
  sources: z.array(KnowledgeSourceSchema).default([]),
  monitoring: MonitoringConfigSchema,
  moderation: ModerationConfigSchema,
  patterns: PatternExtractionSchema,
  processing: ContentProcessingSchema,
  scheduling: SchedulingConfigSchema,
  versioning: VersioningConfigSchema,
  analytics: KnowledgeAnalyticsSchema,
  limits: z.object({
    maxSources: z.number().default(100),
    maxContentSize: z.number().default(10485760), // 10MB
    maxConcurrentJobs: z.number().default(10),
    rateLimitPerMinute: z.number().default(100),
  }),
})

export type KnowledgeConfig = z.infer<typeof KnowledgeConfigSchema>
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>
export type ModerationConfig = z.infer<typeof ModerationConfigSchema>