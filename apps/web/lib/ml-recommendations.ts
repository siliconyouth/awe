import { prisma } from '@awe/database'
import { cache } from './upstash'
import { 
  searchSimilar, 
  findSimilarResources,
  vectorIndex 
} from './vector-search-modern'
import { queueManager, QueueName } from '@awe/ai/services/queue-service-upstash'

/**
 * ML-Powered Recommendations Engine
 * Uses vector embeddings and user behavior for intelligent recommendations
 */

// Recommendation types
export enum RecommendationType {
  SIMILAR_RESOURCES = 'similar_resources',
  TRENDING = 'trending',
  PERSONALIZED = 'personalized',
  COLLABORATIVE = 'collaborative', // Based on similar users
  CONTENT_BASED = 'content_based', // Based on content similarity
  HYBRID = 'hybrid', // Combination of methods
  EXPLORE = 'explore', // Discovery/serendipity
  PERFORMANCE = 'performance', // Code optimization suggestions
  PATTERN = 'pattern' // Pattern recommendations
}

// Recommendation context
export interface RecommendationContext {
  userId: string
  projectId?: string
  resourceId?: string
  query?: string
  filters?: {
    type?: string[]
    tags?: string[]
    dateRange?: { start: Date; end: Date }
  }
  limit?: number
}

// Recommendation result
export interface Recommendation {
  id: string
  type: RecommendationType
  score: number
  reason: string
  resource?: any
  pattern?: any
  action?: {
    type: string
    label: string
    url?: string
    data?: any
  }
  metadata?: any
}

// User behavior tracking
export interface UserBehavior {
  userId: string
  actions: Array<{
    type: 'view' | 'like' | 'save' | 'share' | 'apply' | 'dismiss'
    resourceId?: string
    patternId?: string
    timestamp: Date
    duration?: number
    metadata?: any
  }>
  preferences: {
    types: string[]
    tags: string[]
    complexity: 'beginner' | 'intermediate' | 'advanced'
  }
  statistics: {
    totalViews: number
    totalLikes: number
    totalSaves: number
    avgSessionDuration: number
    lastActive: Date
  }
}

/**
 * ML Recommendations Service
 */
export class MLRecommendationService {
  private static instance: MLRecommendationService

  private constructor() {}

