/**
 * Database Configuration Provider
 * 
 * Loads and saves configuration from/to database
 */

import { BaseConfigProvider } from './base'

export interface DatabaseProviderOptions {
  table?: string
  key?: string
  watch?: boolean
  pollInterval?: number
}

/**
 * Database configuration provider
 */
export class DatabaseProvider extends BaseConfigProvider {
  name = 'database'
  priority = 20 // Medium priority
  
  private options: DatabaseProviderOptions
  private pollTimer?: NodeJS.Timeout
  private lastChecksum?: string
  
  constructor(options: DatabaseProviderOptions = {}) {
    super()
    this.options = {
      table: 'configurations',
      key: 'main',
      watch: false,
      pollInterval: 30000, // 30 seconds
      ...options
    }
  }
  
  /**
   * Load configuration from database
   */
  async load(): Promise<Record<string, any>> {
    try {
      // Dynamic import to avoid circular dependencies
      const { PrismaClient } = await import('@awe/database')
      const prisma = new PrismaClient()
      
      // Check if configurations table exists
      const tableExists = await this.checkTableExists(prisma)
      if (!tableExists) {
        await prisma.$disconnect()
        return {}
      }
      
      // Fetch configuration
      const config = await (prisma as any).configuration.findUnique({
        where: { key: this.options.key }
      })
      
      await prisma.$disconnect()
      
      if (!config) {
        return {}
      }
      
      // Parse JSON configuration
      const parsedConfig = typeof config.value === 'string' 
        ? JSON.parse(config.value) 
        : config.value
      
      // Store checksum for change detection
      this.lastChecksum = config.checksum
      
      this.config = parsedConfig
      return parsedConfig
      
    } catch (error) {
      console.warn('Failed to load configuration from database:', error)
      return {}
    }
  }
  
  /**
   * Save configuration to database
   */
  async save(config: Record<string, any>): Promise<void> {
    try {
      const { PrismaClient } = await import('@awe/database')
      const prisma = new PrismaClient()
      
      // Ensure table exists
      await this.ensureTable(prisma)
      
      // Calculate checksum
      const configString = JSON.stringify(config)
      const checksum = this.calculateChecksum(configString)
      
      // Upsert configuration
      await (prisma as any).configuration.upsert({
        where: { key: this.options.key },
        create: {
          key: this.options.key,
          value: configString,
          checksum,
          metadata: {
            updatedAt: new Date().toISOString(),
            source: 'config-manager'
          }
        },
        update: {
          value: configString,
          checksum,
          metadata: {
            updatedAt: new Date().toISOString(),
            source: 'config-manager'
          }
        }
      })
      
      this.lastChecksum = checksum
      await prisma.$disconnect()
      
    } catch (error) {
      console.error('Failed to save configuration to database:', error)
      throw error
    }
  }
  
  /**
   * Watch for configuration changes
   */
  watch(callback: (config: Record<string, any>) => void): void {
    if (this.watching) return
    
    this.watching = true
    
    // Set up polling
    this.pollTimer = setInterval(async () => {
      try {
        const { PrismaClient } = await import('@awe/database')
        const prisma = new PrismaClient()
        
        // Check for changes
        const config = await (prisma as any).configuration.findUnique({
          where: { key: this.options.key },
          select: { checksum: true }
        })
        
        await prisma.$disconnect()
        
        if (config && config.checksum !== this.lastChecksum) {
          // Configuration has changed
          const newConfig = await this.load()
          callback(newConfig)
        }
      } catch (error) {
        console.warn('Failed to poll database for changes:', error)
      }
    }, this.options.pollInterval)
  }
  
  /**
   * Stop watching for changes
   */
  unwatch(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = undefined
    }
    this.watching = false
  }
  
  /**
   * Check if configurations table exists
   */
  private async checkTableExists(prisma: any): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 FROM configurations LIMIT 1`
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Ensure configurations table exists
   */
  private async ensureTable(prisma: any): Promise<void> {
    try {
      // Create table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS configurations (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          checksum VARCHAR(64),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    } catch (error) {
      console.warn('Failed to create configurations table:', error)
    }
  }
  
  /**
   * Calculate checksum for configuration
   */
  private calculateChecksum(data: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}