import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { cache } from '@/lib/upstash'
import { queueManager, QueueName } from '@awe/ai'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

// GET /api/analytics/dashboard - Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    let startDate: Date
    const endDate = new Date()
    
    switch (range) {
      case '24h':
        startDate = subDays(endDate, 1)
        break
      case '7d':
        startDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        break
      default:
        startDate = subDays(endDate, 7)
    }

    // Try to get cached data first
    const cacheKey = `analytics:dashboard:${range}:${format(endDate, 'yyyy-MM-dd')}`
    if (cache) {
      const cached = await cache.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }
    }

    // Fetch all analytics data in parallel
    const [
      overview,
      resourceMetrics,
      userMetrics,
      systemMetrics,
      searchMetrics
    ] = await Promise.all([
      getOverviewMetrics(startDate, endDate),
      getResourceMetrics(startDate, endDate),
      getUserMetrics(startDate, endDate),
      getSystemMetrics(startDate, endDate),
      getSearchMetrics(startDate, endDate)
    ])

    const analyticsData = {
      overview,
      resourceMetrics,
      userMetrics,
      systemMetrics,
      searchMetrics,
      generatedAt: new Date().toISOString(),
      range
    }

    // Cache for 5 minutes
    if (cache) {
      await cache.set(cacheKey, analyticsData, 300)
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function getOverviewMetrics(startDate: Date, endDate: Date) {
  const [
    totalResources,
    totalUsers,
    totalPatterns,
    activeUsers,
    previousPeriodResources
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.user.count(),
    prisma.extractedPattern.count(),
    prisma.user.count({
      where: {
        lastSignIn: {
          gte: startDate
        }
      }
    }),
    prisma.resource.count({
      where: {
        createdAt: {
          lt: startDate,
          gte: subDays(startDate, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        }
      }
    })
  ])

  const growthRate = previousPeriodResources > 0 
    ? ((totalResources - previousPeriodResources) / previousPeriodResources * 100).toFixed(1)
    : 0

  // Calculate health score based on various metrics
  let healthScore = 100
  
  // Get error rate from cache
  if (cache) {
    const errorRate = (await cache.get('metrics:error_rate:daily') as number) || 0
    if (errorRate > 0.01) healthScore -= 10
    if (errorRate > 0.05) healthScore -= 20
    
    const avgResponseTime = (await cache.get('metrics:response_time:avg') as number) || 0
    if (avgResponseTime > 500) healthScore -= 10
    if (avgResponseTime > 1000) healthScore -= 20
  }

  // Check user engagement
  const engagementRate = (activeUsers / totalUsers) * 100
  if (engagementRate < 30) healthScore -= 15
  if (engagementRate < 10) healthScore -= 25

  return {
    totalResources,
    totalUsers,
    totalPatterns,
    activeUsers,
    growthRate: typeof growthRate === 'string' ? parseFloat(growthRate) : growthRate,
    healthScore: Math.max(0, healthScore)
  }
}

async function getResourceMetrics(startDate: Date, endDate: Date) {
  // Resources by type
  const byType = await prisma.resource.groupBy({
    by: ['type'],
    _count: true
  })

  // Resources by status
  const byStatus = await prisma.resource.groupBy({
    by: ['status'],
    _count: true
  })

  // Get trending resources from telemetry
  const trendingEvents = await prisma.telemetryEvent.findMany({
    where: {
      event: 'resource_viewed',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  })

  // Aggregate views by resource
  const viewCounts = new Map<string, number>()
  trendingEvents.forEach(event => {
    const resourceId = (event.data as any)?.resourceId
    if (resourceId) {
      viewCounts.set(resourceId, (viewCounts.get(resourceId) || 0) + 1)
    }
  })

  // Get top 5 trending resources
  const topResourceIds = Array.from(viewCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const trendingResources = await prisma.resource.findMany({
    where: {
      id: { in: topResourceIds }
    },
    select: {
      id: true,
      title: true
    }
  })

  const trending = trendingResources.map(resource => ({
    id: resource.id,
    title: resource.title,
    views: viewCounts.get(resource.id) || 0,
    growth: Math.floor(Math.random() * 50) // TODO: Calculate actual growth
  }))

  return {
    byType: byType.map(item => ({
      type: item.type,
      count: item._count
    })),
    byStatus: byStatus.map(item => ({
      status: item.status,
      count: item._count
    })),
    trending
  }
}

async function getUserMetrics(startDate: Date, endDate: Date) {
  // Daily active users
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyActive = []
  
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = subDays(endDate, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const count = await prisma.user.count({
      where: {
        lastSignIn: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })
    
    dailyActive.unshift({
      date: format(date, 'MMM dd'),
      count
    })
  }

  // New users
  const newUsers = []
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = subDays(endDate, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })
    
    newUsers.unshift({
      date: format(date, 'MMM dd'),
      count
    })
  }

  // Calculate engagement and retention
  const totalUsers = await prisma.user.count()
  const activeInPeriod = await prisma.user.count({
    where: {
      lastSignIn: {
        gte: startDate
      }
    }
  })

  const returningUsers = await prisma.user.count({
    where: {
      createdAt: {
        lt: startDate
      },
      lastSignIn: {
        gte: startDate
      }
    }
  })

  const engagement = totalUsers > 0 ? Math.round((activeInPeriod / totalUsers) * 100) : 0
  const retention = activeInPeriod > 0 ? Math.round((returningUsers / activeInPeriod) * 100) : 0

  return {
    dailyActive,
    newUsers,
    engagement,
    retention
  }
}

async function getSystemMetrics(startDate: Date, endDate: Date) {
  const systemMetrics: any = {
    apiRequests: [],
    responseTime: [],
    errorRate: 0,
    uptime: 99.9,
    queueHealth: []
  }

  // Get metrics from cache if available
  if (cache) {
    // API metrics
    const hourlyMetrics = []
    for (let i = 0; i < 24; i++) {
      const hour = subDays(endDate, i / 24)
      const hourKey = format(hour, 'yyyy-MM-dd-HH')
      
      const requests = (await cache.get(`metrics:requests:${hourKey}`) as number) || 0
      const errors = (await cache.get(`metrics:errors:${hourKey}`) as number) || 0
      
      hourlyMetrics.unshift({
        time: format(hour, 'HH:mm'),
        count: requests as number,
        errors: errors as number
      })
    }
    systemMetrics.apiRequests = hourlyMetrics

    // Response time metrics
    const responseMetrics = []
    for (let i = 0; i < 24; i++) {
      const hour = subDays(endDate, i / 24)
      
      responseMetrics.unshift({
        time: format(hour, 'HH:mm'),
        avg: Math.random() * 200 + 50, // TODO: Get actual metrics
        p95: Math.random() * 300 + 100,
        p99: Math.random() * 500 + 200
      })
    }
    systemMetrics.responseTime = responseMetrics

    // Error rate
    const totalRequests = (await cache.get('metrics:requests:total') as number) || 1
    const totalErrors = (await cache.get('metrics:errors:total') as number) || 0
    systemMetrics.errorRate = totalErrors / totalRequests
  }

  // Queue health
  if (queueManager) {
    const queueNames = Object.values(QueueName)
    const queueHealthData = []
    
    for (const queueName of queueNames) {
      const stats = await queueManager.getQueueStats(queueName)
      queueHealthData.push({
        queue: queueName,
        ...stats
      })
    }
    
    systemMetrics.queueHealth = queueHealthData
  }

  return systemMetrics
}

async function getSearchMetrics(startDate: Date, endDate: Date) {
  const searchMetrics: any = {
    topQueries: [],
    searchVolume: [],
    clickThrough: 0,
    avgPosition: 0
  }

  // Get search analytics from telemetry
  const searchEvents = await prisma.telemetryEvent.findMany({
    where: {
      event: { in: ['search_performed', 'search_clicked'] },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 1000
  })

  // Aggregate search queries
  const queryCounts = new Map<string, number>()
  let totalSearches = 0
  let totalClicks = 0
  let totalPosition = 0
  let positionCount = 0

  searchEvents.forEach(event => {
    const data = event.data as any
    
    if (event.event === 'search_performed') {
      totalSearches++
      const query = data?.query
      if (query) {
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1)
      }
    } else if (event.event === 'search_clicked') {
      totalClicks++
      if (data?.position) {
        totalPosition += data.position
        positionCount++
      }
    }
  })

  // Top queries
  searchMetrics.topQueries = Array.from(queryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }))

  // Search volume over time
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const searchVolume = []
  
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = subDays(endDate, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const searches = await prisma.telemetryEvent.count({
      where: {
        event: 'search_performed',
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })
    
    searchVolume.unshift({
      date: format(date, 'MMM dd'),
      searches
    })
  }
  searchMetrics.searchVolume = searchVolume

  // Click-through rate
  searchMetrics.clickThrough = totalSearches > 0 
    ? Math.round((totalClicks / totalSearches) * 100) 
    : 0

  // Average position
  searchMetrics.avgPosition = positionCount > 0 
    ? totalPosition / positionCount 
    : 0

  return searchMetrics
}