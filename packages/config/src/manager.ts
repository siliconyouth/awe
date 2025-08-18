/**
 * Configuration Manager
 * 
 * Central configuration management system with multiple providers,
 * validation, hot-reloading, and type safety
 */

import { z } from 'zod'
import EventEmitter from 'events'
import { BaseConfigProvider, IConfigProvider, ConfigChangeEvent } from './providers/base'
import { EnvProvider } from './providers/env'
import { FileProvider } from './providers/file'
import { DatabaseProvider } from './providers/database'
import * as lodash from 'lodash'
import chalk from 'chalk'
import { DEFAULT_CONFIG } from './defaults'

// Import schemas
import { 
  AppConfigSchema, 
  DatabaseConfigSchema, 
  ApiConfigSchema,
  AuthConfigSchema,
  FeatureFlagsSchema,
  CacheConfigSchema,
  QueueConfigSchema,
  StorageConfigSchema,
  EmailConfigSchema,
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

import { 
  ScraperConfigSchema,
  type ScraperConfig 
} from './schemas/scraper'

import { 
  KnowledgeConfigSchema,
  type KnowledgeConfig 
} from './schemas/knowledge'

/**
 * Complete configuration type
 */
export interface AWEConfig {
  app: AppConfig
  database: DatabaseConfig
  api: ApiConfig
  auth: AuthConfig
  features: FeatureFlags
  cache: CacheConfig
  queue: QueueConfig
  storage: StorageConfig
  email: EmailConfig
  scraper: ScraperConfig
  knowledge: KnowledgeConfig
  custom?: Record<string, any>
}

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  providers?: IConfigProvider[]
  defaults?: Partial<AWEConfig>
  validation?: boolean
  watch?: boolean
  cache?: boolean
  environment?: string
}

/**
 * Configuration manager events
 */
export interface ConfigManagerEvents {
  'change': (event: ConfigChangeEvent) => void
  'reload': (config: AWEConfig) => void
  'error': (error: Error) => void
  'validation': (errors: z.ZodError) => void
}

/**
 * Main configuration manager
 */
export class ConfigManager extends EventEmitter {
  private providers: IConfigProvider[] = []
  private config: AWEConfig
  private configCache: Map<string, any> = new Map()
  private options: ConfigManagerOptions
  private initialized: boolean = false
  private watchers: Set<() => void> = new Set()

