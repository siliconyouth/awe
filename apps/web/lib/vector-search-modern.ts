import { Index } from '@upstash/vector'
import { cache } from './upstash'

/**
 * Modern Vector Search Service with Upstash Built-in Embeddings
 * No external dependencies required - Upstash handles everything
 */

// Initialize Vector Index with metadata typing
interface ResourceMetadata {
  id: string
  title: string
  type: string
  projectId?: string
  userId?: string
  tags?: string[]
  createdAt: string
  score?: number
}

// Initialize Upstash Vector with built-in embeddings
const getVectorIndex = () => {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  if (!url || !token) {
    console.warn('Upstash Vector not configured. Semantic search disabled.')
    return null
  }

  return new Index<ResourceMetadata>({
    url,
    token,
  })
}

export const vectorIndex = getVectorIndex()

/**
 * Index a resource with automatic embedding generation
 * Upstash Vector now handles embedding generation internally
 */
export async function indexResource(resource: {
  id: string
  title: string
  content: string
  description?: string
  type: string
  projectId?: string
  userId?: string
  tags?: string[]
}): Promise<void> {
  if (!vectorIndex) {
    console.warn('Vector index not available')
    return
  }

  try {
    // Combine fields for rich semantic representation
    const textToEmbed = [
      resource.title,
      resource.description || '',
      resource.content.slice(0, 1000), // Limit content length
      resource.tags?.join(' ') || ''
    ].join(' ').trim()

    // Upstash Vector can now accept raw text and generate embeddings internally
    await vectorIndex.upsert({
      id: resource.id,
      data: textToEmbed, // Upstash will generate embeddings from this
      metadata: {
        id: resource.id,
        title: resource.title,
        type: resource.type,
        projectId: resource.projectId,
        userId: resource.userId,
        tags: resource.tags,
        createdAt: new Date().toISOString()
      }
    })

    console.log(`✅ Indexed resource: ${resource.id}`)
  } catch (error) {
    console.error('Failed to index resource:', error)
    throw error
  }
}

/**
 * Search for similar resources using Upstash's built-in embeddings
 */
export async function searchSimilar(
  query: string,
  options: {
    limit?: number
    filter?: {
      type?: string
      projectId?: string
      userId?: string
      tags?: string[]
    }
    includeScore?: boolean
  } = {}
): Promise<ResourceMetadata[]> {
  if (!vectorIndex) {
    console.warn('Vector search not available')
    return []
  }

  const { limit = 10, filter, includeScore = false } = options

  try {
    // Check cache first
    const cacheKey = `vector:search:${JSON.stringify({ query, options })}`
    if (cache) {
      const cached = await cache.get(cacheKey)
      if (cached) {
        console.log('✅ Vector search cache hit')
        return cached as ResourceMetadata[]
      }
    }

    // Build metadata filter
    const metadataFilter: any = {}
    if (filter?.type) metadataFilter.type = filter.type
    if (filter?.projectId) metadataFilter.projectId = filter.projectId
    if (filter?.userId) metadataFilter.userId = filter.userId
    if (filter?.tags && filter.tags.length > 0) {
      metadataFilter.tags = { $in: filter.tags }
    }

    // Upstash Vector handles embedding generation for the query
    const results = await vectorIndex.query({
      data: query, // Raw text - Upstash generates embeddings
      topK: limit,
      filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
      includeMetadata: true,
      includeData: false // We don't need the raw embeddings back
    })

    // Process results
    const processedResults = results.map(result => ({
      ...result.metadata,
      score: includeScore ? result.score : undefined
    }))

    // Cache results
    if (cache) {
      await cache.set(cacheKey, processedResults, 300) // 5 minute cache
    }

    return processedResults
  } catch (error) {
    console.error('Vector search failed:', error)
    return []
  }
}

/**
 * Find resources similar to a given resource
 */
export async function findSimilarResources(
  resourceId: string,
  limit = 5
): Promise<ResourceMetadata[]> {
  if (!vectorIndex) return []

  try {
    // Fetch the resource's vector
    const resource = await vectorIndex.fetch([resourceId])
    if (!resource || resource.length === 0) {
      console.warn(`Resource ${resourceId} not found in vector index`)
      return []
    }

    // Search for similar using the resource's vector
    const results = await vectorIndex.query({
      vector: resource[0].vector,
      topK: limit + 1, // +1 to exclude the resource itself
      includeMetadata: true
    })

    // Filter out the original resource and return
    return results
      .filter(r => r.id !== resourceId)
      .slice(0, limit)
      .map(r => r.metadata)
  } catch (error) {
    console.error('Find similar resources failed:', error)
    return []
  }
}

/**
 * Hybrid search combining keyword and semantic search
 */
