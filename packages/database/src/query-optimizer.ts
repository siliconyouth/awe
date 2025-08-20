import { PrismaClient } from '@prisma/client'

/**
 * Database Query Optimizer
 * Analyzes and optimizes database queries for better performance
 */

interface QueryMetrics {
  query: string
  duration: number
  rowCount: number
  timestamp: Date
}

interface QueryPattern {
  pattern: string
  count: number
  avgDuration: number
  suggestions: string[]
}

export class QueryOptimizer {
  private metrics: QueryMetrics[] = []
  private readonly maxMetrics = 1000
  private readonly slowQueryThreshold = 100 // ms
  
  /**
   * Log query execution metrics
   */
  logQuery(query: string, duration: number, rowCount: number): void {
    this.metrics.push({
      query,
      duration,
      rowCount,
      timestamp: new Date()
    })
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
    
    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, query)
    }
  }
  
  /**
   * Analyze query patterns and provide optimization suggestions
   */
  analyzePatterns(): QueryPattern[] {
    const patterns = new Map<string, QueryMetrics[]>()
    
    // Group queries by pattern
    this.metrics.forEach(metric => {
      const pattern = this.extractPattern(metric.query)
      if (!patterns.has(pattern)) {
        patterns.set(pattern, [])
      }
      patterns.get(pattern)!.push(metric)
    })
    
    // Analyze each pattern
    const results: QueryPattern[] = []
    patterns.forEach((metrics, pattern) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
      const suggestions = this.generateSuggestions(pattern, metrics)
      
      results.push({
        pattern,
        count: metrics.length,
        avgDuration,
        suggestions
      })
    })
    
    // Sort by frequency and duration
    return results.sort((a, b) => b.count * b.avgDuration - a.count * a.avgDuration)
  }
  
  /**
   * Extract query pattern (remove specific values)
   */
  private extractPattern(query: string): string {
    return query
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
  
  /**
   * Generate optimization suggestions
   */
  private generateSuggestions(pattern: string, metrics: QueryMetrics[]): string[] {
    const suggestions: string[] = []
    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
    const avgRows = metrics.reduce((sum, m) => sum + m.rowCount, 0) / metrics.length
    
    // Check for N+1 queries
    if (metrics.length > 10 && pattern.includes('WHERE') && avgRows <= 1) {
      suggestions.push('Consider using a JOIN or include() to avoid N+1 queries')
    }
    
    // Check for missing indexes
    if (avgDuration > 50 && pattern.includes('WHERE')) {
      suggestions.push('Consider adding an index on the WHERE clause columns')
    }
    
    // Check for full table scans
    if (avgRows > 1000 && !pattern.includes('LIMIT')) {
      suggestions.push('Consider adding pagination with take/skip')
    }
    
    // Check for SELECT *
    if (pattern.includes('SELECT *') || !pattern.includes('select:')) {
      suggestions.push('Consider selecting only required fields')
    }
    
    // Check for missing ORDER BY with LIMIT
    if (pattern.includes('LIMIT') && !pattern.includes('ORDER BY')) {
      suggestions.push('Consider adding ORDER BY for consistent results')
    }
    
    return suggestions
  }
  
  /**
   * Get slow queries
   */
  getSlowQueries(threshold = this.slowQueryThreshold): QueryMetrics[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
  }
  
  /**
   * Get query statistics
   */
  getStats(): {
    totalQueries: number
    avgDuration: number
    slowQueries: number
    patterns: number
  } {
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const patterns = new Set(this.metrics.map(m => this.extractPattern(m.query)))
    
    return {
      totalQueries: this.metrics.length,
      avgDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      slowQueries: this.metrics.filter(m => m.duration > this.slowQueryThreshold).length,
      patterns: patterns.size
    }
  }
  
  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = []
  }
}

// Prisma middleware for query optimization
export function createQueryOptimizerMiddleware(optimizer: QueryOptimizer) {
  return async (params: any, next: any) => {
    const start = Date.now()
    const result = await next(params)
    const duration = Date.now() - start
    
    // Log the query
    const query = `${params.model}.${params.action}`
    const rowCount = Array.isArray(result) ? result.length : 1
    optimizer.logQuery(query, duration, rowCount)
    
    return result
  }
}

// Optimized query builders
export class OptimizedQueries {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Find with automatic pagination
   */
  async findManyPaginated<T>(
    model: any,
    {
      page = 1,
      limit = 20,
      where = {},
      orderBy = {},
      include = {}
    }: {
      page?: number
      limit?: number
      where?: any
      orderBy?: any
      include?: any
    }
  ): Promise<{
    data: T[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    
    // Run count and data queries in parallel
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        include,
        take: limit,
        skip
      }),
      model.count({ where })
    ])
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }
  
  /**
   * Batch create with transaction
   */
  async batchCreate<T>(
    model: any,
    data: any[],
    chunkSize = 100
  ): Promise<T[]> {
    const results: T[] = []
    
    // Process in chunks to avoid overwhelming the database
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      
      const created = await this.prisma.$transaction(
        chunk.map(item => model.create({ data: item }))
      )
      
      results.push(...created)
    }
    
    return results
  }
  
  /**
   * Find with cursor-based pagination (more efficient for large datasets)
   */
  async findManyCursor<T>(
    model: any,
    {
      cursor,
      limit = 20,
      where = {},
      orderBy = {}
    }: {
      cursor?: string
      limit?: number
      where?: any
      orderBy?: any
    }
  ): Promise<{
    data: T[]
    nextCursor: string | null
  }> {
    const query: any = {
      where,
      orderBy,
      take: limit + 1 // Take one extra to determine if there's a next page
    }
    
    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1 // Skip the cursor item
    }
    
    const items = await model.findMany(query)
    
    let nextCursor: string | null = null
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem.id
    }
    
    return {
      data: items,
      nextCursor
    }
  }
  
  /**
   * Upsert many with minimal queries
   */
  async upsertMany<T>(
    model: any,
    data: Array<{
      where: any
      create: any
      update: any
    }>
  ): Promise<T[]> {
    // Use transaction for consistency
    return this.prisma.$transaction(
      data.map(item =>
        model.upsert({
          where: item.where,
          create: item.create,
          update: item.update
        })
      )
    )
  }
  
  /**
   * Soft delete with cascading
   */
  async softDelete(
    model: any,
    id: string,
    cascadeModels?: Array<{ model: any; foreignKey: string }>
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      // Soft delete cascaded models first
      if (cascadeModels) {
        for (const cascade of cascadeModels) {
          await tx[cascade.model].updateMany({
            where: { [cascade.foreignKey]: id },
            data: { deletedAt: new Date() }
          })
        }
      }
      
      // Soft delete main model
      await tx[model].update({
        where: { id },
        data: { deletedAt: new Date() }
      })
    })
  }
  
  /**
   * Aggregate with caching
   */
  async aggregateWithCache(
    model: any,
    aggregation: any,
    cacheKey: string,
    ttl = 60000
  ): Promise<any> {
    // Try to get from cache first (implement your cache logic)
    // const cached = await cache.get(cacheKey)
    // if (cached) return cached
    
    const result = await model.aggregate(aggregation)
    
    // Cache the result
    // await cache.set(cacheKey, result, ttl)
    
    return result
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer()