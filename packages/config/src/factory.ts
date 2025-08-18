/**
 * Factory functions for creating configuration instances
 */

import { ConfigManager, type ConfigManagerOptions } from './manager'
import { EnvProvider } from './providers/env'
import { FileProvider } from './providers/file'
import type { IConfigProvider } from './providers/base'

/**
 * Create a configuration manager for web applications
 */
export function createWebConfig(options?: Partial<ConfigManagerOptions>) {
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    watch: false,
    cache: true,
    providers: [
      new EnvProvider({ prefix: 'NEXT_PUBLIC_' }),
      new EnvProvider({ prefix: '' })
    ],
    ...options
  })

  return manager
}

/**
 * Create a configuration manager for CLI applications
 */
export function createCliConfig(options?: Partial<ConfigManagerOptions>) {
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  const providers: IConfigProvider[] = [
    new EnvProvider({ prefix: '' })
  ]
  
  if (homeDir) {
    providers.push(new FileProvider({
      paths: [`${homeDir}/.awe/config.json`],
      watch: true
    }))
  }
  
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    watch: true,
    cache: true,
    providers,
    ...options
  })

  return manager
}

/**
 * Create a configuration manager for API/backend services
 */
export function createApiConfig(options?: Partial<ConfigManagerOptions>) {
  const manager = new ConfigManager({
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'production',
    watch: false,
    cache: true,
    providers: [
      new EnvProvider({ 
        prefix: ''
      })
    ],
    ...options
  })

  return manager
}