import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiRateLimiter, scraperRateLimiter, aiRateLimiter, authRateLimiter } from './upstash';

/**
 * Rate Limiting Middleware Utilities
 */

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  error?: string;
}

/**
 * Check rate limit for a given identifier
 */
async function checkRateLimit(
  limiter: any,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // No rate limiter configured, allow all requests
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log the issue
    return { 
      success: true, 
      error: 'Rate limit check failed' 
    };
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
): Promise<NextResponse | null> {
  // Get the appropriate limiter
  const limiter = {
    api: apiRateLimiter,
    scraper: scraperRateLimiter,
    ai: aiRateLimiter,
    auth: authRateLimiter,
  }[limiterType];

  if (!limiter) {
    // No limiter configured, continue
    return null;
  }

  // Get identifier (use user ID if authenticated, otherwise IP)
  const { userId } = await auth();
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const identifier = userId || ip;

  // Check rate limit
  const result = await checkRateLimit(limiter, identifier);

  if (!result.success) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit?.toString() || '',
          'X-RateLimit-Remaining': result.remaining?.toString() || '0',
          'X-RateLimit-Reset': result.reset?.toString() || '',
          'Retry-After': result.reset ? 
            Math.ceil((result.reset - Date.now()) / 1000).toString() : '60',
        },
      }
    );
  }

  // Add rate limit headers to successful response
  if (result.limit !== undefined) {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', (result.remaining || 0).toString());
    if (result.reset) {
      headers.set('X-RateLimit-Reset', result.reset.toString());
    }
    
    // Store headers for later use in the route handler
    (request as any).rateLimitHeaders = headers;
  }

  return null;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function rateLimited(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await withRateLimit(request, limiterType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute the handler
    const response = await handler(request);

    // Add rate limit headers if available
    const rateLimitHeaders = (request as any).rateLimitHeaders;
    if (rateLimitHeaders) {
      rateLimitHeaders.forEach((value: string, key: string) => {
        response.headers.set(key, value);
      });
    }

    return response;
  };
}

/**
 * Check if IP is rate limited (for non-authenticated requests)
 */
export async function isIPRateLimited(
  ip: string,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
): Promise<boolean> {
  const limiter = {
    api: apiRateLimiter,
    scraper: scraperRateLimiter,
    ai: aiRateLimiter,
    auth: authRateLimiter,
  }[limiterType];

  if (!limiter) {
    return false;
  }

  const result = await checkRateLimit(limiter, ip);
  return !result.success;
}

/**
 * Check if user is rate limited
 */
export async function isUserRateLimited(
  userId: string,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
): Promise<boolean> {
  const limiter = {
    api: apiRateLimiter,
    scraper: scraperRateLimiter,
    ai: aiRateLimiter,
    auth: authRateLimiter,
  }[limiterType];

  if (!limiter) {
    return false;
  }

  const result = await checkRateLimit(limiter, userId);
  return !result.success;
}

/**
 * Reset rate limit for a specific identifier
 */
export async function resetRateLimit(
  identifier: string,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
): Promise<boolean> {
  const limiter = {
    api: apiRateLimiter,
    scraper: scraperRateLimiter,
    ai: aiRateLimiter,
    auth: authRateLimiter,
  }[limiterType];

  if (!limiter) {
    return false;
  }

  try {
    await limiter.reset(identifier);
    return true;
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return false;
  }
}

/**
 * Get rate limit status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  limiterType: 'api' | 'scraper' | 'ai' | 'auth' = 'api'
): Promise<RateLimitResult | null> {
  const limiter = {
    api: apiRateLimiter,
    scraper: scraperRateLimiter,
    ai: aiRateLimiter,
    auth: authRateLimiter,
  }[limiterType];

  if (!limiter) {
    return null;
  }

  try {
    const result = await limiter.get(identifier);
    return {
      success: result.remaining > 0,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return null;
  }
}