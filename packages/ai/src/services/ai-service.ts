import Anthropic from '@anthropic-ai/sdk'
import { aiCache } from './cache'
import { z } from 'zod'

// AI Service configuration
const AI_MODEL = 'claude-3-opus-20240229'
const MAX_TOKENS = 4096
const TEMPERATURE = 0.7

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Response schemas
const AnalysisResponseSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()),
  patterns: z.array(z.object({
    name: z.string(),
    description: z.string(),
    occurrences: z.number(),
  })),
  recommendations: z.array(z.string()),
  score: z.number().min(0).max(100),
})

const RecommendationResponseSchema = z.object({
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
  implementation: z.array(z.string()),
})

export class AIService {
  private static instance: AIService

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Analyze code with caching
   */
  async analyzeCode(params: {
    code: string
    language: string
    projectId?: string
    userId?: string
    useCache?: boolean
  }): Promise<z.infer<typeof AnalysisResponseSchema>> {
    const cacheKey = {
      type: 'analysis',
      content: `${params.language}:${params.code}`,
      projectId: params.projectId,
      userId: params.userId,
    }

    // Check cache first
    if (params.useCache !== false) {
      const cached = await aiCache.get<z.infer<typeof AnalysisResponseSchema>>(cacheKey)
      if (cached) {
        await aiCache.trackAccess(true)
        return cached
      }
      await aiCache.trackAccess(false)
    }

    try {
      // Call Claude API
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: `You are an expert code analyzer. Analyze the provided ${params.language} code and return a JSON response with the following structure:
        {
          "summary": "Brief summary of the code",
          "insights": ["Key insight 1", "Key insight 2"],
          "patterns": [{"name": "Pattern name", "description": "Pattern description", "occurrences": 1}],
          "recommendations": ["Recommendation 1", "Recommendation 2"],
          "score": 85
        }`,
        messages: [{
          role: 'user',
          content: `Analyze this ${params.language} code:\n\n${params.code}`
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const analysis = AnalysisResponseSchema.parse(JSON.parse(content.text))

      // Cache the result
      await aiCache.set({
        ...cacheKey,
        data: analysis,
        ttl: 3600, // 1 hour
        metadata: {
          language: params.language,
          timestamp: new Date().toISOString(),
        }
      })

      // Store in vector database for semantic search
      await aiCache.storeWithEmbedding({
        id: `analysis:${params.projectId || 'global'}:${Date.now()}`,
        text: `${params.code}\n\nAnalysis: ${analysis.summary}`,
        metadata: {
          type: 'analysis',
          language: params.language,
          projectId: params.projectId,
          userId: params.userId,
          score: analysis.score,
        },
        namespace: 'analyses',
      })

      return analysis
    } catch (error) {
      console.error('Code analysis error:', error)
      throw error
    }
  }

  /**
   * Get recommendations with caching
   */
  async getRecommendations(params: {
    context: string
    projectId?: string
    userId?: string
    useCache?: boolean
  }): Promise<z.infer<typeof RecommendationResponseSchema>[]> {
    const cacheKey = {
      type: 'recommendation',
      content: params.context,
      projectId: params.projectId,
      userId: params.userId,
    }

    // Check cache first
    if (params.useCache !== false) {
      const cached = await aiCache.get<z.infer<typeof RecommendationResponseSchema>[]>(cacheKey)
      if (cached) {
        await aiCache.trackAccess(true)
        return cached
      }
      await aiCache.trackAccess(false)
    }

    try {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: `You are an expert software architect. Provide recommendations based on the context. Return a JSON array of recommendations with this structure:
        [{
          "category": "Performance",
          "priority": "high",
          "title": "Optimize database queries",
          "description": "Description of the recommendation",
          "impact": "Reduces load time by 50%",
          "effort": "medium",
          "implementation": ["Step 1", "Step 2"]
        }]`,
        messages: [{
          role: 'user',
          content: `Provide recommendations for:\n\n${params.context}`
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const recommendations = z.array(RecommendationResponseSchema).parse(JSON.parse(content.text))

      // Cache the result
      await aiCache.set({
        ...cacheKey,
        data: recommendations,
        ttl: 3600, // 1 hour
        metadata: {
          count: recommendations.length,
          timestamp: new Date().toISOString(),
        }
      })

      // Store each recommendation in vector database
      for (const rec of recommendations) {
        await aiCache.storeWithEmbedding({
          id: `rec:${params.projectId || 'global'}:${Date.now()}:${rec.title.replace(/\s+/g, '-')}`,
          text: `${rec.title}\n${rec.description}\n${rec.implementation.join('\n')}`,
          metadata: {
            type: 'recommendation',
            category: rec.category,
            priority: rec.priority,
            effort: rec.effort,
            projectId: params.projectId,
            userId: params.userId,
          },
          namespace: 'recommendations',
        })
      }

      return recommendations
    } catch (error) {
      console.error('Recommendations error:', error)
      throw error
    }
  }

  /**
   * Extract patterns with caching
   */
  async extractPatterns(params: {
    code: string
    language: string
    projectId?: string
    userId?: string
    useCache?: boolean
  }): Promise<Array<{ name: string; description: string; example: string; usage: string }>> {
    const cacheKey = {
      type: 'pattern',
      content: `${params.language}:${params.code}`,
      projectId: params.projectId,
      userId: params.userId,
    }

    // Check cache first
    if (params.useCache !== false) {
      const cached = await aiCache.get<Array<{ name: string; description: string; example: string; usage: string }>>(cacheKey)
      if (cached) {
        await aiCache.trackAccess(true)
        return cached
      }
      await aiCache.trackAccess(false)
    }

    try {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: `You are an expert at identifying coding patterns. Extract reusable patterns from the code. Return a JSON array of patterns:
        [{
          "name": "Pattern Name",
          "description": "What this pattern does",
          "example": "Code example",
          "usage": "When to use this pattern"
        }]`,
        messages: [{
          role: 'user',
          content: `Extract patterns from this ${params.language} code:\n\n${params.code}`
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const patterns = JSON.parse(content.text)

      // Cache the result
      await aiCache.set({
        ...cacheKey,
        data: patterns,
        ttl: 7200, // 2 hours
        metadata: {
          language: params.language,
          count: patterns.length,
          timestamp: new Date().toISOString(),
        }
      })

      // Store patterns in vector database
      for (const pattern of patterns) {
        await aiCache.storeWithEmbedding({
          id: `pattern:${params.projectId || 'global'}:${Date.now()}:${pattern.name.replace(/\s+/g, '-')}`,
          text: `${pattern.name}\n${pattern.description}\n${pattern.example}\n${pattern.usage}`,
          metadata: {
            type: 'pattern',
            name: pattern.name,
            language: params.language,
            projectId: params.projectId,
            userId: params.userId,
          },
          namespace: 'patterns',
        })
      }

      return patterns
    } catch (error) {
      console.error('Pattern extraction error:', error)
      throw error
    }
  }

  /**
   * Search similar content using semantic search
   */
  async searchSimilar(params: {
    query: string
    type?: 'analysis' | 'recommendation' | 'pattern' | 'resource'
    projectId?: string
    limit?: number
  }): Promise<Array<{ id: string; score: number; content?: any }>> {
    const filter: Record<string, any> = {}
    if (params.type) filter.type = params.type
    if (params.projectId) filter.projectId = params.projectId

    const results = await aiCache.searchSimilarByText({
      query: params.query,
      topK: params.limit || 10,
      filter,
      namespace: params.type ? `${params.type}s` : undefined,
    })

    // Enhance results with cached content if available
    const enhanced = await Promise.all(
      results.map(async (result) => {
        const cached = await aiCache.get({
          type: result.metadata?.type || 'resource',
          content: result.id,
          projectId: params.projectId,
        })
        return {
          ...result,
          content: cached,
        }
      })
    )

    return enhanced
  }

  /**
   * Generate context-aware content
   */
  async generateContent(params: {
    prompt: string
    context?: string
    projectId?: string
    userId?: string
    useCache?: boolean
  }): Promise<string> {
    const cacheKey = {
      type: 'generation' as any,
      content: `${params.prompt}:${params.context || ''}`,
      projectId: params.projectId,
      userId: params.userId,
    }

    // Check cache first
    if (params.useCache !== false) {
      const cached = await aiCache.get<string>(cacheKey)
      if (cached) {
        await aiCache.trackAccess(true)
        return cached
      }
      await aiCache.trackAccess(false)
    }

    try {
      // Search for similar content for context
      let enhancedContext = params.context || ''
      if (params.projectId) {
        const similar = await this.searchSimilar({
          query: params.prompt,
          projectId: params.projectId,
          limit: 3,
        })
        
        if (similar.length > 0) {
          enhancedContext += '\n\nRelated context:\n'
          similar.forEach(item => {
            if (item.content) {
              enhancedContext += `- ${JSON.stringify(item.content).substring(0, 200)}...\n`
            }
          })
        }
      }

      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: params.context ? `Use this context: ${enhancedContext}` : undefined,
        messages: [{
          role: 'user',
          content: params.prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      // Cache the result
      await aiCache.set({
        ...cacheKey,
        data: content.text,
        ttl: 1800, // 30 minutes
        metadata: {
          hasContext: !!params.context,
          timestamp: new Date().toISOString(),
        }
      })

      return content.text
    } catch (error) {
      console.error('Content generation error:', error)
      throw error
    }
  }

  /**
   * Clear cache for a specific project or user
   */
  async clearCache(params: {
    projectId?: string
    userId?: string
    type?: string
  }): Promise<void> {
    await aiCache.invalidate(params)
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    size: number
    hits: number
    misses: number
    hitRate: number
  }> {
    return aiCache.getStats()
  }
}

// Export singleton instance
export const aiService = AIService.getInstance()