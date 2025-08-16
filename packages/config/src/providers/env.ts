/**
 * Environment Variables Configuration Provider
 * 
 * Loads configuration from environment variables
 */

import { BaseConfigProvider } from './base'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

export interface EnvProviderOptions {
  files?: string[]
  prefix?: string
  nested?: boolean
  override?: boolean
}

/**
 * Environment variables configuration provider
 */
export class EnvProvider extends BaseConfigProvider {
  name = 'env'
  priority = 30 // Higher priority than files
  
  private options: EnvProviderOptions
  
  constructor(options: EnvProviderOptions = {}) {
    super()
    this.options = {
      files: ['.env', '.env.local'],
      prefix: '',
      nested: true,
      override: true,
      ...options
    }
  }
  
  /**
   * Load configuration from environment variables
   */
  async load(): Promise<Record<string, any>> {
    // Load .env files
    if (this.options.files) {
      for (const file of this.options.files) {
        const filePath = path.resolve(process.cwd(), file)
        if (fs.existsSync(filePath)) {
          dotenv.config({ 
            path: filePath, 
            override: this.options.override 
          })
        }
      }
    }
    
    const config: Record<string, any> = {}
    const prefix = this.options.prefix || ''
    
    // Process environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (prefix && !key.startsWith(prefix)) {
        continue
      }
      
      const configKey = prefix ? key.slice(prefix.length) : key
      
      if (this.options.nested) {
        this.setNestedValue(config, configKey, this.parseValue(value || ''))
      } else {
        config[configKey] = this.parseValue(value || '')
      }
    }
    
    this.config = config
    return config
  }
  
  /**
   * Set nested value from environment variable key
   */
  private setNestedValue(obj: any, key: string, value: any): void {
    // Convert UPPER_SNAKE_CASE to nested object
    // e.g., DATABASE_HOST -> database.host
    const parts = key.toLowerCase().split('_')
    const lastPart = parts.pop()
    
    if (!lastPart) return
    
    let current = obj
    
    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part]
    }
    
    current[lastPart] = value
  }
  
  /**
   * Parse environment variable value
   */
  private parseValue(value: string): any {
    // Try to parse as JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value)
      } catch {
        // Not valid JSON, continue
      }
    }
    
    // Parse booleans
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    
    // Parse numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10)
    }
    
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }
    
    // Parse comma-separated arrays
    if (value.includes(',') && !value.includes(' ')) {
      return value.split(',').map(v => v.trim())
    }
    
    // Return as string
    return value
  }
}