import { NextRequest, NextResponse } from 'next/server'
import { cache } from './upstash'
import crypto from 'crypto'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  keyPrefix?: string // Prefix for cache keys
  includeAuth?: boolean // Include user ID in cache key
  revalidateOnMutation?: string[] // Array of mutation endpoints that invalidate this cache
}

/**
 * Generate a cache key from request
 */
function generateCacheKey(
  request: NextRequest,
  options: CacheOptions,
  userId?: string
): string {
  const url = new URL(request.url)
  const parts = [
    options.keyPrefix || 'api',
    url.pathname.replace(/\//g, '_'),
    url.search ? crypto.createHash('md5').update(url.search).digest('hex') : 'no-params'
  ]
  
  if (options.includeAuth && userId) {
    parts.push(userId)
  }
  
  return parts.join(':')
}

/**
 * Cache middleware for API routes
 * Wraps API handlers with automatic caching
 */
export function withCache<T = any>(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return handler(request)
    }
    
    // Check if cache is available
    if (!cache) {
      return handler(request)
    }
    
    try {
      // Extract user ID if needed
      let userId: string | undefined
      if (options.includeAuth) {
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          // Extract user ID from token or session
          // This is simplified - you'd decode the actual token
          userId = authHeader.split(' ')[1]?.substring(0, 20)
        }
      }
      
      // Generate cache key
      const cacheKey = generateCacheKey(request, options, userId)
      
      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached) {
        // Return cached response
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `private, max-age=${options.ttl || 3600}`
          }
        })
      }
      
      // Execute handler if not cached
      const response = await handler(request)
      
      // Only cache successful responses
      if (response.status === 200) {
        // Parse response body
        const body = await response.json()
        
        // Store in cache
        await cache.set(cacheKey, body, options.ttl || 3600)
        
        // Return response with cache headers
        return NextResponse.json(body, {
          headers: {
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `private, max-age=${options.ttl || 3600}`
          }
        })
      }
      
      return response
    } catch (error) {
      console.error('Cache middleware error:', error)
      // Fall back to handler on error
      return handler(request)
    }
  }
}

/**
 * Invalidate cache entries matching a pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!cache) return
  
  try {
    // In production, you'd use Redis SCAN to find matching keys
    // For now, we'll just delete specific keys
    await cache.delete(pattern)
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

/**
 * Invalidate all cache entries for a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!cache) return
  
  try {
    // Pattern would be something like *:userId
    // This is simplified - in production you'd scan for matching keys
    const patterns = [
      `api:*:${userId}`,
      `resources:*:${userId}`,
      `patterns:*:${userId}`
    ]
    
    for (const pattern of patterns) {
      await cache.delete(pattern)
    }
  } catch (error) {
    console.error('User cache invalidation error:', error)
  }
}

/**
 * Decorator for caching class methods
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      if (!cache) {
        return originalMethod.apply(this, args)
      }
      
      // Generate cache key from method name and arguments
      const cacheKey = `${options.keyPrefix || 'method'}:${propertyKey}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      // Execute method
      const result = await originalMethod.apply(this, args)
      
      // Store in cache
      await cache.set(cacheKey, result, options.ttl || 3600)
      
      return result
    }
    
    return descriptor
  }
}