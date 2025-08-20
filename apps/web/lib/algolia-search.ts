import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch'
import { cache } from './upstash'

/**
 * Algolia Search Integration
 * Provides instant search with faceting and advanced features
 */

// Initialize Algolia client
const getAlgoliaClient = (): SearchClient | null => {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY

  if (!appId || !apiKey) {
    console.warn('Algolia credentials not configured. Instant search disabled.')
    return null
  }

  return algoliasearch(appId, apiKey)
}

// Get search-only client for frontend
export const getSearchClient = (): SearchClient | null => {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

  if (!appId || !searchKey) {
    return null
  }

  return algoliasearch(appId, searchKey)
}

const algoliaClient = getAlgoliaClient()

// Index names
export const INDICES = {
  RESOURCES: 'resources',
  PATTERNS: 'patterns',
  USERS: 'users',
  COLLECTIONS: 'collections'
} as const

/**
 * Get or create an Algolia index
 */
function getIndex(indexName: string): SearchIndex | null {
  if (!algoliaClient) return null
  return algoliaClient.initIndex(indexName)
}

/**
 * Configure index settings for optimal search
 */
export async function configureIndex(indexName: string) {
  const index = getIndex(indexName)
  if (!index) return

  try {
    await index.setSettings({
      // Searchable attributes in order of importance
      searchableAttributes: [
        'unordered(title)',
        'unordered(description)',
        'unordered(tags)',
        'content',
        'author'
      ],
      
      // Attributes for faceting/filtering
      attributesForFaceting: [
        'searchable(tags)',
        'filterOnly(type)',
        'filterOnly(status)',
        'filterOnly(visibility)',
        'filterOnly(authorId)',
        'filterOnly(qualityScore)'
      ],
      
      // Custom ranking
      customRanking: [
        'desc(qualityScore)',
        'desc(usageCount)',
        'desc(rating)',
        'desc(createdAt)'
      ],
      
      // Highlighting
      attributesToHighlight: [
        'title',
        'description',
        'content'
      ],
      
      // Snippeting
      attributesToSnippet: [
        'content:50',
        'description:30'
      ],
      
      // Performance
      hitsPerPage: 20,
      maxValuesPerFacet: 100,
      
      // Typo tolerance
      typoTolerance: true,
      minWordSizefor1Typo: 4,
      minWordSizefor2Typos: 8,
      
      // Relevance
      removeStopWords: true,
      ignorePlurals: true,
      
      // Advanced
      distinct: false,
      replaceSynonymsInHighlight: true,
      minProximity: 1,
      responseFields: ['*'],
      maxFacetHits: 10
    })

    console.log(`Algolia index ${indexName} configured successfully`)
  } catch (error) {
    console.error(`Failed to configure Algolia index ${indexName}:`, error)
  }
}

/**
 * Index a resource in Algolia
 */
export async function indexResource(resource: {
  id: string
  title: string
  description?: string
  content?: string
  type: string
  tags?: string[]
  authorId?: string
  status?: string
  visibility?: string
  qualityScore?: number
  usageCount?: number
  rating?: number
  createdAt: Date | string
  metadata?: any
}) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return

  try {
    // Prepare object for Algolia
    const algoliaObject = {
      objectID: resource.id,
      title: resource.title,
      description: resource.description || '',
      content: resource.content ? resource.content.slice(0, 10000) : '', // Limit content size
      type: resource.type,
      tags: resource.tags || [],
      authorId: resource.authorId || '',
      status: resource.status || 'DRAFT',
      visibility: resource.visibility || 'PRIVATE',
      qualityScore: resource.qualityScore || 0,
      usageCount: resource.usageCount || 0,
      rating: resource.rating || 0,
      createdAt: new Date(resource.createdAt).getTime(),
      _tags: resource.tags || [], // For faceting
      ...resource.metadata
    }

    await index.saveObject(algoliaObject)
    
    // Invalidate search cache
    if (cache) {
      await cache.delete('algolia:search:*')
    }
    
    console.log(`Indexed resource ${resource.id} in Algolia`)
  } catch (error) {
    console.error(`Failed to index resource ${resource.id} in Algolia:`, error)
  }
}