export async function hybridSearch(
  query: string,
  options: {
    limit?: number
    filter?: any
    weights?: {
      semantic?: number
      keyword?: number
    }
  } = {}
): Promise<ResourceMetadata[]> {
  const { 
    limit = 10, 
    filter, 
    weights = { semantic: 0.7, keyword: 0.3 } 
  } = options

  try {
    // Perform semantic search
    const semanticResults = await searchSimilar(query, { 
      limit: limit * 2, 
      filter,
      includeScore: true 
    })

    // Perform keyword search (using your database)
    // This is a placeholder - implement based on your database
    const keywordResults = await performKeywordSearch(query, { limit: limit * 2, filter })

    // Combine and re-rank results
    const combinedResults = new Map<string, ResourceMetadata & { combinedScore: number }>()

    // Add semantic results
    semanticResults.forEach(result => {
      const score = (result.score || 0) * weights.semantic!
      combinedResults.set(result.id, {
        ...result,
        combinedScore: score
      })
    })

    // Add/update with keyword results
    keywordResults.forEach(result => {
      const existing = combinedResults.get(result.id)
      const keywordScore = (result.score || 0) * weights.keyword!
      
      if (existing) {
        existing.combinedScore += keywordScore
      } else {
        combinedResults.set(result.id, {
          ...result,
          combinedScore: keywordScore
        })
      }
    })

    // Sort by combined score and return top results
    return Array.from(combinedResults.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit)
      .map(({ combinedScore, ...rest }) => rest)
  } catch (error) {
    console.error('Hybrid search failed:', error)
    return []
  }
}

/**
 * Batch index multiple resources
 */
export async function batchIndexResources(
  resources: Array<{
    id: string
    title: string
    content: string
    description?: string
    type: string
    projectId?: string
    userId?: string
    tags?: string[]
  }>
): Promise<void> {
  if (!vectorIndex || resources.length === 0) return

  console.log(`📊 Batch indexing ${resources.length} resources...`)

  try {
    // Prepare batch data
    const vectors = resources.map(resource => {
      const textToEmbed = [
        resource.title,
        resource.description || '',
        resource.content.slice(0, 1000),
        resource.tags?.join(' ') || ''
      ].join(' ').trim()

      return {
        id: resource.id,
        data: textToEmbed,
        metadata: {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          projectId: resource.projectId,
          userId: resource.userId,
          tags: resource.tags,
          createdAt: new Date().toISOString()
        }
      }
    })

    // Batch upsert
    await vectorIndex.upsert(vectors)
    console.log(`✅ Successfully indexed ${resources.length} resources`)
  } catch (error) {
    console.error('Batch indexing failed:', error)
    throw error
  }
}

/**
 * Delete resource from vector index
 */
export async function deleteFromIndex(resourceId: string): Promise<void> {
  if (!vectorIndex) return

  try {
    await vectorIndex.delete(resourceId)
    console.log(`✅ Deleted resource from index: ${resourceId}`)
  } catch (error) {
    console.error('Failed to delete from index:', error)
  }
}

/**
 * Update resource in vector index
 */
export async function updateInIndex(resource: {
  id: string
  title: string
  content: string
  description?: string
  type: string
  projectId?: string
  userId?: string
  tags?: string[]
}): Promise<void> {
  // Upstash Vector uses upsert for both insert and update
  await indexResource(resource)
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<{
  vectorCount: number
  indexSize: number
  dimension: number
} | null> {
  if (!vectorIndex) return null

  try {
    const info = await vectorIndex.info()
    return {
      vectorCount: info.vectorCount,
      indexSize: info.pendingVectorCount || 0,
      dimension: info.dimension
    }
  } catch (error) {
    console.error('Failed to get index stats:', error)
    return null
  }
}

/**
 * Reset the entire index (dangerous!)
 */
export async function resetIndex(): Promise<void> {
  if (!vectorIndex) return

  try {
    await vectorIndex.reset()
    console.log('⚠️ Vector index has been reset')
  } catch (error) {
    console.error('Failed to reset index:', error)
    throw error
  }
}

// Placeholder for keyword search - implement based on your database
async function performKeywordSearch(
  query: string,
  options: { limit?: number; filter?: any }
): Promise<(ResourceMetadata & { score?: number })[]> {
  // This should be implemented with your database
  // For now, return empty array
  return []
}

/**
 * Initialize vector index with sample data (for testing)
 */
export async function initializeSampleData(): Promise<void> {
  if (!vectorIndex) return

  const sampleResources = [
    {
      id: 'sample-1',
      title: 'Getting Started with Next.js',
      content: 'Next.js is a React framework for building full-stack web applications.',
      type: 'documentation',
      tags: ['nextjs', 'react', 'framework']
    },
    {
      id: 'sample-2',
      title: 'TypeScript Best Practices',
      content: 'Learn the best practices for writing clean and maintainable TypeScript code.',
      type: 'guide',
      tags: ['typescript', 'best-practices', 'coding']
    },
    {
      id: 'sample-3',
      title: 'Building Scalable APIs',
      content: 'Design patterns and strategies for building scalable REST and GraphQL APIs.',
      type: 'tutorial',
      tags: ['api', 'scalability', 'architecture']
    }
  ]

  await batchIndexResources(sampleResources)
  console.log('✅ Sample data initialized in vector index')
}