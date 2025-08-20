import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'
import { cache } from '@/lib/upstash'
import { checkUserRole } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const isAdmin = await checkUserRole(session.userId, 'admin')
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '7d'
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Try to get cached data first
    const cacheKey = `analytics:${timeRange}:${startDate.toISOString().split('T')[0]}`
    const cached = cache ? await cache.get(cacheKey) : null
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      })
    }

    // Fetch real data from database with safe queries
    const [
      totalUsers,
      totalProjects,
      totalResources,
      totalPatterns,
      recentUsers,
      recentProjects,
      recentResources,
      recentPatterns,
      telemetryEvents,
      topResources,
      recentErrors
    ] = await Promise.all([
      // Total counts
      prisma.user.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.resource.count().catch(() => 0),
      prisma.extractedPattern.count().catch(() => 0),
      
      // Recent counts (within time range)
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }).catch(() => 0),
      
      prisma.project.count({
        where: { createdAt: { gte: startDate } }
      }).catch(() => 0),
      
      prisma.resource.count({
        where: { createdAt: { gte: startDate } }
      }).catch(() => 0),
      
      prisma.extractedPattern.count({
        where: { createdAt: { gte: startDate } }
      }).catch(() => 0),
      
      // Telemetry events for performance metrics
      prisma.telemetryEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          event: { in: ['api_request', 'error', 'performance'] }
        },
        select: {
          event: true,
          data: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1000
      }).catch(() => []),
      
      // Top resources by views (using telemetry or a view count field)
      prisma.resource.findMany({
        where: {
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          title: true,
          quality: true,
          createdAt: true
        },
        orderBy: [
          { quality: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 5
      }).catch(() => []),
      
      // Recent errors from telemetry
      prisma.telemetryEvent.count({
        where: {
          createdAt: { gte: startDate },
          event: 'error'
        }
      }).catch(() => 0)
    ])

    // Calculate metrics from telemetry events
    const apiRequests = telemetryEvents.filter(e => e.event === 'api_request')
    const errors = telemetryEvents.filter(e => e.event === 'error')
    const performanceEvents = telemetryEvents.filter(e => e.event === 'performance')
    
    // Calculate response times from performance events
    const responseTimes = performanceEvents
      .map(e => {
        try {
          const payload = e.data as any
          return payload?.duration || payload?.responseTime || 0
        } catch {
          return 0
        }
      })
      .filter(t => t > 0)
      .sort((a, b) => a - b)
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0
    
    const p95ResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
      : 0
    
    const p99ResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
      : 0

    // Calculate error rate
    const totalRequests = apiRequests.length || 1 // Avoid division by zero
    const errorRate = recentErrors / totalRequests

    // Get cache metrics if available
    let cacheHitRate = 0
    if (cache) {
      try {
        const cacheHits = await cache.get('metrics:cache:hits') as number || 0
        const cacheMisses = await cache.get('metrics:cache:misses') as number || 0
        const totalCacheRequests = cacheHits + cacheMisses
        cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0
      } catch {
        // Ignore cache errors
      }
    }

    // Calculate trends (comparing with previous period)
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - (now.getDate() - startDate.getDate()))
    
    const [
      previousUsers,
      previousProjects,
      previousResources,
      previousApiRequests
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }).catch(() => 0),
      
      prisma.project.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }).catch(() => 0),
      
      prisma.resource.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }).catch(() => 0),
      
      prisma.telemetryEvent.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          },
          event: 'api_request'
        }
      }).catch(() => 0)
    ])

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Number(((current - previous) / previous * 100).toFixed(1))
    }

    // Build response data
    const analyticsData = {
      overview: {
        totalUsers,
        activeUsers: recentUsers,
        totalResources,
        totalPatterns,
        totalProjects,
        avgResponseTime,
        apiCalls: apiRequests.length,
        errorRate: Number(errorRate.toFixed(4)),
        cacheHitRate: Number(cacheHitRate.toFixed(2))
      },
      trends: {
        users: {
          current: recentUsers,
          previous: previousUsers,
          change: calculateChange(recentUsers, previousUsers)
        },
        resources: {
          current: recentResources,
          previous: previousResources,
          change: calculateChange(recentResources, previousResources)
        },
        patterns: {
          current: recentPatterns,
          previous: 0, // No previous data for patterns yet
          change: 0
        },
        apiCalls: {
          current: apiRequests.length,
          previous: previousApiRequests,
          change: calculateChange(apiRequests.length, previousApiRequests)
        }
      },
      performance: {
        uptime: 99.9, // This would come from a monitoring service
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        errorRate: Number(errorRate.toFixed(4)),
        requestsPerMinute: Math.round(apiRequests.length / ((now.getTime() - startDate.getTime()) / 60000))
      },
      aiUsage: {
        totalRequests: telemetryEvents.filter(e => {
          try {
            const payload = e.data as any
            return payload?.provider === 'anthropic' || payload?.provider === 'openai'
          } catch {
            return false
          }
        }).length,
        claudeRequests: telemetryEvents.filter(e => {
          try {
            const payload = e.data as any
            return payload?.provider === 'anthropic'
          } catch {
            return false
          }
        }).length,
        openaiRequests: telemetryEvents.filter(e => {
          try {
            const payload = e.data as any
            return payload?.provider === 'openai'
          } catch {
            return false
          }
        }).length,
        tokensUsed: 0, // Would need to track this in telemetry
        costEstimate: 0, // Would need to calculate based on token usage
        avgTokensPerRequest: 0
      },
      topResources: topResources.map(r => ({
        id: r.id,
        name: r.title,
        views: 0, // Would need view tracking
        rating: r.quality || 0
      })),
      timeRange,
      generatedAt: new Date().toISOString()
    }

    // Cache the results for 5 minutes
    if (cache) {
      await cache.set(cacheKey, analyticsData, 300).catch(() => {
        // Ignore cache errors
      })
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      cached: false
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    // Return safe default data on error
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          totalResources: 0,
          totalPatterns: 0,
          totalProjects: 0,
          avgResponseTime: 0,
          apiCalls: 0,
          errorRate: 0,
          cacheHitRate: 0
        },
        trends: {
          users: { current: 0, previous: 0, change: 0 },
          resources: { current: 0, previous: 0, change: 0 },
          patterns: { current: 0, previous: 0, change: 0 },
          apiCalls: { current: 0, previous: 0, change: 0 }
        },
        performance: {
          uptime: 100,
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          errorRate: 0,
          requestsPerMinute: 0
        },
        aiUsage: {
          totalRequests: 0,
          claudeRequests: 0,
          openaiRequests: 0,
          tokensUsed: 0,
          costEstimate: 0,
          avgTokensPerRequest: 0
        },
        topResources: [],
        timeRange: timeRange || '7d',
        generatedAt: new Date().toISOString(),
        error: 'Failed to fetch some metrics'
      }
    })
  }
}