/**
 * Batch index resources
 */
export async function batchIndexResources(resources: any[]) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return

  try {
    const objects = resources.map(resource => ({
      objectID: resource.id,
      title: resource.title,
      description: resource.description || '',
      content: resource.content ? resource.content.slice(0, 10000) : '',
      type: resource.type,
      tags: resource.tags || [],
      authorId: resource.authorId || '',
      status: resource.status || 'DRAFT',
      visibility: resource.visibility || 'PRIVATE',
      qualityScore: resource.qualityScore || 0,
      usageCount: resource.usageCount || 0,
      rating: resource.rating || 0,
      createdAt: new Date(resource.createdAt).getTime(),
      _tags: resource.tags || []
    }))

    const { objectIDs } = await index.saveObjects(objects)
    
    console.log(`Batch indexed ${objectIDs.length} resources in Algolia`)
    
    // Invalidate search cache
    if (cache) {
      await cache.delete('algolia:search:*')
    }
    
    return objectIDs
  } catch (error) {
    console.error('Failed to batch index resources in Algolia:', error)
    return []
  }
}

/**
 * Search resources with Algolia
 */
export async function searchResources(
  query: string,
  options: {
    filters?: string
    facets?: string[]
    page?: number
    hitsPerPage?: number
    attributesToRetrieve?: string[]
    attributesToHighlight?: string[]
    getRankingInfo?: boolean
    analytics?: boolean
    clickAnalytics?: boolean
    userToken?: string
  } = {}
) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) {
    console.warn('Algolia search not available')
    return null
  }

  try {
    // Check cache first
    const cacheKey = `algolia:search:${JSON.stringify({ query, options })}`
    if (cache) {
      const cached = await cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const searchOptions = {
      page: options.page || 0,
      hitsPerPage: options.hitsPerPage || 20,
      filters: options.filters,
      facets: options.facets || ['type', 'tags', 'status'],
      attributesToRetrieve: options.attributesToRetrieve,
      attributesToHighlight: options.attributesToHighlight,
      getRankingInfo: options.getRankingInfo || false,
      analytics: options.analytics !== false,
      clickAnalytics: options.clickAnalytics || true,
      userToken: options.userToken
    }

    const results = await index.search(query, searchOptions)
    
    // Cache results for 1 minute
    if (cache) {
      await cache.set(cacheKey, results, 60)
    }
    
    return results
  } catch (error) {
    console.error('Algolia search failed:', error)
    return null
  }
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(
  query: string,
  options: {
    hitsPerPage?: number
    attributesToRetrieve?: string[]
  } = {}
) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return []

  try {
    const results = await index.search(query, {
      hitsPerPage: options.hitsPerPage || 5,
      attributesToRetrieve: options.attributesToRetrieve || ['title', 'description', 'type'],
      attributesToHighlight: [],
      attributesToSnippet: [],
      getRankingInfo: false,
      analytics: false
    })

    return results.hits
  } catch (error) {
    console.error('Failed to get search suggestions:', error)
    return []
  }
}

/**
 * Update resource in Algolia
 */
export async function updateResource(
  resourceId: string,
  updates: Partial<{
    title: string
    description: string
    content: string
    tags: string[]
    status: string
    visibility: string
    qualityScore: number
    usageCount: number
    rating: number
  }>
) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return

  try {
    await index.partialUpdateObject({
      objectID: resourceId,
      ...updates,
      _tags: updates.tags // Update faceting tags
    })
    
    // Invalidate cache
    if (cache) {
      await cache.delete('algolia:search:*')
    }
    
    console.log(`Updated resource ${resourceId} in Algolia`)
  } catch (error) {
    console.error(`Failed to update resource ${resourceId} in Algolia:`, error)
  }
}

