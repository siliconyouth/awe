import { rateLimiter, rateLimiters } from '@awe/ai'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export type RateLimitType = keyof typeof rateLimiters

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  try {
    // Get user ID from Clerk auth
    const { userId } = await auth()
    
    // Get identifier (user ID or IP address)
    const identifier = userId || 
                      request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') ||
                      request.ip ||
                      'anonymous'

    const { success, limit, remaining, reset } = await rateLimiter.checkLimit({
      type,
      identifier,
    })

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again later.`,
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Return null to continue with the request
    // The calling function should add rate limit headers to the successful response
    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On error, allow the request to continue
    return null
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())
  return response
}

/**
 * Helper to get rate limit info for current request
 */
export async function getRateLimitInfo(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{
  limit: number
  remaining: number
  reset: number
}> {
  try {
    const { userId } = await auth()
    const identifier = userId || 
                      request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') ||
                      request.ip ||
                      'anonymous'

    const usage = await rateLimiter.getUsage({
      type,
      identifier,
    })

    return {
      limit: usage.limit,
      remaining: usage.limit - usage.used,
      reset: Date.now() + 60000, // Default to 1 minute
    }
  } catch (error) {
    console.error('Get rate limit info error:', error)
    return {
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    }
  }
}