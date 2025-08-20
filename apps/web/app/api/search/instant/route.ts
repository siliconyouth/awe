import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { searchResources, getSearchSuggestions, getFacetValues } from '@/lib/algolia-search'
import { searchSimilar } from '@/lib/vector-search'
import { prisma } from '@awe/database'

// GET /api/search/instant - Instant search with Algolia
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, 'resources')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type')
    const tags = searchParams.get('tags')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const mode = searchParams.get('mode') || 'instant' // instant, suggest, facets

    if (mode === 'suggest') {
      // Get search suggestions for autocomplete
      const suggestions = await getSearchSuggestions(query, {
        hitsPerPage: limit,
        attributesToRetrieve: ['title', 'description', 'type', 'tags']
      })

      return NextResponse.json({
        query,
        suggestions
      })
    }

    if (mode === 'facets') {
      // Get facet values for filtering
      const facetName = searchParams.get('facet') || 'tags'
      const facetQuery = searchParams.get('facetQuery') || ''
      
      const facetValues = await getFacetValues(facetName, {
        facetQuery,
        maxFacetHits: limit
      })

      return NextResponse.json({
        facet: facetName,
        values: facetValues
      })
    }

    // Build Algolia filters
    const filters = []
    if (type) filters.push(`type:${type}`)
    if (status) filters.push(`status:${status}`)
    if (tags) {
      const tagList = tags.split(',')
      filters.push(tagList.map(tag => `tags:${tag}`).join(' OR '))
    }

    // Try Algolia search first
    const algoliaResults = await searchResources(query, {
      filters: filters.length > 0 ? filters.join(' AND ') : undefined,
      page,
      hitsPerPage: limit,
      facets: ['type', 'tags', 'status'],
      analytics: true,
      clickAnalytics: true
    })

    if (algoliaResults && algoliaResults.hits.length > 0) {
      // Algolia search successful
      return NextResponse.json({
        source: 'algolia',
        query,
        hits: algoliaResults.hits,
        totalHits: algoliaResults.nbHits,
        page: algoliaResults.page,
        totalPages: algoliaResults.nbPages,
        processingTime: algoliaResults.processingTimeMS,
        facets: algoliaResults.facets,
        queryID: algoliaResults.queryID // For analytics
      })
    }

    // Fallback to vector search if Algolia not available or no results
    console.log('Falling back to vector search')
    
    const filter: any = {}
    if (type) filter.type = type
    if (status) filter.status = status
    
    const vectorResults = await searchSimilar(query, {
      limit,
      filter
    })

    if (vectorResults && vectorResults.length > 0) {
      // Fetch full resource data
      const resourceIds = vectorResults.map(r => r.id as string)
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

      // Maintain order from vector search
      const resourceMap = new Map(resources.map(r => [r.id, r]))
      const orderedResources = resourceIds
        .map(id => resourceMap.get(id))
        .filter(Boolean)
        .map(resource => ({
          objectID: resource!.id,
          title: resource!.title,
          description: resource!.description,
          type: resource!.type,
          tags: resource!.tags?.map((t: any) => t.tag.name) || [],
          createdAt: resource!.createdAt,
          _highlightResult: {
            title: { value: resource!.title, matchLevel: 'none' },
            description: { value: resource!.description || '', matchLevel: 'none' }
          }
        }))

      return NextResponse.json({
        source: 'vector',
        query,
        hits: orderedResources,
        totalHits: orderedResources.length,
        page: 0,
        totalPages: 1,
        processingTime: 0
      })
    }

    // Final fallback to database search
    console.log('Falling back to database search')
    
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    if (type) where.type = type
    if (status) where.status = status
    
    const dbResults = await prisma.resource.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: limit,
      skip: page * limit,
      orderBy: { createdAt: 'desc' }
    })

    const totalCount = await prisma.resource.count({ where })

    const formattedResults = dbResults.map(resource => ({
      objectID: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      tags: resource.tags?.map((t: any) => t.tag.name) || [],
      createdAt: resource.createdAt,
      _highlightResult: {
        title: { value: resource.title, matchLevel: 'none' },
        description: { value: resource.description || '', matchLevel: 'none' }
      }
    }))

    return NextResponse.json({
      source: 'database',
      query,
      hits: formattedResults,
      totalHits: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      processingTime: 0
    })
  } catch (error) {
    console.error('Instant search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}