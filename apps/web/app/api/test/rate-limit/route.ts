import { NextRequest, NextResponse } from 'next/server'
import { 
  rateLimit, 
  getRateLimitStatus, 
  rateLimitConfigs,
  getAllRateLimits
} from '../../../../lib/auth/rate-limit'
import { auth } from '@clerk/nextjs/server'

/**
 * Test endpoint for rate limiting
 * GET /api/test/rate-limit - Test rate limiting
 * GET /api/test/rate-limit?status=true - Get rate limit status
 * GET /api/test/rate-limit?admin=true - Get all rate limits (admin only)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const showStatus = searchParams.get('status') === 'true'
  const showAdmin = searchParams.get('admin') === 'true'
  
  // Admin view - show all rate limits
  if (showAdmin) {
    const { sessionClaims } = await auth()
    const userRole = (sessionClaims?.metadata as any)?.role
    
    if (userRole !== 'admin') {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 403 })
    }
    
    const allLimits = getAllRateLimits()
    return NextResponse.json({
      '🔒 Active Rate Limits': allLimits.length,
      '📊 Details': allLimits.map(limit => ({
        client: limit.clientId,
        requests: limit.count,
        resetsAt: limit.resetTime.toISOString(),
        remainingTime: `${Math.ceil((limit.resetTime.getTime() - Date.now()) / 1000)}s`,
      })),
    })
  }
  
  // Status view - show current client's rate limit status
  if (showStatus) {
    const status = await getRateLimitStatus(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
    })
    
    return NextResponse.json({
      '📊 Rate Limit Status': {
        limit: status.limit,
        remaining: status.remaining,
        resetsAt: status.resetTime.toISOString(),
        isLimited: status.isLimited,
        percentUsed: `${Math.round(((status.limit - status.remaining) / status.limit) * 100)}%`,
      },
      '💡 Info': status.isLimited 
        ? `Rate limit exceeded. Wait ${Math.ceil((status.resetTime.getTime() - Date.now()) / 1000)} seconds`
        : `You have ${status.remaining} requests remaining`,
    })
  }
  
  // Apply rate limiting - 5 requests per minute for testing
  const rateLimitResponse = await rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Test rate limit exceeded. This endpoint allows 5 requests per minute.',
  })
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  // Get current status after the request
  const status = await getRateLimitStatus(request, {
    windowMs: 60 * 1000,
    maxRequests: 5,
  })
  
  // Normal response
  return NextResponse.json({
    '✅ Request Successful': {
      timestamp: new Date().toISOString(),
      message: 'This request was not rate limited',
    },
    '📊 Current Usage': {
      requestsUsed: status.limit - status.remaining,
      requestsRemaining: status.remaining,
      totalLimit: status.limit,
      resetsAt: status.resetTime.toISOString(),
    },
    '🧪 Test Different Scenarios': {
      'Test rate limiting': 'Keep refreshing this endpoint',
      'Check status': '/api/test/rate-limit?status=true',
      'Admin view': '/api/test/rate-limit?admin=true (requires admin role)',
    },
    '📖 Available Configurations': {
      auth: '5 requests per 15 minutes (strict)',
      api: '30 requests per minute (standard)',
      read: '100 requests per minute (relaxed)',
      write: '10 requests per minute (restricted)',
      expensive: '3 requests per 5 minutes (very strict)',
    },
  }, {
    status: 200,
    headers: {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.resetTime.toISOString(),
    },
  })
}

/**
 * POST endpoint with different rate limiting
 */
export async function POST(request: NextRequest) {
  // Apply stricter rate limiting for POST requests
  const rateLimitResponse = await rateLimit(request, rateLimitConfigs.write)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  return NextResponse.json({
    success: true,
    message: 'POST request successful (write rate limit applied)',
    config: 'write: 10 requests per minute',
  })
}