  static getInstance(): MLRecommendationService {
    if (!MLRecommendationService.instance) {
      MLRecommendationService.instance = new MLRecommendationService()
    }
    return MLRecommendationService.instance
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendations(
    context: RecommendationContext,
    type: RecommendationType = RecommendationType.HYBRID
  ): Promise<Recommendation[]> {
    const { userId, limit = 10 } = context

    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}:${type}:${JSON.stringify(context)}`
      if (cache) {
        const cached = await cache.get(cacheKey)
        if (cached) {
          console.log('✅ Recommendations cache hit')
          return cached as Recommendation[]
        }
      }

      let recommendations: Recommendation[] = []

      switch (type) {
        case RecommendationType.SIMILAR_RESOURCES:
          recommendations = await this.getSimilarResourceRecommendations(context)
          break

        case RecommendationType.TRENDING:
          recommendations = await this.getTrendingRecommendations(context)
          break

        case RecommendationType.PERSONALIZED:
          recommendations = await this.getPersonalizedRecommendations(context)
          break

        case RecommendationType.COLLABORATIVE:
          recommendations = await this.getCollaborativeRecommendations(context)
          break

        case RecommendationType.CONTENT_BASED:
          recommendations = await this.getContentBasedRecommendations(context)
          break

        case RecommendationType.EXPLORE:
          recommendations = await this.getExplorationRecommendations(context)
          break

        case RecommendationType.PERFORMANCE:
          recommendations = await this.getPerformanceRecommendations(context)
          break

        case RecommendationType.PATTERN:
          recommendations = await this.getPatternRecommendations(context)
          break

        case RecommendationType.HYBRID:
        default:
          recommendations = await this.getHybridRecommendations(context)
          break
      }

      // Limit results
      recommendations = recommendations.slice(0, limit)

      // Cache results for 5 minutes
      if (cache && recommendations.length > 0) {
        await cache.set(cacheKey, recommendations, 300)
      }

      // Track recommendation generation
      await this.trackRecommendations(userId, recommendations)

      return recommendations
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      return []
    }
  }

  /**
   * Get similar resource recommendations
   */
  private async getSimilarResourceRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { resourceId, limit = 10 } = context

    if (!resourceId) return []

    const similar = await findSimilarResources(resourceId, limit)

    return similar.map((resource, index) => ({
      id: `rec_similar_${resource.id}`,
      type: RecommendationType.SIMILAR_RESOURCES,
      score: 1 - (index / similar.length), // Higher score for more similar
      reason: 'Based on content similarity',
      resource,
      metadata: {
        similarity: resource.score
      }
    }))
  }

  /**
   * Get trending recommendations
   */
  private async getTrendingRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { limit = 10, filters } = context

    // Get trending resources from telemetry
    const trending = await prisma.telemetryEvent.groupBy({
      by: ['data'],
      where: {
        event: 'resource_viewed',
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      _count: {
        data: true
      },
      orderBy: {
        _count: {
          data: 'desc'
        }
      },
      take: limit * 2 // Get more to filter
    })

    // Get resource details
    const resourceIds = trending
      .map(t => (t.data as any)?.resourceId)
      .filter(Boolean)
      .slice(0, limit)

    const resources = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        ...(filters?.type ? { type: { in: filters.type } } : {}),
        ...(filters?.tags ? { tags: { hasSome: filters.tags } } : {})
      }
    })

    return resources.map((resource, index) => ({
      id: `rec_trending_${resource.id}`,
      type: RecommendationType.TRENDING,
      score: 1 - (index / resources.length),
      reason: 'Trending this week',
      resource,
      metadata: {
        views: trending.find(t => (t.data as any)?.resourceId === resource.id)?._count.data || 0
      }
    }))
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  private async getPersonalizedRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { userId, limit = 10 } = context

    // Get user behavior
    const behavior = await this.getUserBehavior(userId)

    if (!behavior || behavior.actions.length === 0) {
      // Fall back to trending for new users
      return this.getTrendingRecommendations(context)
    }

    // Extract user preferences from behavior
    const viewedResourceIds = behavior.actions
      .filter(a => a.type === 'view' && a.resourceId)
      .map(a => a.resourceId!)

    const likedResourceIds = behavior.actions
      .filter(a => a.type === 'like' && a.resourceId)
      .map(a => a.resourceId!)

    // Get similar resources to liked ones (content-based filtering)
    const recommendations: Recommendation[] = []

    for (const resourceId of likedResourceIds.slice(0, 3)) {
      const similar = await findSimilarResources(resourceId, 5)
      
      for (const resource of similar) {
        // Skip if already viewed
        if (viewedResourceIds.includes(resource.id)) continue

        recommendations.push({
          id: `rec_personalized_${resource.id}`,
          type: RecommendationType.PERSONALIZED,
          score: resource.score || 0.5,
          reason: 'Based on your interests',
          resource,
          metadata: {
            basedOn: resourceId
          }
        })
      }
    }

    // Sort by score and limit
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { userId, limit = 10 } = context

    // Find similar users based on interaction patterns
    const userInteractions = await prisma.telemetryEvent.findMany({
      where: {
        userId,
        event: { in: ['resource_viewed', 'resource_liked', 'pattern_applied'] }
      },
      select: {
        data: true
      }
    })

    const interactedResourceIds = userInteractions
      .map(i => (i.data as any)?.resourceId)
      .filter(Boolean)

    if (interactedResourceIds.length === 0) return []

    // Find users who interacted with the same resources
    const similarUsers = await prisma.telemetryEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { not: userId },
        event: { in: ['resource_viewed', 'resource_liked'] },
        AND: {
          data: {
            path: '$.resourceId',
            array_contains: interactedResourceIds
          }
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    })

    if (similarUsers.length === 0) return []

    // Get resources liked by similar users
    const similarUserIds = similarUsers.map(u => u.userId)
    const recommendedResources = await prisma.telemetryEvent.findMany({
      where: {
        userId: { in: similarUserIds },
        event: 'resource_liked',
        NOT: {
          data: {
            path: '$.resourceId',
            array_contains: interactedResourceIds
          }
        }
      },
      select: {
        data: true
      },
      take: limit * 2
    })

    // Get unique resource IDs
    const resourceIds = [...new Set(
      recommendedResources
        .map(r => (r.data as any)?.resourceId)
        .filter(Boolean)
    )].slice(0, limit)

    const resources = await prisma.resource.findMany({
      where: { id: { in: resourceIds } }
    })

    return resources.map((resource, index) => ({
      id: `rec_collaborative_${resource.id}`,
      type: RecommendationType.COLLABORATIVE,
      score: 1 - (index / resources.length),
      reason: 'Users with similar interests also liked',
      resource,
      metadata: {
        basedOnUsers: similarUserIds.length
      }
    }))
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { userId, query, limit = 10 } = context

    // Build query from user's recent interactions
    let searchQuery = query

    if (!searchQuery) {
      const recentViews = await prisma.telemetryEvent.findMany({
        where: {
          userId,
          event: 'resource_viewed'
        },
        orderBy: { timestamp: 'desc' },
        take: 5
      })

      const resourceIds = recentViews
        .map(v => (v.data as any)?.resourceId)
        .filter(Boolean)

      if (resourceIds.length > 0) {
        const resources = await prisma.resource.findMany({
          where: { id: { in: resourceIds } },
          select: { title: true, tags: true }
        })

        // Build query from titles and tags
        searchQuery = resources
          .map(r => `${r.title} ${r.tags?.join(' ') || ''}`)
          .join(' ')
      }
    }

    if (!searchQuery) return []

    // Use vector search for content similarity
    const similar = await searchSimilar(searchQuery, {
      limit,
      filter: { userId: { $ne: userId } } // Exclude user's own resources
    })

    return similar.map((resource, index) => ({
      id: `rec_content_${resource.id}`,
      type: RecommendationType.CONTENT_BASED,
      score: resource.score || (1 - index / similar.length),
      reason: 'Based on content you engage with',
      resource,
      metadata: {
        query: searchQuery.slice(0, 50)
      }
    }))
  }

  /**
   * Get exploration recommendations (serendipity)
   */
  private async getExplorationRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { userId, limit = 10 } = context

    // Get user's typical categories
    const userCategories = await prisma.telemetryEvent.findMany({
      where: { userId, event: 'resource_viewed' },
      select: { data: true },
      take: 50
    })

    const viewedTypes = new Set(
      userCategories
        .map(c => (c.data as any)?.type)
        .filter(Boolean)
    )

    // Find resources in different categories
    const explorationResources = await prisma.resource.findMany({
      where: {
        type: { notIn: Array.from(viewedTypes) },
        status: 'published'
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return explorationResources.map((resource, index) => ({
      id: `rec_explore_${resource.id}`,
      type: RecommendationType.EXPLORE,
      score: 0.5 + (0.5 * (1 - index / explorationResources.length)),
      reason: 'Explore something new',
      resource,
      metadata: {
        diversity: true
      }
    }))
  }

  /**
   * Get performance optimization recommendations
   */
  private async getPerformanceRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { projectId, limit = 10 } = context

    if (!projectId) return []

    // Get project's performance metrics
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        resources: {
          where: { type: 'code' },
          orderBy: { updatedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!project) return []

    const recommendations: Recommendation[] = []

    // Analyze patterns in code resources
    for (const resource of project.resources) {
      // Look for optimization patterns
      const optimizationPatterns = await prisma.pattern.findMany({
        where: {
          category: 'optimization',
          language: resource.metadata?.language
        },
        take: 3
      })

      for (const pattern of optimizationPatterns) {
        recommendations.push({
          id: `rec_perf_${pattern.id}_${resource.id}`,
          type: RecommendationType.PERFORMANCE,
          score: pattern.confidence || 0.7,
          reason: `Optimize ${resource.title}`,
          pattern,
          action: {
            type: 'apply_pattern',
            label: 'Apply optimization',
            data: {
              resourceId: resource.id,
              patternId: pattern.id
            }
          },
          metadata: {
            resource: resource.id,
            improvement: pattern.metadata?.improvement || 'Performance improvement'
          }
        })
      }
    }

    return recommendations.slice(0, limit)
  }

  /**
   * Get pattern recommendations
   */
  private async getPatternRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { userId, projectId, limit = 10 } = context

    // Get user's technology stack
    const userResources = await prisma.resource.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {})
      },
      select: {
        metadata: true,
        tags: true
      },
      take: 20
    })

    // Extract technologies
    const technologies = new Set<string>()
    userResources.forEach(r => {
      if (r.metadata?.language) technologies.add(r.metadata.language)
      if (r.metadata?.framework) technologies.add(r.metadata.framework)
      r.tags?.forEach(tag => technologies.add(tag))
    })

    if (technologies.size === 0) return []

    // Find relevant patterns
    const patterns = await prisma.pattern.findMany({
      where: {
        OR: [
          { language: { in: Array.from(technologies) } },
          { tags: { hasSome: Array.from(technologies) } }
        ],
        confidence: { gte: 0.7 }
      },
      orderBy: [
        { usageCount: 'desc' },
        { confidence: 'desc' }
      ],
      take: limit
    })

    return patterns.map((pattern, index) => ({
      id: `rec_pattern_${pattern.id}`,
      type: RecommendationType.PATTERN,
      score: pattern.confidence || (1 - index / patterns.length),
      reason: `Recommended pattern for ${pattern.language || 'your stack'}`,
      pattern,
      action: {
        type: 'view_pattern',
        label: 'View pattern',
        url: `/patterns/${pattern.id}`
      },
      metadata: {
        usageCount: pattern.usageCount,
        category: pattern.category
      }
    }))
  }

  /**
   * Get hybrid recommendations (combination of methods)
   */
  private async getHybridRecommendations(
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    const { limit = 10 } = context

    // Get recommendations from multiple sources
    const [
      trending,
      personalized,
      collaborative,
      patterns
    ] = await Promise.all([
      this.getTrendingRecommendations({ ...context, limit: Math.floor(limit * 0.3) }),
      this.getPersonalizedRecommendations({ ...context, limit: Math.floor(limit * 0.3) }),
      this.getCollaborativeRecommendations({ ...context, limit: Math.floor(limit * 0.2) }),
      this.getPatternRecommendations({ ...context, limit: Math.floor(limit * 0.2) })
    ])

    // Combine and re-rank
    const allRecommendations = [
      ...trending.map(r => ({ ...r, weight: 0.3 })),
      ...personalized.map(r => ({ ...r, weight: 0.3 })),
      ...collaborative.map(r => ({ ...r, weight: 0.2 })),
      ...patterns.map(r => ({ ...r, weight: 0.2 }))
    ]

    // Adjust scores based on weights
    allRecommendations.forEach(rec => {
      rec.score = rec.score * rec.weight
    })

    // Sort by adjusted score and remove duplicates
    const seen = new Set<string>()
    const uniqueRecommendations = allRecommendations
      .sort((a, b) => b.score - a.score)
      .filter(rec => {
        const key = rec.resource?.id || rec.pattern?.id || rec.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, limit)

    return uniqueRecommendations
  }

  /**
   * Track user behavior
   */
  async trackUserAction(
    userId: string,
    action: {
      type: 'view' | 'like' | 'save' | 'share' | 'apply' | 'dismiss'
      resourceId?: string
      patternId?: string
      duration?: number
      metadata?: any
    }
  ): Promise<void> {
    // Store in telemetry
    await prisma.telemetryEvent.create({
      data: {
        userId,
        event: `recommendation_${action.type}`,
        data: action,
        timestamp: new Date()
      }
    })

    // Update user behavior cache
    if (cache) {
      const key = `behavior:${userId}`
      const behavior = await cache.get(key) as UserBehavior || {
        userId,
        actions: [],
        preferences: { types: [], tags: [], complexity: 'intermediate' },
        statistics: {
          totalViews: 0,
          totalLikes: 0,
          totalSaves: 0,
          avgSessionDuration: 0,
          lastActive: new Date()
        }
      }

      behavior.actions.push({
        ...action,
        timestamp: new Date()
      })

      // Keep only last 100 actions
      if (behavior.actions.length > 100) {
        behavior.actions = behavior.actions.slice(-100)
      }

      // Update statistics
      behavior.statistics.lastActive = new Date()
      if (action.type === 'view') behavior.statistics.totalViews++
      if (action.type === 'like') behavior.statistics.totalLikes++
      if (action.type === 'save') behavior.statistics.totalSaves++

      await cache.set(key, behavior, 3600) // Cache for 1 hour
    }

    // Queue for ML model training
    await queueManager.addJob(QueueName.ANALYTICS, {
      type: 'user_behavior',
      userId,
      action,
      timestamp: new Date()
    })
  }

  /**
   * Get user behavior
   */
  private async getUserBehavior(userId: string): Promise<UserBehavior | null> {
    // Check cache first
    if (cache) {
      const cached = await cache.get(`behavior:${userId}`)
      if (cached) return cached as UserBehavior
    }

    // Build from telemetry events
    const events = await prisma.telemetryEvent.findMany({
      where: {
        userId,
        event: { startsWith: 'recommendation_' }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    if (events.length === 0) return null

    const behavior: UserBehavior = {
      userId,
      actions: events.map(e => ({
        type: e.event.replace('recommendation_', '') as any,
        ...(e.data as any),
        timestamp: e.timestamp
      })),
      preferences: {
        types: [],
        tags: [],
        complexity: 'intermediate'
      },
      statistics: {
        totalViews: events.filter(e => e.event === 'recommendation_view').length,
        totalLikes: events.filter(e => e.event === 'recommendation_like').length,
        totalSaves: events.filter(e => e.event === 'recommendation_save').length,
        avgSessionDuration: 0,
        lastActive: events[0]?.timestamp || new Date()
      }
    }

    // Cache for future use
    if (cache) {
      await cache.set(`behavior:${userId}`, behavior, 3600)
    }

    return behavior
  }

  /**
   * Track recommendation generation
   */
  private async trackRecommendations(
    userId: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    await prisma.telemetryEvent.create({
      data: {
        userId,
        event: 'recommendations_generated',
        data: {
          count: recommendations.length,
          types: [...new Set(recommendations.map(r => r.type))],
          scores: recommendations.map(r => r.score)
        },
        timestamp: new Date()
      }
    })
  }
}

// Export singleton instance
export const mlRecommendations = MLRecommendationService.getInstance()

// Export convenience functions
export async function getRecommendations(
  context: RecommendationContext,
  type?: RecommendationType
): Promise<Recommendation[]> {
  return mlRecommendations.getRecommendations(context, type)
}

export async function trackUserAction(
  userId: string,
  action: any
): Promise<void> {
  return mlRecommendations.trackUserAction(userId, action)
}