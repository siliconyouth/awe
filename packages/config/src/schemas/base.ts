/**
 * Base Configuration Schemas
 * 
 * Core configuration schemas that define the shape and validation
 * for all configuration domains in the AWE system
 */

import { z } from 'zod'

/**
 * Environment types
 */
export const EnvironmentSchema = z.enum(['development', 'staging', 'production', 'test'])
export type Environment = z.infer<typeof EnvironmentSchema>

/**
 * Log levels
 */
export const LogLevelSchema = z.enum(['error', 'warn', 'info', 'debug', 'trace'])
export type LogLevel = z.infer<typeof LogLevelSchema>

/**
 * Base application configuration
 */
export const AppConfigSchema = z.object({
  name: z.string().default('AWE'),
  version: z.string().default('2.0.0'),
  environment: EnvironmentSchema.default('development'),
  debug: z.boolean().default(false),
  logging: z.object({
    level: LogLevelSchema.default('info'),
    format: z.enum(['json', 'pretty']).default('pretty'),
    destination: z.enum(['console', 'file', 'both']).default('console'),
    filePath: z.string().optional(),
    maxFiles: z.number().default(5),
    maxSize: z.string().default('10m'),
  }),
  metrics: z.object({
    enabled: z.boolean().default(false),
    port: z.number().default(9090),
    path: z.string().default('/metrics'),
  }),
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    port: z.number().default(8080),
    path: z.string().default('/health'),
    interval: z.number().default(30000), // 30 seconds
  }),
})

export type AppConfig = z.infer<typeof AppConfigSchema>

/**
 * Database configuration
 */
export const DatabaseConfigSchema = z.object({
  url: z.string().url().optional(),
  directUrl: z.string().url().optional(),
  pool: z.object({
    min: z.number().default(2),
    max: z.number().default(10),
    acquireTimeout: z.number().default(30000),
    idleTimeout: z.number().default(10000),
  }),
  migrations: z.object({
    autoRun: z.boolean().default(false),
    directory: z.string().default('./migrations'),
  }),
  ssl: z.object({
    enabled: z.boolean().default(true),
    rejectUnauthorized: z.boolean().default(true),
  }),
})

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>

/**
 * API configuration
 */
export const ApiConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  port: z.number().default(3000),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
    credentials: z.boolean().default(true),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    headers: z.array(z.string()).default(['Content-Type', 'Authorization']),
  }),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    windowMs: z.number().default(60000), // 1 minute
    maxRequests: z.number().default(100),
    message: z.string().default('Too many requests, please try again later'),
  }),
  timeout: z.object({
    server: z.number().default(30000),
    request: z.number().default(10000),
  }),
  bodyParser: z.object({
    jsonLimit: z.string().default('10mb'),
    textLimit: z.string().default('10mb'),
    urlencoded: z.boolean().default(true),
  }),
})

export type ApiConfig = z.infer<typeof ApiConfigSchema>

/**
 * Authentication configuration
 */
export const AuthConfigSchema = z.object({
  provider: z.enum(['clerk', 'auth0', 'supabase', 'custom']).default('clerk'),
  clerk: z.object({
    publishableKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    signInUrl: z.string().default('/sign-in'),
    signUpUrl: z.string().default('/sign-up'),
    afterSignInUrl: z.string().default('/dashboard'),
    afterSignUpUrl: z.string().default('/dashboard'),
  }).optional(),
  session: z.object({
    secret: z.string().optional(),
    maxAge: z.number().default(86400000), // 24 hours
    sameSite: z.enum(['lax', 'strict', 'none']).default('lax'),
    secure: z.boolean().default(true),
    httpOnly: z.boolean().default(true),
  }),
  jwt: z.object({
    secret: z.string().optional(),
    expiresIn: z.string().default('24h'),
    algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256']).default('HS256'),
  }),
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>

/**
 * Feature flags configuration
 */
export const FeatureFlagsSchema = z.object({
  provider: z.enum(['local', 'launchdarkly', 'unleash', 'custom']).default('local'),
  flags: z.record(z.boolean()).default({}),
  launchDarkly: z.object({
    sdkKey: z.string().optional(),
    environment: z.string().optional(),
  }).optional(),
  unleash: z.object({
    url: z.string().url().optional(),
    appName: z.string().optional(),
    instanceId: z.string().optional(),
  }).optional(),
})

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>

/**
 * Cache configuration
 */
export const CacheConfigSchema = z.object({
  provider: z.enum(['memory', 'redis', 'memcached']).default('memory'),
  ttl: z.number().default(3600), // 1 hour
  checkPeriod: z.number().default(600), // 10 minutes
  maxKeys: z.number().default(1000),
  redis: z.object({
    url: z.string().url().optional(),
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('awe:'),
  }).optional(),
  memcached: z.object({
    servers: z.array(z.string()).default(['localhost:11211']),
    options: z.record(z.any()).default({}),
  }).optional(),
})

export type CacheConfig = z.infer<typeof CacheConfigSchema>

/**
 * Queue configuration
 */
export const QueueConfigSchema = z.object({
  provider: z.enum(['bull', 'bullmq', 'bee-queue', 'memory']).default('bull'),
  defaultJobOptions: z.object({
    attempts: z.number().default(3),
    backoff: z.object({
      type: z.enum(['fixed', 'exponential']).default('exponential'),
      delay: z.number().default(5000),
    }),
    removeOnComplete: z.boolean().default(true),
    removeOnFail: z.boolean().default(false),
  }),
  redis: z.object({
    url: z.string().url().optional(),
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(1),
  }),
  workers: z.object({
    concurrency: z.number().default(5),
    maxStalledCount: z.number().default(1),
    stalledInterval: z.number().default(30000),
  }),
})

export type QueueConfig = z.infer<typeof QueueConfigSchema>

/**
 * Storage configuration
 */
export const StorageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'gcs', 'azure']).default('local'),
  local: z.object({
    basePath: z.string().default('./storage'),
    publicPath: z.string().default('./storage/public'),
    privatePath: z.string().default('./storage/private'),
  }),
  s3: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().default('us-east-1'),
    bucket: z.string().optional(),
    endpoint: z.string().url().optional(),
  }).optional(),
  gcs: z.object({
    projectId: z.string().optional(),
    keyFilename: z.string().optional(),
    bucket: z.string().optional(),
  }).optional(),
  azure: z.object({
    accountName: z.string().optional(),
    accountKey: z.string().optional(),
    containerName: z.string().optional(),
  }).optional(),
})

export type StorageConfig = z.infer<typeof StorageConfigSchema>

/**
 * Email configuration
 */
export const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'ses', 'mailgun', 'console']).default('console'),
  from: z.object({
    name: z.string().default('AWE'),
    email: z.string().email().default('noreply@awe.dev'),
  }),
  smtp: z.object({
    host: z.string().optional(),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().optional(),
      pass: z.string().optional(),
    }),
  }).optional(),
  sendgrid: z.object({
    apiKey: z.string().optional(),
  }).optional(),
  ses: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().default('us-east-1'),
  }).optional(),
  mailgun: z.object({
    apiKey: z.string().optional(),
    domain: z.string().optional(),
  }).optional(),
})

export type EmailConfig = z.infer<typeof EmailConfigSchema>