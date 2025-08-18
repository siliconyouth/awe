/**
 * AWE Configuration System
 * 
 * Comprehensive configuration management for all AWE services
 */

// Export manager
export { 
  ConfigManager, 
  getConfigManager, 
  resetConfigManager,
  type ConfigManagerOptions,
  type ConfigManagerEvents,
  type AWEConfig 
} from './manager'

// Export factory functions
export { 
  createWebConfig,
  createCliConfig,
  createApiConfig
} from './factory'

// Export providers
export { BaseConfigProvider, type IConfigProvider, type ConfigChangeEvent } from './providers/base'
export { EnvProvider, type EnvProviderOptions } from './providers/env'
export { FileProvider, type FileProviderOptions } from './providers/file'
export { DatabaseProvider, type DatabaseProviderOptions } from './providers/database'

// Import for internal use
import { ConfigManager, type ConfigManagerOptions, type AWEConfig, getConfigManager } from './manager'
import { EnvProvider } from './providers/env'
import { FileProvider } from './providers/file'
import { DatabaseProvider } from './providers/database'

// Export base schemas and types
export {
  // Schemas
  EnvironmentSchema,
  LogLevelSchema,
  AppConfigSchema,
  DatabaseConfigSchema,
  ApiConfigSchema,
  AuthConfigSchema,
  FeatureFlagsSchema,
  CacheConfigSchema,
  QueueConfigSchema,
  StorageConfigSchema,
  EmailConfigSchema,
  
  // Types
  type Environment,
  type LogLevel,
  type AppConfig,
  type DatabaseConfig,
  type ApiConfig,
  type AuthConfig,
  type FeatureFlags,
  type CacheConfig,
  type QueueConfig,
  type StorageConfig,
  type EmailConfig,
} from './schemas/base'

// Export scraper schemas and types
export {
  ScraperEngineSchema,
  ProxyConfigSchema,
  BrowserPoolSchema,
  ExtractionConfigSchema,
  PdfExtractionSchema,
  CrawlingConfigSchema,
  DistributedCrawlingSchema,
  CloudBrowserSchema,
  ScraperRateLimitSchema,
  ScraperCacheSchema,
  ScraperConfigSchema,
  type ScraperConfig,
} from './schemas/scraper'

// Export knowledge schemas and types
export {
  SourceTypeSchema,
  ContentTypeSchema,
  KnowledgeSourceSchema,
  MonitoringConfigSchema,
  ModerationConfigSchema,
  PatternExtractionSchema,
  ContentProcessingSchema,
  SchedulingConfigSchema,
  VersioningConfigSchema,
  KnowledgeAnalyticsSchema,
  KnowledgeConfigSchema,
  type KnowledgeConfig,
  type KnowledgeSource,
  type MonitoringConfig,
  type ModerationConfig,
} from './schemas/knowledge'

// Utility functions for common configuration tasks

/**
 * Load configuration from environment
 */
export async function loadFromEnv(prefix = 'AWE_'): Promise<Partial<AWEConfig>> {
  const provider = new EnvProvider({ prefix })
  return await provider.load()
}

/**
 * Load configuration from file
 */
export async function loadFromFile(path: string): Promise<Partial<AWEConfig>> {
  const provider = new FileProvider({ paths: [path] })
  return await provider.load()
}

/**
 * Create a pre-configured manager for CLI usage
 */
export function createCLIConfig(options: Partial<ConfigManagerOptions> = {}): ConfigManager {
  return new ConfigManager({
    providers: [
      new FileProvider({ 
        paths: [
          '.awe/config.json',
          '.awe/config.yaml',
          'awe.config.js',
        ],
        watch: false 
      }),
      new EnvProvider({ 
        prefix: 'AWE_',
        files: ['.env', '.env.local']
      }),
    ],
    validation: true,
    watch: false,
    cache: true,
    ...options
  })
}

/**
 * Create a pre-configured manager for service usage
 */
export function createServiceConfig(serviceName: string, options: Partial<ConfigManagerOptions> = {}): ConfigManager {
  return new ConfigManager({
    providers: [
      new FileProvider({ 
        paths: [`config/${serviceName}.json`, `config/${serviceName}.yaml`],
        watch: true 
      }),
      new EnvProvider({ 
        prefix: `${serviceName.toUpperCase()}_`,
      }),
      new DatabaseProvider({ 
        table: 'configurations',
        key: serviceName,
        watch: true 
      }),
    ],
    validation: true,
    watch: true,
    cache: true,
    ...options
  })
}

// Export default configuration manager instance
export const config = getConfigManager()