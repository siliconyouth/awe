import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limit configurations
export const rateLimiters = {
  // AI API calls - 100 requests per minute per user
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'awe:ratelimit:ai',
    analytics: true,
  }),

  // Resource operations - 500 requests per minute per user
  resources: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1 m'),
    prefix: 'awe:ratelimit:resources',
    analytics: true,
  }),

  // Import operations - 10 requests per hour per user
  import: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'awe:ratelimit:import',
    analytics: true,
  }),

  // Pattern extraction - 50 requests per hour per user
  patterns: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    prefix: 'awe:ratelimit:patterns',
    analytics: true,
  }),

  // General API - 1000 requests per minute per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'awe:ratelimit:api',
    analytics: true,
  }),

  // Auth attempts - 5 attempts per 15 minutes per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'awe:ratelimit:auth',
    analytics: true,
  }),
}

// Rate limiter helper class
export class RateLimiter {
  private static instance: RateLimiter

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * Check rate limit for a specific operation
   */
  async checkLimit(params: {
    type: keyof typeof rateLimiters
    identifier: string // userId, IP, or other identifier
  }): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const limiter = rateLimiters[params.type]
    if (!limiter) {
      throw new Error(`Unknown rate limiter type: ${params.type}`)
    }

    const result = await limiter.limit(params.identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  /**
   * Check multiple rate limits at once
   */
  async checkMultipleLimits(
    checks: Array<{
      type: keyof typeof rateLimiters
      identifier: string
    }>
  ): Promise<
    Array<{
      type: string
      success: boolean
      limit: number
      remaining: number
      reset: number
    }>
  > {
    const results = await Promise.all(
      checks.map(async (check) => {
        const result = await this.checkLimit(check)
        return {
          type: check.type,
          ...result,
        }
      })
    )

    return results
  }

  /**
   * Get rate limit analytics
   */
  async getAnalytics(params: {
    type: keyof typeof rateLimiters
    duration?: number // in seconds, default 3600 (1 hour)
  }): Promise<{
    requests: number
    blocked: number
    successRate: number
  }> {
    // Analytics requires Upstash Pro plan
    // For now, return mock data
    console.warn('Analytics requires Upstash Pro plan')
    return {
      requests: 0,
      blocked: 0,
      successRate: 100,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(params: {
    type: keyof typeof rateLimiters
    identifier: string
  }): Promise<void> {
    const key = `awe:ratelimit:${params.type}:${params.identifier}`
    await redis.del(key)
  }

  /**
   * Get current usage for an identifier
   */
  async getUsage(params: {
    type: keyof typeof rateLimiters
    identifier: string
  }): Promise<{
    used: number
    limit: number
    percentage: number
  }> {
    const limiter = rateLimiters[params.type]
    if (!limiter) {
      throw new Error(`Unknown rate limiter type: ${params.type}`)
    }

    const result = await limiter.limit(params.identifier)
    
    // Get the limit from the configuration
    const limit = result.limit
    const used = limit - result.remaining
    const percentage = (used / limit) * 100

    return {
      used,
      limit,
      percentage,
    }
  }

  /**
   * Create custom rate limiter
   */
  createCustomLimiter(params: {
    requests: number
    window: '1 m' | '15 m' | '1 h' | '24 h' | '1 d' // Upstash Duration type
    prefix: string
  }): Ratelimit {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(params.requests, params.window),
      prefix: `awe:ratelimit:custom:${params.prefix}`,
      analytics: true,
    })
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance()

// Export middleware for Next.js API routes
export async function withRateLimit(
  req: Request,
  type: keyof typeof rateLimiters = 'api'
): Promise<Response | null> {
  // Get identifier (user ID from auth or IP address)
  const identifier = req.headers.get('x-user-id') || 
                    req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') ||
                    'anonymous'

  const { success, limit, remaining, reset } = await rateLimiter.checkLimit({
    type,
    identifier,
  })

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Add rate limit headers to the response
  return null // Continue with the request
}