import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { withRateLimit, addRateLimitHeaders, getRateLimitInfo } from '@/lib/middleware/rate-limit'
import { withCache } from '@/lib/cache-middleware'
import { aiService } from '@awe/ai'

// GET /api/resources - List all resources with optional filters
export async function GET(request: NextRequest) {
  // Wrap the handler with caching
  return withCache(async (req) => {
    // Apply rate limiting for resource queries
    const rateLimitResponse = await withRateLimit(req, 'resources')
    if (rateLimitResponse) return rateLimitResponse
    
    try {
      const searchParams = req.nextUrl.searchParams
      const type = searchParams.get('type')
      const search = searchParams.get('search')
      
      const where: any = {}
      
      if (type) {
        where.type = type
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } }
        ]
      }
      
      const resources = await prisma.resource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      
      // Add rate limit headers to response
      const response = NextResponse.json(resources)
      const rateLimitInfo = await getRateLimitInfo(req, 'resources')
      return addRateLimitHeaders(response, rateLimitInfo.limit, rateLimitInfo.remaining, rateLimitInfo.reset)
    } catch (error) {
      console.error('Error fetching resources:', error)
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
    }
  }, {
    ttl: 300, // Cache for 5 minutes
    keyPrefix: 'resources',
    includeAuth: false // Public endpoint
  })(request)
}

// POST /api/resources - Create a new resource (for seeding)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    const resource = await prisma.resource.create({
      data: {
        ...body,
        slug: `${slug}-${Date.now()}`
      }
    })
    
    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}