  constructor(options: ConfigManagerOptions = {}) {
    super()
    
    this.options = {
      validation: true,
      watch: false,
      cache: true,
      ...options
    }

    // Set up default configuration
    this.config = this.getDefaultConfig(options.defaults)

    // Initialize default providers if none specified
    if (!options.providers || options.providers.length === 0) {
      this.providers = [
        new FileProvider({ watch: options.watch }),
        new EnvProvider({ prefix: 'AWE_' }),
        new DatabaseProvider({ table: 'configurations' }),
      ]
    } else {
      this.providers = options.providers
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<AWEConfig> {
    if (this.initialized) {
      return this.config
    }

    try {
      // Load configuration from all providers
      await this.loadConfiguration()

      // Set up watchers if enabled
      if (this.options.watch) {
        this.setupWatchers()
      }

      this.initialized = true
      this.emit('reload', this.config)

      return this.config
    } catch (error) {
      this.emit('error', error as Error)
      throw error
    }
  }

  /**
   * Get configuration value by path
   */
  get<T = any>(path?: string, defaultValue?: T): T {
    if (!path) {
      return this.config as unknown as T
    }

    // Check cache first
    if (this.options.cache && this.configCache.has(path)) {
      return this.configCache.get(path)
    }

    const value = lodash.get(this.config, path, defaultValue) as T

    // Cache the result
    if (this.options.cache) {
      this.configCache.set(path, value)
    }

    return value
  }

  /**
   * Set configuration value by path
   */
  async set(path: string, value: any): Promise<void> {
    const oldValue = this.get(path)
    
    // Update configuration
    lodash.set(this.config, path, value)

    // Clear cache
    if (this.options.cache) {
      this.clearCache(path)
    }

    // Validate if enabled
    if (this.options.validation) {
      await this.validateConfiguration()
    }

    // Save to writable providers
    await this.saveConfiguration()

    // Emit change event
    this.emit('change', {
      provider: 'manual',
      path,
      oldValue,
      newValue: value,
      timestamp: new Date()
    } as ConfigChangeEvent)
  }

  /**
   * Reload configuration from all providers
   */
  async reload(): Promise<AWEConfig> {
    await this.loadConfiguration()
    this.emit('reload', this.config)
    return this.config
  }

  /**
   * Validate configuration against schemas
   */
  async validateConfiguration(): Promise<boolean> {
    if (!this.options.validation) {
      return true
    }

    try {
      // Validate each section
      const validations = [
        { schema: AppConfigSchema, data: this.config.app, name: 'app' },
        { schema: DatabaseConfigSchema, data: this.config.database, name: 'database' },
        { schema: ApiConfigSchema, data: this.config.api, name: 'api' },
        { schema: AuthConfigSchema, data: this.config.auth, name: 'auth' },
        { schema: FeatureFlagsSchema, data: this.config.features, name: 'features' },
        { schema: CacheConfigSchema, data: this.config.cache, name: 'cache' },
        { schema: QueueConfigSchema, data: this.config.queue, name: 'queue' },
        { schema: StorageConfigSchema, data: this.config.storage, name: 'storage' },
        { schema: EmailConfigSchema, data: this.config.email, name: 'email' },
        { schema: ScraperConfigSchema, data: this.config.scraper, name: 'scraper' },
        { schema: KnowledgeConfigSchema, data: this.config.knowledge, name: 'knowledge' },
      ]

      for (const { schema, data, name } of validations) {
        try {
          schema.parse(data)
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(chalk.red(`Validation error in ${name} configuration:`))
            console.error(error.errors)
            this.emit('validation', error)
            return false
          }
        }
      }

      return true
    } catch (error) {
      this.emit('error', error as Error)
      return false
    }
  }

  /**
   * Get specific configuration sections
   */
  getApp(): AppConfig { return this.get('app') }
  getDatabase(): DatabaseConfig { return this.get('database') }
  getApi(): ApiConfig { return this.get('api') }
  getAuth(): AuthConfig { return this.get('auth') }
  getFeatures(): FeatureFlags { return this.get('features') }
  getCache(): CacheConfig { return this.get('cache') }
  getQueue(): QueueConfig { return this.get('queue') }
  getStorage(): StorageConfig { return this.get('storage') }
  getEmail(): EmailConfig { return this.get('email') }
  getScraper(): ScraperConfig { return this.get('scraper') }
  getKnowledge(): KnowledgeConfig { return this.get('knowledge') }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(flag: string): boolean {
    return this.get(`features.flags.${flag}`, false)
  }

  /**
   * Get environment
   */
  getEnvironment(): string {
    return this.get('app.environment', 'development')
  }

  /**
   * Check if in production
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production'
  }

  /**
   * Check if in development
   */
  isDevelopment(): boolean {
    return this.getEnvironment() === 'development'
  }

  /**
   * Export configuration
   */
  export(format: 'json' | 'yaml' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.config, null, 2)
    } else {
      const yaml = require('js-yaml')
      return yaml.dump(this.config)
    }
  }

  /**
   * Import configuration
   */
  async import(data: string | Record<string, any>, format?: 'json' | 'yaml'): Promise<void> {
    let config: any

    if (typeof data === 'string') {
      if (format === 'yaml' || data.trim().startsWith('---')) {
        const yaml = require('js-yaml')
        config = yaml.load(data)
      } else {
        config = JSON.parse(data)
      }
    } else {
      config = data
    }

    // Merge with existing configuration
    this.config = lodash.merge({}, this.config, config)

    // Validate
    await this.validateConfiguration()

    // Save
    await this.saveConfiguration()

    // Clear cache
    this.configCache.clear()

    this.emit('reload', this.config)
  }

  /**
   * Load configuration from all providers
   */
  private async loadConfiguration(): Promise<void> {
    let mergedConfig = this.getDefaultConfig(this.options.defaults)

    // Load from each provider in order of priority
    for (const provider of this.providers) {
      try {
        const providerConfig = await provider.load()
        mergedConfig = lodash.merge({}, mergedConfig, providerConfig)
      } catch (error) {
        console.warn(`Failed to load config from ${provider.name}:`, error)
      }
    }

    this.config = mergedConfig

    // Clear cache when reloading
    if (this.options.cache) {
      this.configCache.clear()
    }

    // Validate configuration
    if (this.options.validation) {
      await this.validateConfiguration()
    }
  }

  /**
   * Save configuration to writable providers
   */
  private async saveConfiguration(): Promise<void> {
    for (const provider of this.providers) {
      if (provider.save) {
        try {
          await provider.save(this.config)
        } catch (error) {
          console.warn(`Failed to save config to ${provider.name}:`, error)
        }
      }
    }
  }

  /**
   * Set up configuration watchers
   */
  private setupWatchers(): void {
    for (const provider of this.providers) {
      if (provider.watch) {
        const watcher = () => {
          this.reload().catch(error => {
            this.emit('error', error)
          })
        }

        provider.watch(watcher)
        this.watchers.add(watcher)
      }
    }
  }

  /**
   * Clear configuration cache
   */
  private clearCache(path?: string): void {
    if (!this.options.cache) return

    if (path) {
      // Clear specific path and its children
      const keys = Array.from(this.configCache.keys())
      for (const key of keys) {
        if (key.startsWith(path)) {
          this.configCache.delete(key)
        }
      }
    } else {
      // Clear entire cache
      this.configCache.clear()
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(overrides?: Partial<AWEConfig>): AWEConfig {
    const defaults = { ...DEFAULT_CONFIG }
    return overrides ? lodash.merge({}, defaults, overrides) : defaults
  }

  /**
   * Destroy the configuration manager
   */
  destroy(): void {
    // Stop all watchers
    for (const provider of this.providers) {
      if (provider.unwatch) {
        provider.unwatch()
      }
    }

    // Clear cache
    this.configCache.clear()

    // Remove all listeners
    this.removeAllListeners()

    this.initialized = false
  }
}

// Export singleton instance
let configManager: ConfigManager | null = null

export function getConfigManager(options?: ConfigManagerOptions): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager(options)
  }
  return configManager
}

export function resetConfigManager(): void {
  if (configManager) {
    configManager.destroy()
    configManager = null
  }
}