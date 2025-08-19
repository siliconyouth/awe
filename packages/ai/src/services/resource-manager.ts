/**
 * Resource Management Service
 * Handles resource tagging, categorization, and AI-powered recommendations
 */

import { 
  Resource,
  ResourceType,
  ResourceStatus,
  ResourceVisibility,
  ResourceContent,
  Tag,
  ResourceTag,
  TagType,
  Category,
  TagCategory,
  Collection,
  ResourceSearchParams,
  ResourceSearchResult,
  ResourceFilter,
  ResourceRecommendation,
  ResourceStats
} from '@awe/shared'
import { ClaudeAIService } from '../claude'
import { prisma } from '@awe/database'

export class ResourceManager {
  private ai: ClaudeAIService

  constructor(aiService?: ClaudeAIService) {
    this.ai = aiService || new ClaudeAIService()
  }

  // ============================================
  // Resource CRUD Operations
  // ============================================

  /**
   * Create a new resource with automatic tagging
   */
  async createResource(
    data: {
      name?: string
      description?: string
      type?: ResourceType
      status?: ResourceStatus
      visibility?: ResourceVisibility
      content?: ResourceContent
      rawContent?: string
      fileType?: string
      categoryId?: string
      authorId?: string
      workspaceId?: string
      projectId?: string
      author?: string
      authorGithub?: string
      version?: string
      sourceUrl?: string
      sourceRepo?: string
      sourceId?: string
      license?: string
      changelog?: string
      keywords?: string[]
      metadata?: Record<string, any>
      verified?: boolean
      official?: boolean
      slug?: string
    }
  ): Promise<Resource> {
    // Generate slug if not provided
    const slug = data.slug || this.generateSlug(data.name || 'resource')

    // Auto-generate AI tags
    const aiTags = await this.generateAITags(data)

    // Calculate initial quality score
    const quality = await this.calculateQualityScore(data)

    // Create resource in database
    const resource = await prisma.resource.create({
      data: {
        slug,
        name: data.name || 'Untitled Resource',
        description: data.description || '',
        type: (data.type || ResourceType.PATTERN) as any,
        status: (data.status || ResourceStatus.PUBLISHED) as any,
        visibility: (data.visibility || ResourceVisibility.PUBLIC) as any,
        content: data.content ? JSON.stringify(data.content) : JSON.stringify({ main: '' }),
        rawContent: data.rawContent,
        fileType: data.fileType || 'markdown',
        categoryId: data.categoryId,
        authorId: data.authorId,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        author: data.author || 'community',
        authorGithub: data.authorGithub,
        version: data.version,
        sourceUrl: data.sourceUrl,
        sourceRepo: data.sourceRepo,
        sourceId: data.sourceId,
        license: data.license,
        changelog: data.changelog,
        keywords: data.keywords || [],
        metadata: data.metadata,
        quality,
        usageCount: 0,
        downloads: 0,
        stars: 0,
        verified: data.verified || false,
        official: data.official || false,
        tags: {
          create: aiTags.map(tag => ({
            tagId: tag.id,
            tagType: TagType.AI,
            confidence: tag.confidence
          }))
        }
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return this.mapPrismaResource(resource)
  }

  /**
   * Update an existing resource
   */
  async updateResource(
    id: string,
    updates: Partial<Resource>
  ): Promise<Resource> {
    // Recalculate quality score if content changed
    let quality = updates.quality
    if (updates.content || updates.metadata) {
      const existing = await this.getResource(id)
      if (existing) {
        quality = await this.calculateQualityScore({
          ...existing,
          ...updates
        } as Resource)
      }
    }

    // Remove non-updatable fields
    const { tags, reviews, usage, category, ...updateData } = updates

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...updateData,
        quality
      } as any,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return this.mapPrismaResource(resource)
  }

  /**
   * Get a resource by ID
   */
  async getResource(id: string): Promise<Resource | null> {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        },
        reviews: true,
        usage: true
      }
    })

    return resource ? this.mapPrismaResource(resource) : null
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<boolean> {
    try {
      await prisma.resource.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }

  // ============================================
  // Tag Management
  // ============================================

  /**
   * Add tags to a resource
   */
  async addTags(
    resourceId: string,
    tagIds: string[],
    tagType: TagType = TagType.USER,
    addedBy?: string
  ): Promise<ResourceTag[]> {
    const tags = await Promise.all(
      tagIds.map(tagId =>
        prisma.resourceTag.create({
          data: {
            resourceId,
            tagId,
            tagType: tagType as any,
            addedBy
          },
          include: {
            tag: true
          }
        })
      )
    )

    // Update tag usage counts
    await this.updateTagUsageCounts(tagIds)

    return tags.map((t: any) => ({
      id: t.id,
      resourceId: t.resourceId,
      tagId: t.tagId,
      tag: t.tag ? {
        ...t.tag,
        description: t.tag.description || undefined,
        category: t.tag.category || undefined,
        icon: t.tag.icon || undefined,
        color: t.tag.color || undefined,
        metadata: t.tag.metadata || undefined
      } : undefined,
      tagType: t.tagType as TagType,
      confidence: t.confidence || undefined,
      addedBy: t.addedBy || undefined,
      createdAt: t.createdAt
    })) as ResourceTag[]
  }

  /**
   * Remove tags from a resource
   */
  async removeTags(resourceId: string, tagIds: string[]): Promise<void> {
    await prisma.resourceTag.deleteMany({
      where: {
        resourceId,
        tagId: {
          in: tagIds
        }
      }
    })

    await this.updateTagUsageCounts(tagIds)
  }

  /**
   * Generate AI tags for a resource
   */
  async generateAITags(
    resource: Partial<Resource>
  ): Promise<Array<{ id: string; confidence: number }>> {
    const prompt = `Analyze this resource and suggest relevant tags:
    
Type: ${resource.type}
Name: ${resource.name}
Description: ${resource.description}
Content: ${JSON.stringify(resource.content).slice(0, 1000)}

Suggest tags from these categories:
- Language (programming languages used)
- Framework (frameworks/libraries used)
- Domain (web, mobile, api, etc.)
- Purpose (auth, database, ui, etc.)
- Difficulty (beginner, intermediate, advanced)
- Features (specific features or capabilities)

Return as JSON array of objects with tagName and confidence (0-1).`

    try {
      const response = await this.ai.chat(prompt)
      const suggestions = JSON.parse(response)
      
      // Find or create tags and return with confidence scores
      const tags = await Promise.all(
        suggestions.map(async (s: any) => {
          let tag = await prisma.tag.findFirst({
            where: { name: s.tagName }
          })
          
          if (!tag) {
            tag = await prisma.tag.create({
              data: {
                name: s.tagName,
                slug: this.generateSlug(s.tagName),
                category: this.inferTagCategory(s.tagName),
                isOfficial: false
              }
            })
          }
          
          return {
            id: tag.id,
            confidence: s.confidence
          }
        })
      )
      
      return tags
    } catch (error) {
      console.error('Failed to generate AI tags:', error)
      return []
    }
  }

  // ============================================
  // Search and Discovery
  // ============================================

  /**
   * Search resources with advanced filtering
   */
  async searchResources(
    params: ResourceSearchParams
  ): Promise<ResourceSearchResult> {
    const {
      query,
      type,
      categories,
      tags,
      status = [ResourceStatus.PUBLISHED],
      visibility,
      author,
      qualityMin,
      sortBy = 'created',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = params

    // Build where clause
    const where: any = {
      AND: []
    }

    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    if (type?.length) {
      where.AND.push({ type: { in: type } })
    }

    if (categories?.length) {
      where.AND.push({ categoryId: { in: categories } })
    }

    if (tags?.length) {
      where.AND.push({
        tags: {
          some: {
            tag: {
              slug: { in: tags }
            }
          }
        }
      })
    }

    if (status?.length) {
      where.AND.push({ status: { in: status } })
    }

    if (visibility?.length) {
      where.AND.push({ visibility: { in: visibility } })
    }

    if (author) {
      where.AND.push({ author })
    }

    if (qualityMin !== undefined) {
      where.AND.push({ quality: { gte: qualityMin } })
    }

    // Execute search
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where: where.AND.length ? where : undefined,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      }),
      prisma.resource.count({
        where: where.AND.length ? where : undefined
      })
    ])

    // Get facets for filtering
    const facets = await this.getSearchFacets(where)

    return {
      resources: resources.map((r: any) => this.mapPrismaResource(r)),
      total,
      facets
    }
  }

  /**
   * Get recommended resources based on context
   */
  async getRecommendations(
    context: {
      userId?: string
      projectId?: string
      resourceId?: string
      recentResources?: string[]
    },
    limit: number = 10
  ): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = []

    // Get user's recent usage patterns
    if (context.userId) {
      const userPatterns = await this.analyzeUserPatterns(context.userId)
      const similar = await this.findSimilarResources(userPatterns, limit / 2)
      recommendations.push(...similar)
    }

    // Get project-specific recommendations
    if (context.projectId) {
      const projectRecs = await this.getProjectRecommendations(context.projectId, limit / 2)
      recommendations.push(...projectRecs)
    }

    // Get similar resources
    if (context.resourceId) {
      const similar = await this.findSimilarToResource(context.resourceId, limit / 2)
      recommendations.push(...similar)
    }

    // Get trending resources
    const trending = await this.getTrendingResources(limit / 4)
    recommendations.push(...trending)

    // Sort by score and deduplicate
    const unique = this.deduplicateRecommendations(recommendations)
    return unique.slice(0, limit)
  }

  // ============================================
  // Collections Management
  // ============================================

  /**
   * Create a resource collection
   */
  async createCollection(
    data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'resources'>
  ): Promise<Collection> {
    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        description: data.description,
        isOfficial: data.isOfficial || false,
        isCurated: data.isCurated || false,
        author: data.author,
        metadata: data.metadata || undefined
      }
    })

    return {
      ...collection,
      author: collection.author || undefined,
      metadata: collection.metadata as Record<string, any> | null | undefined
    } as Collection
  }

  /**
   * Add resources to a collection
   */
  async addToCollection(
    collectionId: string,
    resourceIds: string[],
    notes?: string[]
  ): Promise<void> {
    const maxOrder = await prisma.collectionResource.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const startOrder = (maxOrder?.order || 0) + 1

    await Promise.all(
      resourceIds.map((resourceId, index) =>
        prisma.collectionResource.create({
          data: {
            collectionId,
            resourceId,
            order: startOrder + index,
            notes: notes?.[index]
          }
        })
      )
    )
  }

  // ============================================
  // Quality and Analytics
  // ============================================

  /**
   * Calculate quality score for a resource
   */
  async calculateQualityScore(resource: Partial<Resource>): Promise<number> {
    let score = 0
    const weights = {
      hasDescription: 10,
      hasDocumentation: 15,
      hasExamples: 20,
      hasTags: 10,
      hasTests: 15,
      hasChangelog: 5,
      isVersioned: 5,
      communityRating: 20
    }

    // Basic completeness checks
    if (resource.description && resource.description.length > 50) {
      score += weights.hasDescription
    }

    if (resource.metadata?.documentation) {
      score += weights.hasDocumentation
    }

    // Check for examples in content
    const content = resource.content as any
    if (content?.example || content?.examples) {
      score += weights.hasExamples
    }

    if (resource.tags && resource.tags.length > 0) {
      score += weights.hasTags
    }

    if (resource.metadata?.requirements) {
      score += weights.hasTests
    }

    if (resource.metadata?.changelog) {
      score += weights.hasChangelog
    }

    if (resource.version && resource.version !== '1.0.0') {
      score += weights.isVersioned
    }

    // Add community rating if available
    if (resource.metadata?.rating) {
      score += (resource.metadata.rating / 5) * weights.communityRating
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Track resource usage
   */
  async trackUsage(
    resourceId: string,
    action: string,
    context?: {
      userId?: string
      projectId?: string
      sessionId?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    await prisma.resourceUsage.create({
      data: {
        resourceId,
        action,
        userId: context?.userId,
        projectId: context?.projectId,
        sessionId: context?.sessionId,
        context: context?.metadata
      }
    })

    // Update resource usage count
    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        usageCount: {
          increment: 1
        },
        downloads: action === 'download' ? { increment: 1 } : undefined
      }
    })
  }

  // ============================================
  // Helper Methods
  // ============================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private inferTagCategory(tagName: string): string {
    const patterns = {
      'language': /^(javascript|typescript|python|rust|go|java|c\+\+|c#|ruby|php)/i,
      'framework': /^(react|vue|angular|express|django|fastapi|spring|rails)/i,
      'domain': /^(web|mobile|api|cli|desktop|embedded|iot|blockchain)/i,
      'purpose': /^(auth|database|ui|testing|deployment|monitoring|security)/i,
      'difficulty': /^(beginner|intermediate|advanced|expert)/i
    }

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(tagName)) {
        return category
      }
    }

    return 'custom'
  }

  private async updateTagUsageCounts(tagIds: string[]): Promise<void> {
    for (const tagId of tagIds) {
      const count = await prisma.resourceTag.count({
        where: { tagId }
      })

      await prisma.tag.update({
        where: { id: tagId },
        data: { usageCount: count }
      })
    }
  }

  private mapPrismaResource(resource: any): Resource {
    return {
      ...resource,
      tags: resource.tags?.map((rt: any) => ({
        ...rt,
        tag: rt.tag
      }))
    }
  }

  private async getSearchFacets(where: any): Promise<any> {
    // Implementation for getting search facets
    // This would aggregate counts for different filter options
    return {
      types: [],
      categories: [],
      tags: [],
      languages: [],
      frameworks: []
    }
  }

  private async analyzeUserPatterns(userId: string): Promise<any> {
    // Analyze user's resource usage patterns
    const usage = await prisma.resourceUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        resource: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    })

    // Extract patterns from usage data
    return {
      preferredTypes: [],
      preferredTags: [],
      preferredCategories: []
    }
  }

  private async findSimilarResources(patterns: any, limit: number): Promise<ResourceRecommendation[]> {
    // Find resources similar to user patterns
    return []
  }

  private async getProjectRecommendations(projectId: string, limit: number): Promise<ResourceRecommendation[]> {
    // Get recommendations based on project context
    return []
  }

  private async findSimilarToResource(resourceId: string, limit: number): Promise<ResourceRecommendation[]> {
    // Find resources similar to a given resource
    return []
  }

  private async getTrendingResources(limit: number): Promise<ResourceRecommendation[]> {
    // Get currently trending resources
    const trending = await prisma.resource.findMany({
      where: {
        status: ResourceStatus.PUBLISHED,
        visibility: ResourceVisibility.PUBLIC
      },
      orderBy: [
        { usageCount: 'desc' },
        { stars: 'desc' }
      ],
      take: limit,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return trending.map((resource: any) => ({
      resourceId: resource.id,
      resource: this.mapPrismaResource(resource),
      relevanceScore: resource.usageCount * 0.7 + (resource.metadata?.rating || 0) * 0.3,
      reason: 'Trending resource with high usage',
      priority: 'medium' as const
    }))
  }

  private deduplicateRecommendations(
    recommendations: ResourceRecommendation[]
  ): ResourceRecommendation[] {
    const seen = new Set<string>()
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .filter(rec => {
        if (!rec.resource || seen.has(rec.resource.id)) {
          return false
        }
        seen.add(rec.resource.id)
        return true
      })
  }
}