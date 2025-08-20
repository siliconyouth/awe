import { get, getAll, has } from '@vercel/edge-config'

/**
 * Edge Config Service
 * Provides ultra-fast access to configuration at the edge
 */

export interface EdgeConfigData {
  // Feature flags
  features: {
    enableAI: boolean
    enableSearch: boolean
    enableAnalytics: boolean
    enableWebSocket: boolean
    maintenanceMode: boolean
    betaFeatures: string[]
  }
  
  // Rate limiting configuration
  rateLimits: {
    anonymous: number
    authenticated: number
    pro: number
    admin: number
  }
  
  // System configuration
  system: {
    maxUploadSize: number
    allowedFileTypes: string[]
    apiVersion: string
    minimumClientVersion: string
  }
  
  // Dynamic content
  announcements: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error'
    dismissible: boolean
    expiresAt?: string
  }>
  
  // A/B testing configuration
  experiments: Array<{
    id: string
    name: string
    enabled: boolean
    percentage: number
    variants: string[]
  }>
}

class EdgeConfigService {
  private cache: Map<string, { value: any; expires: number }> = new Map()
  private readonly cacheTTL = 60000 // 1 minute local cache
  
  /**
   * Get a specific configuration value
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    // Check local cache first
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.value as T
    }
    
    try {
      const value = await get(key)
      
      // Cache the result
      if (value !== undefined) {
        this.cache.set(key, {
          value,
          expires: Date.now() + this.cacheTTL
        })
      }
      
      return value as T
    } catch (error) {
      console.error('Edge Config error:', error)
      return undefined
    }
  }
  
  /**
   * Get all configuration values
   */
  async getAll(): Promise<EdgeConfigData | undefined> {
    const cached = this.cache.get('__all__')
    if (cached && cached.expires > Date.now()) {
      return cached.value as EdgeConfigData
    }
    
    try {
      const allConfig = await getAll()
      
      if (allConfig) {
        this.cache.set('__all__', {
          value: allConfig,
          expires: Date.now() + this.cacheTTL
        })
      }
      
      return allConfig as EdgeConfigData
    } catch (error) {
      console.error('Edge Config error:', error)
      return undefined
    }
  }
  
  /**
   * Check if a configuration key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      return await has(key)
    } catch (error) {
      console.error('Edge Config error:', error)
      return false
    }
  }
  
  /**
   * Get feature flag status
   */
  async isFeatureEnabled(feature: keyof EdgeConfigData['features']): Promise<boolean> {
    const features = await this.get<EdgeConfigData['features']>('features')
    return features?.[feature] ?? false
  }
  
  /**
   * Get rate limit for a user type
   */
  async getRateLimit(userType: keyof EdgeConfigData['rateLimits']): Promise<number> {
    const rateLimits = await this.get<EdgeConfigData['rateLimits']>('rateLimits')
    return rateLimits?.[userType] ?? 10 // Default to 10 requests
  }
  
  /**
   * Get active announcements
   */
  async getAnnouncements(): Promise<EdgeConfigData['announcements']> {
    const announcements = await this.get<EdgeConfigData['announcements']>('announcements')
    
    if (!announcements) return []
    
    // Filter out expired announcements
    const now = new Date().toISOString()
    return announcements.filter(a => !a.expiresAt || a.expiresAt > now)
  }
  
  /**
   * Get experiment configuration
   */
  async getExperiment(experimentId: string) {
    const experiments = await this.get<EdgeConfigData['experiments']>('experiments')
    return experiments?.find(e => e.id === experimentId && e.enabled)
  }
  
  /**
   * Check if user is in experiment variant
   */
  async getUserExperimentVariant(experimentId: string, userId: string): Promise<string | null> {
    const experiment = await this.getExperiment(experimentId)
    
    if (!experiment || !experiment.enabled) return null
    
    // Simple hash-based assignment
    const hash = this.hashCode(userId + experimentId)
    const bucket = Math.abs(hash) % 100
    
    if (bucket < experiment.percentage) {
      const variantIndex = Math.abs(hash) % experiment.variants.length
      return experiment.variants[variantIndex]
    }
    
    return null
  }
  
  /**
   * Simple hash function for consistent assignment
   */
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }
  
  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const edgeConfig = new EdgeConfigService()

// Export types
export type { EdgeConfigService }

// Helper hooks for React components
export function useEdgeConfig() {
  return edgeConfig
}

// Middleware helper
export async function withEdgeConfig<T>(
  handler: (config: EdgeConfigData) => Promise<T>
): Promise<T | null> {
  const config = await edgeConfig.getAll()
  
  if (!config) {
    console.error('Edge Config not available')
    return null
  }
  
  // Check maintenance mode
  if (config.features.maintenanceMode) {
    throw new Error('System is in maintenance mode')
  }
  
  return handler(config)
}