import { Redis } from '@upstash/redis'
import { Index } from '@upstash/vector'
import { createHash } from 'crypto'
import { z } from 'zod'

// Cache configuration
const CACHE_TTL = 3600 // 1 hour default TTL

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Initialize Upstash Vector with built-in embeddings
const vectorIndex = process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
  ? new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })
  : null

// Cache key schemas
const CacheKeySchema = z.object({
  type: z.enum(['analysis', 'recommendation', 'pattern', 'resource', 'embedding']),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  hash: z.string(),
})

const CachedDataSchema = z.object({
  data: z.any(),
  timestamp: z.number(),
  ttl: z.number(),
  metadata: z.record(z.any()).optional(),
})

export class AICache {
  private static instance: AICache
  private readonly prefix = 'awe:ai:'

  private constructor() {}

  static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache()
    }
    return AICache.instance
  }

  /**
   * Generate cache key for AI operations
   */
  private generateKey(params: {
    type: string
    content: string
    projectId?: string
    userId?: string
  }): string {
    const hash = createHash('sha256')
      .update(params.content)
      .digest('hex')
      .substring(0, 16)

    const parts = [this.prefix, params.type]
    if (params.projectId) parts.push(params.projectId)
    if (params.userId) parts.push(params.userId)
    parts.push(hash)

    return parts.join(':')
  }

  /**
   * Get cached AI response
   */
  async get<T = any>(params: {
    type: string
    content: string
    projectId?: string
    userId?: string
  }): Promise<T | null> {
    try {
      const key = this.generateKey(params)
      const cached = await redis.get(key)

      if (!cached) return null

      const parsed = CachedDataSchema.parse(cached)
      
      // Check if cache is still valid
      const now = Date.now()
      if (now - parsed.timestamp > parsed.ttl * 1000) {
        await redis.del(key)
        return null
      }

      return parsed.data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set cached AI response
   */
  async set(params: {
    type: string
    content: string
    data: any
    projectId?: string
    userId?: string
    ttl?: number
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      const key = this.generateKey(params)
      const cacheData = {
        data: params.data,
        timestamp: Date.now(),
        ttl: params.ttl || CACHE_TTL,
        metadata: params.metadata,
      }

      await redis.setex(key, params.ttl || CACHE_TTL, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(params: {
    type?: string
    projectId?: string
    userId?: string
  }): Promise<void> {
    try {
      const pattern = [this.prefix]
      if (params.type) pattern.push(params.type)
      if (params.projectId) pattern.push(params.projectId)
      if (params.userId) pattern.push(params.userId)
      pattern.push('*')

      // Note: Upstash Redis doesn't support SCAN, so we need to track keys
      // In production, consider using a separate key tracking mechanism
      const keys = await this.getKeys(pattern.join(':'))
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }

  /**
   * Get keys matching pattern (simplified for Upstash)
   */
  private async getKeys(pattern: string): Promise<string[]> {
    // Upstash doesn't support SCAN, so we maintain a set of keys
    const setKey = `${this.prefix}keys`
    const members = await redis.smembers(setKey)
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return (members as string[]).filter(key => regex.test(key))
  }

  /**
   * Store text with automatic embedding for semantic search
   */
  async storeWithEmbedding(params: {
    id: string
    text: string
    metadata: Record<string, any>
    namespace?: string
  }): Promise<void> {
    if (!vectorIndex) {
      console.warn('Vector index not configured')
      return
    }

    try {
      // Upstash Vector handles embedding automatically
      await vectorIndex.upsert({
        id: params.id,
        data: params.text, // Upstash will embed this text automatically
        metadata: params.metadata,
      } as any)
    } catch (error) {
      console.error('Vector store error:', error)
    }
  }

  /**
   * Store raw vector embedding for semantic search
   */
  async storeVector(params: {
    id: string
    vector: number[]
    metadata: Record<string, any>
    namespace?: string
  }): Promise<void> {
    if (!vectorIndex) {
      console.warn('Vector index not configured')
      return
    }

    try {
      await vectorIndex.upsert({
        id: params.id,
        vector: params.vector,
        metadata: params.metadata,
      } as any)
    } catch (error) {
      console.error('Vector store error:', error)
    }
  }

  /**
   * Search similar content using text query
   */
  async searchSimilarByText(params: {
    query: string
    topK?: number
    filter?: Record<string, any>
    namespace?: string
  }): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>> {
    if (!vectorIndex) {
      console.warn('Vector index not configured')
      return []
    }

    try {
      // Upstash Vector handles embedding of the query automatically
      const results = await vectorIndex.query({
        data: params.query, // Upstash will embed this query automatically
        topK: params.topK || 10,
        filter: params.filter as any,
        includeMetadata: true,
      } as any)

      return results.map((r: any) => ({
        id: String(r.id),
        score: r.score,
        metadata: r.metadata,
      }))
    } catch (error) {
      console.error('Vector search error:', error)
      return []
    }
  }

  /**
   * Search similar vectors using raw vector
   */
  async searchSimilarByVector(params: {
    vector: number[]
    topK?: number
    filter?: Record<string, any>
    namespace?: string
  }): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>> {
    if (!vectorIndex) {
      console.warn('Vector index not configured')
      return []
    }

    try {
      const results = await vectorIndex.query({
        vector: params.vector,
        topK: params.topK || 10,
        filter: params.filter as any,
        includeMetadata: true,
      } as any)

      return results.map((r: any) => ({
        id: String(r.id),
        score: r.score,
        metadata: r.metadata,
      }))
    } catch (error) {
      console.error('Vector search error:', error)
      return []
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    size: number
    hits: number
    misses: number
    hitRate: number
  }> {
    try {
      const stats = await redis.hgetall(`${this.prefix}stats`)
      const hits = parseInt(stats?.hits as string || '0')
      const misses = parseInt(stats?.misses as string || '0')
      const total = hits + misses

      return {
        size: await redis.dbsize() || 0,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
      }
    } catch (error) {
      console.error('Stats error:', error)
      return { size: 0, hits: 0, misses: 0, hitRate: 0 }
    }
  }

  /**
   * Track cache hit/miss
   */
  async trackAccess(hit: boolean): Promise<void> {
    try {
      const key = `${this.prefix}stats`
      await redis.hincrby(key, hit ? 'hits' : 'misses', 1)
    } catch (error) {
      console.error('Track access error:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      console.error('Clear cache error:', error)
    }
  }
}

// Export singleton instance
export const aiCache = AICache.getInstance()