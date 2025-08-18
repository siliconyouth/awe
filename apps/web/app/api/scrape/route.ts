import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SmartScraper } from '@awe/ai';
import { withRateLimit } from '../../../lib/rate-limit';

/**
 * Protected API Route: Web Scraping with Browserless
 * Rate limited to prevent abuse
 */

async function handler(request: NextRequest) {
  // Ensure user is authenticated
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { url, type = 'content' } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `scrape:${userId}:${url}:${type}`;
    
    // Try to get from Redis cache
    let cached = null;
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        cached = await redis.get(cacheKey);
      } catch (error) {
        console.error('Cache get error:', error);
      }
    }
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Initialize SmartScraper
    const scraper = new SmartScraper({
      cacheEnabled: true,
      timeout: 30000,
    });

    // Perform scraping
    let result;
    
    try {
      const contentResult = await scraper.scrape(url);
      
      result = {
        type: 'content',
        url,
        content: contentResult.content,
        markdown: contentResult.markdown,
        metadata: contentResult.metadata,
      };
    } finally {
      // Clean up
      await scraper.close();
    }

    // Cache the result for 1 hour
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        await redis.set(cacheKey, result, { ex: 3600 });
      } catch (error) {
        console.error('Cache set error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    
    return NextResponse.json(
      {
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (scraper type: 5 requests per minute)
export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(request, 'scraper');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // Continue with handler
  return handler(request);
}

// Document the API endpoint
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/scrape',
    method: 'POST',
    description: 'Scrape web content using Browserless headless Chrome',
    authentication: 'Required (Clerk)',
    rateLimit: '5 requests per minute',
    body: {
      url: 'string (required) - URL to scrape',
      type: 'string (optional) - Type of scraping: content, screenshot, pdf',
      options: {
        selector: 'string (optional) - CSS selector to extract (content type)',
        waitForSelector: 'string (optional) - Wait for this selector before scraping (content type)',
        fullPage: 'boolean (optional) - Take full page screenshot (screenshot type)',
        width: 'number (optional) - Viewport width (screenshot type)',
        height: 'number (optional) - Viewport height (screenshot type)',
        format: 'string (optional) - Image format: png/jpeg or Page format: A4/Letter',
        landscape: 'boolean (optional) - Use landscape orientation (PDF type)',
        margin: 'object (optional) - Page margins (PDF type)',
      },
    },
    response: {
      success: 'boolean',
      data: 'object - Scraped content, screenshot, or PDF',
      cached: 'boolean - Whether result was from cache',
    },
    example: {
      request: {
        url: 'https://example.com',
        type: 'content',
        options: {
          selector: '.main-content',
        },
      },
      response: {
        success: true,
        data: {
          type: 'content',
          data: '<html content>',
        },
        cached: false,
      },
    },
  });
}