/**
 * Delete resource from Algolia
 */
export async function deleteResource(resourceId: string) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return

  try {
    await index.deleteObject(resourceId)
    
    // Invalidate cache
    if (cache) {
      await cache.delete('algolia:search:*')
    }
    
    console.log(`Deleted resource ${resourceId} from Algolia`)
  } catch (error) {
    console.error(`Failed to delete resource ${resourceId} from Algolia:`, error)
  }
}

/**
 * Clear entire index
 */
export async function clearIndex(indexName: string) {
  const index = getIndex(indexName)
  if (!index) return

  try {
    await index.clearObjects()
    console.log(`Cleared Algolia index ${indexName}`)
  } catch (error) {
    console.error(`Failed to clear Algolia index ${indexName}:`, error)
  }
}

/**
 * Get facet values for filtering
 */
export async function getFacetValues(
  facetName: string,
  options: {
    facetQuery?: string
    maxFacetHits?: number
  } = {}
) {
  const index = getIndex(INDICES.RESOURCES)
  if (!index) return []

  try {
    const results = await index.searchForFacetValues(facetName, options.facetQuery || '', {
      maxFacetHits: options.maxFacetHits || 10
    })
    
    return results.facetHits
  } catch (error) {
    console.error(`Failed to get facet values for ${facetName}:`, error)
    return []
  }
}

/**
 * Analytics: Track search click
 */
export async function trackSearchClick(
  queryID: string,
  objectID: string,
  position: number
) {
  if (!algoliaClient) return

  try {
    const analytics = algoliaClient.initAnalytics()
    await analytics.clickedObjectIDsAfterSearch({
      index: INDICES.RESOURCES,
      eventName: 'Resource Clicked',
      queryID,
      objectIDs: [objectID],
      positions: [position]
    })
  } catch (error) {
    console.error('Failed to track search click:', error)
  }
}

/**
 * Analytics: Track conversion
 */
export async function trackSearchConversion(
  queryID: string,
  objectID: string
) {
  if (!algoliaClient) return

  try {
    const analytics = algoliaClient.initAnalytics()
    await analytics.convertedObjectIDsAfterSearch({
      index: INDICES.RESOURCES,
      eventName: 'Resource Used',
      queryID,
      objectIDs: [objectID]
    })
  } catch (error) {
    console.error('Failed to track search conversion:', error)
  }
}

/**
 * Set up personalization
 */
export async function setupPersonalization(userId: string, preferences: any) {
  if (!algoliaClient) return

  try {
    const personalization = algoliaClient.initPersonalization()
    await personalization.setPersonalizationStrategy({
      eventsScoring: [
        { eventName: 'Resource Clicked', eventType: 'click', score: 1 },
        { eventName: 'Resource Used', eventType: 'conversion', score: 3 }
      ],
      facetsScoring: [
        { facetName: 'type', score: 1 },
        { facetName: 'tags', score: 2 }
      ],
      personalizationImpact: 50 // 0-100, how much personalization affects results
    })
    
    console.log('Algolia personalization configured')
  } catch (error) {
    console.error('Failed to set up personalization:', error)
  }
}

/**
 * Export index configuration for backup
 */
export async function exportIndexSettings(indexName: string) {
  const index = getIndex(indexName)
  if (!index) return null

  try {
    const settings = await index.getSettings()
    return settings
  } catch (error) {
    console.error(`Failed to export settings for ${indexName}:`, error)
    return null
  }
}

/**
 * Import index configuration from backup
 */
export async function importIndexSettings(indexName: string, settings: any) {
  const index = getIndex(indexName)
  if (!index) return

  try {
    await index.setSettings(settings)
    console.log(`Imported settings for ${indexName}`)
  } catch (error) {
    console.error(`Failed to import settings for ${indexName}:`, error)
  }
}