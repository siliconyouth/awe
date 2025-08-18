/**
 * Factory functions for creating configuration instances
 */

import { ConfigManager, type ConfigManagerOptions } from './manager'
import { EnvProvider } from './providers/env'
import { FileProvider } from './providers/file'

/**
 * Create a configuration manager for web applications
 */
export function createWebConfig(options?: Partial<ConfigManagerOptions>) {
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    autoSave: false,
    watchChanges: false,
    ...options
  })

  // Add environment provider
  manager.addProvider(new EnvProvider({ prefix: 'NEXT_PUBLIC_' }))
  manager.addProvider(new EnvProvider({ prefix: '' }))

  return manager
}

/**
 * Create a configuration manager for CLI applications
 */
export function createCliConfig(options?: Partial<ConfigManagerOptions>) {
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    autoSave: true,
    watchChanges: true,
    ...options
  })

  // Add providers
  manager.addProvider(new EnvProvider({ prefix: '' }))
  
  // Add file provider for user config
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  if (homeDir) {
    manager.addProvider(new FileProvider({
      filePath: `${homeDir}/.awe/config.json`,
      createIfNotExists: true
    }))
  }

  return manager
}

/**
 * Create a configuration manager for API/backend services
 */
export function createApiConfig(options?: Partial<ConfigManagerOptions>) {
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'production',
    autoSave: false,
    watchChanges: false,
    ...options
  })

  // Add environment provider
  manager.addProvider(new EnvProvider({ 
    prefix: '',
    required: [
      'DATABASE_URL',
      'CLERK_SECRET_KEY'
    ]
  }))

  return manager
}