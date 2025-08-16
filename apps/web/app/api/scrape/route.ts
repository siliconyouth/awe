import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rateLimited } from '@/lib/rate-limit';
import { browserless } from '@/lib/browserless';
import { cache } from '@/lib/upstash';

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
    const { url, type = 'content', options = {} } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `scrape:${userId}:${url}:${type}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Perform scraping based on type
    let result;
    
    switch (type) {
      case 'screenshot':
        // Take a screenshot
        const screenshot = await browserless.screenshot(url, {
          fullPage: options.fullPage || false,
          width: options.width || 1920,
          height: options.height || 1080,
          type: options.format || 'png',
        });
        
        // Convert to base64 for JSON response
        result = {
          type: 'screenshot',
          format: options.format || 'png',
          data: screenshot.toString('base64'),
        };
        break;

      case 'pdf':
        // Convert to PDF
        const pdf = await browserless.pdf(url, {
          format: options.format || 'A4',
          landscape: options.landscape || false,
          margin: options.margin,
        });
        
        // Convert to base64 for JSON response
        result = {
          type: 'pdf',
          data: pdf.toString('base64'),
        };
        break;

      case 'content':
      default:
        // Scrape content
        const content = await browserless.scrape(url, {
          selector: options.selector,
          waitForSelector: options.waitForSelector,
        });
        
        result = {
          type: 'content',
          data: content,
        };
        break;
    }

    // Cache the result for 1 hour
    await cache.set(cacheKey, result, 3600);

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
export const POST = rateLimited(handler, 'scraper');

// Document the API endpoint
export async function GET(request: NextRequest) {
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
        // For content type
        selector: 'string (optional) - CSS selector to extract',
        waitForSelector: 'string (optional) - Wait for this selector before scraping',
        
        // For screenshot type
        fullPage: 'boolean (optional) - Take full page screenshot',
        width: 'number (optional) - Viewport width',
        height: 'number (optional) - Viewport height',
        format: 'string (optional) - Image format: png or jpeg',
        
        // For PDF type
        format: 'string (optional) - Page format: A4, Letter, etc.',
        landscape: 'boolean (optional) - Use landscape orientation',
        margin: 'object (optional) - Page margins',
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