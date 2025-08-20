import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withCache } from '@/lib/cache-middleware'
import { searchSimilar, hybridSearch } from '@/lib/vector-search'

// GET /api/resources/search - Semantic search for resources
export async function GET(request: NextRequest) {
  return withCache(async (req) => {
    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, 'search')
    if (rateLimitResponse) return rateLimitResponse

    try {
      const searchParams = req.nextUrl.searchParams
      const query = searchParams.get('q') || searchParams.get('query')
      const type = searchParams.get('type')
      const mode = searchParams.get('mode') || 'hybrid' // hybrid, semantic, keyword
      const limit = parseInt(searchParams.get('limit') || '20')

      if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
      }

      let results = []

      if (mode === 'semantic') {
        // Pure semantic search
        const filter = type ? { type } : undefined
        const semanticResults = await searchSimilar(query, { limit, filter })
        
        // Fetch full resource data
        const resourceIds = semanticResults.map(r => r.id as string)
        if (resourceIds.length > 0) {
          const resources = await prisma.resource.findMany({
            where: { id: { in: resourceIds } },
            include: {
              tags: {
                include: {
                  tag: true
                }
              }
            }
          })
          
          // Maintain order from semantic search
          const resourceMap = new Map(resources.map(r => [r.id, r]))
          results = resourceIds.map(id => resourceMap.get(id)).filter(Boolean)
        }
      } else if (mode === 'keyword') {
        // Traditional keyword search
        const where: any = {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        }
        
        if (type) {
          where.type = type
        }
        
        results = await prisma.resource.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          },
          take: limit,
          orderBy: { createdAt: 'desc' }
        })
      } else {
        // Hybrid search (keyword + semantic)
        // First get keyword results
        const where: any = {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }
        
        if (type) {
          where.type = type
        }
        
        const keywordResults = await prisma.resource.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          },
          take: limit * 2 // Get more for merging
        })
        
        // Perform hybrid search
        const hybridResults = await hybridSearch(query, keywordResults, {
          semanticWeight: 0.4, // Slightly favor keywords
          limit
        })
        
        // Fetch any missing resources
        const existingIds = new Set(keywordResults.map(r => r.id))
        const missingIds = hybridResults
          .map(r => r.id)
          .filter(id => !existingIds.has(id))
        
        if (missingIds.length > 0) {
          const additionalResources = await prisma.resource.findMany({
            where: { id: { in: missingIds } },
            include: {
              tags: {
                include: {
                  tag: true
                }
              }
            }
          })
          
          const allResources = [...keywordResults, ...additionalResources]
          const resourceMap = new Map(allResources.map(r => [r.id, r]))
          results = hybridResults.map(r => resourceMap.get(r.id)).filter(Boolean)
        } else {
          const resourceMap = new Map(keywordResults.map(r => [r.id, r]))
          results = hybridResults.map(r => resourceMap.get(r.id)).filter(Boolean)
        }
      }

      // Format results
      const formattedResults = results.map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        fileType: resource.fileType,
        tags: resource.tags?.map(t => t.tag.name) || [],
        author: resource.authorId,
        createdAt: resource.createdAt,
        qualityScore: (resource.metadata as any)?.qualityScore || 0
      }))

      return NextResponse.json({
        query,
        mode,
        count: formattedResults.length,
        results: formattedResults
      })
    } catch (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
  }, {
    ttl: 180, // Cache for 3 minutes
    keyPrefix: 'search',
    includeAuth: false
  })(request)
}