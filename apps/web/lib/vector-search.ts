import { Index } from '@upstash/vector'

/**
 * Upstash Vector Database for Semantic Search
 */

// Initialize Vector Index
const getVectorIndex = () => {
  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  if (!url || !token) {
    console.warn('Upstash Vector credentials not configured. Semantic search disabled.')
    return null
  }

  return new Index({
    url,
    token,
  })
}

export const vectorIndex = getVectorIndex()

/**
 * Generate embeddings for text
 * Note: Upstash Vector now handles embeddings internally
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for embedding generation')
  }

  // For compatibility, return a simple embedding
  // Actual embedding is handled by Upstash Vector when using data field
  return generateSimpleEmbedding(text)
}

/**
 * Simple embedding generation for fallback
 * This is a very basic implementation for development
 */
function generateSimpleEmbedding(text: string): number[] {
  const dimensions = 384 // Match text-embedding-3-small dimensions
  const embedding = new Array(dimensions).fill(0)
  
  // Simple hash-based embedding (not suitable for production)
  const words = text.toLowerCase().split(/\s+/)
  words.forEach((word, idx) => {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    embedding[Math.abs(hash) % dimensions] += 1 / words.length
  })
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude
    }
  }
  
  return embedding
}

/**
 * Index a resource for semantic search
 */
export async function indexResource(resource: {
  id: string
  title: string
  description?: string
  content: string
  type: string
  tags?: string[]
}) {
  if (!vectorIndex) {
    console.warn('Vector index not available')
    return
  }

  try {
    // Combine text for embedding
    const textToEmbed = [
      resource.title,
      resource.description || '',
      resource.content.slice(0, 2000), // Limit content length
      ...(resource.tags || [])
    ].join(' ')

    const embedding = await generateEmbedding(textToEmbed)

    // Upsert to vector index with Upstash's built-in embeddings
    await vectorIndex.upsert({
      id: resource.id,
      data: textToEmbed, // Upstash will generate embeddings from this
      metadata: {
        title: resource.title,
        description: resource.description || '',
        type: resource.type,
        tags: resource.tags || []
      }
    })

    console.log(`Indexed resource ${resource.id} for semantic search`)
  } catch (error) {
    console.error(`Failed to index resource ${resource.id}:`, error)
  }
}

/**
 * Search for similar resources
 */
export async function searchSimilar(
  query: string,
  options: {
    limit?: number
    filter?: Record<string, any>
    includeVectors?: boolean
  } = {}
) {
  if (!vectorIndex) {
    console.warn('Vector search not available')
    return []
  }

  try {
    // Use Upstash's built-in embedding for queries
    const results = await vectorIndex.query({
      data: query, // Upstash will generate embeddings from this
      topK: options.limit || 10,
      filter: options.filter ? JSON.stringify(options.filter) : undefined,
      includeVectors: options.includeVectors || false,
      includeMetadata: true
    })

    return results
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

/**
 * Find resources similar to a given resource
 */
export async function findSimilarResources(
  resourceId: string,
  limit: number = 5
) {
  if (!vectorIndex) {
    return []
  }

  try {
    // Fetch the resource's vector
    const resource = await vectorIndex.fetch([resourceId], {
      includeVectors: true,
      includeMetadata: true
    })

    if (!resource || resource.length === 0 || !resource[0]) {
      return []
    }

    // Search for similar vectors
    const results = await vectorIndex.query({
      vector: resource[0].vector!,
      topK: limit + 1, // +1 to exclude self
      includeMetadata: true
    })

    // Filter out the source resource
    return results.filter(r => r.id !== resourceId)
  } catch (error) {
    console.error('Find similar resources error:', error)
    return []
  }
}

/**
 * Delete a resource from the vector index
 */
export async function deleteFromIndex(resourceId: string) {
  if (!vectorIndex) {
    return
  }

  try {
    await vectorIndex.delete([resourceId])
    console.log(`Deleted resource ${resourceId} from vector index`)
  } catch (error) {
    console.error(`Failed to delete resource ${resourceId} from index:`, error)
  }
}

/**
 * Batch index multiple resources
 */
export async function batchIndexResources(resources: Array<{
  id: string
  title: string
  description?: string
  content: string
  type: string
  tags?: string[]
}>) {
  if (!vectorIndex) {
    console.warn('Vector index not available')
    return
  }

  const vectors = []
  
  for (const resource of resources) {
    try {
      const textToEmbed = [
        resource.title,
        resource.description || '',
        resource.content.slice(0, 2000),
        ...(resource.tags || [])
      ].join(' ')

      vectors.push({
        id: resource.id,
        data: textToEmbed, // Upstash will generate embeddings from this
        metadata: {
          title: resource.title,
          description: resource.description || '',
          type: resource.type,
          tags: resource.tags || []
        }
      })
    } catch (error) {
      console.error(`Failed to prepare embedding for ${resource.id}:`, error)
    }
  }

  if (vectors.length > 0) {
    try {
      await vectorIndex.upsert(vectors)
      console.log(`Batch indexed ${vectors.length} resources`)
    } catch (error) {
      console.error('Batch indexing error:', error)
    }
  }
}

/**
 * Search with hybrid approach (keyword + semantic)
 */
export async function hybridSearch(
  query: string,
  keywordResults: any[],
  options: {
    semanticWeight?: number // 0-1, how much to weight semantic results
    limit?: number
  } = {}
) {
  const semanticWeight = options.semanticWeight || 0.5
  const limit = options.limit || 10

  // Get semantic search results
  const semanticResults = await searchSimilar(query, { limit })

  // Combine and re-rank results
  const combinedScores = new Map<string, number>()

  // Add keyword results with their scores
  keywordResults.forEach((result, index) => {
    const score = (1 - semanticWeight) * (1 - index / keywordResults.length)
    combinedScores.set(result.id, score)
  })

  // Add semantic results with their scores
  semanticResults.forEach((result, index) => {
    const currentScore = combinedScores.get(result.id as string) || 0
    const semanticScore = semanticWeight * (result.score || (1 - index / semanticResults.length))
    combinedScores.set(result.id as string, currentScore + semanticScore)
  })

  // Sort by combined score
  const sortedIds = Array.from(combinedScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  // Return results in order
  const resultMap = new Map()
  keywordResults.forEach(r => resultMap.set(r.id, r))
  semanticResults.forEach(r => resultMap.set(r.id, { 
    ...r.metadata, 
    id: r.id,
    score: r.score 
  }))

  return sortedIds.map(id => resultMap.get(id)).filter(Boolean)
}