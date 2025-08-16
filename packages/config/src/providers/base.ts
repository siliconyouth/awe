/**
 * Base Configuration Provider
 * 
 * Abstract base class for configuration providers
 */

import { z } from 'zod'
import EventEmitter from 'events'

/**
 * Configuration provider interface
 */
export interface IConfigProvider {
  name: string
  priority: number
  load(): Promise<Record<string, any>>
  save?(config: Record<string, any>): Promise<void>
  watch?(callback: (config: Record<string, any>) => void): void
  unwatch?(): void
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  provider: string
  path: string
  oldValue: any
  newValue: any
  timestamp: Date
}

/**
 * Abstract base configuration provider
 */
export abstract class BaseConfigProvider extends EventEmitter implements IConfigProvider {
  abstract name: string
  abstract priority: number
  
  protected config: Record<string, any> = {}
  protected watching: boolean = false

  /**
   * Load configuration from provider
   */
  abstract load(): Promise<Record<string, any>>

  /**
   * Save configuration to provider (optional)
   */
  async save?(config: Record<string, any>): Promise<void>

  /**
   * Watch for configuration changes (optional)
   */
  watch?(callback: (config: Record<string, any>) => void): void

  /**
   * Stop watching for changes
   */
  unwatch?(): void {
    this.watching = false
  }

  /**
   * Get a configuration value by path
   */
  protected getByPath(path: string): any {
    const keys = path.split('.')
    let value = this.config
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }
    
    return value
  }

  /**
   * Set a configuration value by path
   */
  protected setByPath(path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()
    
    if (!lastKey) return
    
    let obj = this.config
    
    for (const key of keys) {
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {}
      }
      obj = obj[key]
    }
    
    const oldValue = obj[lastKey]
    obj[lastKey] = value
    
    // Emit change event
    this.emit('change', {
      provider: this.name,
      path,
      oldValue,
      newValue: value,
      timestamp: new Date()
    } as ConfigChangeEvent)
  }

  /**
   * Merge configurations deeply
   */
  protected deepMerge(target: any, source: any): any {
    if (!source) return target
    if (!target) return source
    
    const output = { ...target }
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = this.deepMerge(target[key], source[key])
        } else {
          output[key] = source[key]
        }
      }
    }
    
    return output
  }

  /**
   * Validate configuration against schema
   */
  protected validate<T>(config: any, schema: z.ZodSchema<T>): T {
    return schema.parse(config)
  }

  /**
   * Safely parse configuration with defaults
   */
  protected safeParse<T>(config: any, schema: z.ZodSchema<T>): T | null {
    const result = schema.safeParse(config)
    return result.success ? result.data : null
  }
}