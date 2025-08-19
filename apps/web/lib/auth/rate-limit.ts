/**
 * Rate Limiting for API Routes
 * 
 * Provides rate limiting functionality to prevent abuse.
 * Uses in-memory storage by default, can be upgraded to Redis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  message?: string      // Custom error message
  skipAuth?: boolean    // Skip for authenticated users
  skipRoles?: string[]  // Skip for specific roles
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Default rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Strict limits for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
  },
  
  // Standard API limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many requests. Please slow down.',
    skipAuth: true, // Higher limits for authenticated users
  },
  
  // Relaxed limits for read operations
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipRoles: ['admin', 'moderator'],
  },
  
  // Strict limits for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Rate limit exceeded for write operations.',
  },
  
  // Very strict for expensive operations
  expensive: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    message: 'This operation is rate limited. Please wait before trying again.',
  },
} as const

/**
 * Get client identifier for rate limiting
 */
async function getClientId(request: NextRequest): Promise<string> {
  // Try to get authenticated user ID first
  try {
    const { userId } = await auth()
    if (userId) {
      return `user:${userId}`
    }
  } catch {
    // Not authenticated
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `ip:${ip}`
}

/**
 * Check if user should skip rate limiting
 */
async function shouldSkipRateLimit(
  config: RateLimitConfig,
  request: NextRequest
): Promise<boolean> {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return false
    }
    
    // Skip for authenticated users if configured
    if (config.skipAuth) {
      return true
    }
    
    // Skip for specific roles
    if (config.skipRoles && config.skipRoles.length > 0) {
      const userRole = (sessionClaims?.metadata as any)?.role
      if (userRole && config.skipRoles.includes(userRole)) {
        return true
      }
    }
  } catch {
    // Error checking auth, don't skip
  }
  
  return false
}

/**
 * Rate limit middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): Promise<NextResponse | null> {
  // Check if should skip rate limiting
  if (await shouldSkipRateLimit(config, request)) {
    return null
  }
  
  const clientId = await getClientId(request)
  const now = Date.now()
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientId)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(clientId, entry)
    return null
  }
  
  // Increment count
  entry.count++
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter: `${retryAfter} seconds`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        },
      }
    )
  }
  
  // Update store
  rateLimitStore.set(clientId, entry)
  
  // Add rate limit headers to response
  const remaining = config.maxRequests - entry.count
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
  
  return null
}

/**
 * Rate limit decorator for API routes
 * 
 * Usage:
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler code
 * }, rateLimitConfigs.read)
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = rateLimitConfigs.api
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimit(request, config)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    return handler(request)
  }
}

/**
 * Get current rate limit status for a client
 */
export async function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): Promise<{
  limit: number
  remaining: number
  resetTime: Date
  isLimited: boolean
}> {
  const clientId = await getClientId(request)
  const now = Date.now()
  const entry = rateLimitStore.get(clientId)
  
  if (!entry || entry.resetTime < now) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: new Date(now + config.windowMs),
      isLimited: false,
    }
  }
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  
  return {
    limit: config.maxRequests,
    remaining,
    resetTime: new Date(entry.resetTime),
    isLimited: remaining === 0,
  }
}

/**
 * Reset rate limit for a specific client (admin function)
 */
export async function resetRateLimit(clientId: string): Promise<void> {
  rateLimitStore.delete(clientId)
}

/**
 * Get all current rate limits (admin function)
 */
export function getAllRateLimits(): Array<{
  clientId: string
  count: number
  resetTime: Date
}> {
  const now = Date.now()
  const limits: Array<{ clientId: string; count: number; resetTime: Date }> = []
  
  for (const [clientId, entry] of rateLimitStore.entries()) {
    if (entry.resetTime >= now) {
      limits.push({
        clientId,
        count: entry.count,
        resetTime: new Date(entry.resetTime),
      })
    }
  }
  
  return limits
}