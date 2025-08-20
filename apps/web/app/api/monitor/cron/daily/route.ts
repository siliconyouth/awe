import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { queueManager, QueueName, Priority, trackAnalyticsEvent, sendNotification } from '@awe/ai'
import { cache } from '@/lib/upstash'
import { batchIndexResources } from '@/lib/vector-search'

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const dailyTasks = []
    const startTime = Date.now()

    // 1. Aggregate daily analytics
    const analyticsResult = await aggregateDailyAnalytics()
    dailyTasks.push({
      task: 'analytics_aggregation',
      ...analyticsResult
    })

    // 2. Clean up old data
    const cleanupResult = await cleanupOldData()
    dailyTasks.push({
      task: 'data_cleanup',
      ...cleanupResult
    })

    // 3. Re-index resources for search
    const indexingResult = await reindexResources()
    dailyTasks.push({
      task: 'search_reindexing',
      ...indexingResult
    })

    // 4. Generate daily report
    const reportResult = await generateDailyReport()
    dailyTasks.push({
      task: 'daily_report',
      ...reportResult
    })

    // 5. Optimize database
    const optimizationResult = await optimizeDatabase()
    dailyTasks.push({
      task: 'database_optimization',
      ...optimizationResult
    })

    // 6. Check and notify about important metrics
    const notificationResult = await checkAndNotify(reportResult.metrics)
    dailyTasks.push({
      task: 'notifications',
      ...notificationResult
    })

    // Track execution time
    const executionTime = Date.now() - startTime

    // Store daily monitoring results
    if (cache) {
      await cache.set('monitoring:daily:latest', {
        timestamp: new Date().toISOString(),
        tasks: dailyTasks,
        executionTime
      }, 86400) // 24 hours
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frequency: 'DAILY',
      executionTime,
      tasks: dailyTasks
    })
  } catch (error) {
    console.error('Daily cron job failed:', error)
    
    // Try to send error notification
    await sendNotification(
      'webhook',
      process.env.NOTIFICATION_WEBHOOK_URL || '',
      {
        type: 'cron_failure',
        job: 'daily',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    ).catch(console.error)
    
    return NextResponse.json(
      { error: 'Daily cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Aggregate daily analytics
 */
async function aggregateDailyAnalytics() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Resource metrics
    const resourceMetrics = await prisma.resource.groupBy({
      by: ['type', 'status'],
      _count: true,
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // User activity metrics
    const activeUsers = await prisma.user.count({
      where: {
        lastSignIn: {
          gte: yesterday,
          lt: today
        }
      }
    })

    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // Pattern usage metrics
    const patternUsage = await prisma.patternUsage.groupBy({
      by: ['patternId'],
      _count: true,
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      orderBy: {
        _count: {
          patternId: 'desc'
        }
      },
      take: 10
    })

    // API usage metrics (from cache if available)
    let apiMetrics = { requests: 0, errors: 0 }
    if (cache) {
      apiMetrics.requests = (await cache.get('api:requests:daily') as number) || 0
      apiMetrics.errors = (await cache.get('api:errors:daily') as number) || 0
      
      // Reset daily counters
      await cache.set('api:requests:daily', 0)
      await cache.set('api:errors:daily', 0)
    }

    // Store aggregated metrics
    const metrics = {
      date: yesterday.toISOString().split('T')[0],
      resources: resourceMetrics,
      users: {
        active: activeUsers,
        new: newUsers
      },
      patterns: {
        topUsed: patternUsage
      },
      api: apiMetrics
    }

    // Save to database
    await prisma.telemetryEvent.create({
      data: {
        event: 'daily_analytics',
        data: metrics as any,
        createdAt: new Date()
      }
    })

    // Queue for further processing
    await trackAnalyticsEvent('daily_metrics_aggregated', metrics)

    return {
      success: true,
      metrics
    }
  } catch (error) {
    console.error('Analytics aggregation failed:', error)
    return {
      success: false,
      error: 'Failed to aggregate analytics'
    }
  }
}

/**
 * Clean up old data
 */
async function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Clean old telemetry events
    const deletedTelemetry = await prisma.telemetryEvent.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    // Clean old knowledge updates
    const deletedKnowledgeUpdates = await prisma.knowledgeUpdate.deleteMany({
      where: {
        processed: true,
        scrapedAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    // Clean old pattern usage records (keep aggregated data)
    const deletedPatternUsage = await prisma.patternUsage.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    // Clean orphaned resources
    const orphanedResources = await prisma.resource.deleteMany({
      where: {
        AND: [
          { authorId: null },
          { createdAt: { lt: thirtyDaysAgo } }
        ]
      }
    })

    // Clean expired cache entries (if using Redis with TTL, this is automatic)
    if (cache) {
      // Clean specific pattern keys if needed
      await cache.delete('temp:*')
    }

    return {
      success: true,
      cleaned: {
        telemetry: deletedTelemetry.count,
        knowledgeUpdates: deletedKnowledgeUpdates.count,
        patternUsage: deletedPatternUsage.count,
        orphanedResources: orphanedResources.count
      }
    }
  } catch (error) {
    console.error('Data cleanup failed:', error)
    return {
      success: false,
      error: 'Failed to clean up old data'
    }
  }
}

/**
 * Re-index resources for search
 */
async function reindexResources() {
  try {
    // Get resources that need reindexing
    const resources = await prisma.resource.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Updated in last 24 hours
        },
        status: 'PUBLISHED'
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: 100 // Batch size
    })

    if (resources.length === 0) {
      return {
        success: true,
        indexed: 0,
        message: 'No resources to index'
      }
    }

    // Prepare for vector indexing
    const resourcesToIndex = resources.map(resource => ({
      id: resource.id,
      title: resource.title || resource.name || 'Untitled',
      description: resource.description || '',
      content: typeof resource.content === 'string' ? resource.content : JSON.stringify(resource.content),
      type: resource.type as string,
      tags: resource.tags?.map(t => t.tag.name) || []
    }))

    // Batch index
    await batchIndexResources(resourcesToIndex)

    // Resources are now indexed in vector search

    return {
      success: true,
      indexed: resources.length
    }
  } catch (error) {
    console.error('Resource reindexing failed:', error)
    return {
      success: false,
      error: 'Failed to reindex resources'
    }
  }
}

/**
 * Generate daily report
 */
async function generateDailyReport() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Gather metrics for report
    const metrics = {
      // Resource metrics
      totalResources: await prisma.resource.count(),
      newResources: await prisma.resource.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      
      // User metrics
      totalUsers: await prisma.user.count(),
      activeUsers: await prisma.user.count({
        where: {
          lastSignIn: {
            gte: yesterday
          }
        }
      }),
      
      // Pattern metrics
      totalPatterns: await prisma.extractedPattern.count(),
      patternsUsedToday: await prisma.patternUsage.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      
      // System health
      errorRate: 0,
      avgResponseTime: 0
    }

    // Get error rate and response time from cache
    if (cache) {
      metrics.errorRate = (await cache.get('metrics:error_rate:daily') as number) || 0
      metrics.avgResponseTime = (await cache.get('metrics:response_time:avg') as number) || 0
    }

    // Generate report content
    const report = {
      date: yesterday.toISOString().split('T')[0],
      metrics,
      trends: calculateTrends(metrics),
      recommendations: generateRecommendations(metrics)
    }

    // Store report
    if (cache) {
      await cache.set(`report:daily:${report.date}`, report, 604800) // 7 days
    }

    return {
      success: true,
      metrics,
      reportDate: report.date
    }
  } catch (error) {
    console.error('Report generation failed:', error)
    return {
      success: false,
      error: 'Failed to generate report'
    }
  }
}

/**
 * Optimize database
 */
async function optimizeDatabase() {
  try {
    // Run ANALYZE on tables (PostgreSQL)
    await prisma.$executeRaw`ANALYZE resource`
    await prisma.$executeRaw`ANALYZE pattern`
    await prisma.$executeRaw`ANALYZE "user"`
    
    // Update statistics
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    `

    return {
      success: true,
      optimized: true,
      stats: tableStats
    }
  } catch (error) {
    console.error('Database optimization failed:', error)
    return {
      success: false,
      error: 'Failed to optimize database'
    }
  }
}

/**
 * Check metrics and send notifications if needed
 */
async function checkAndNotify(metrics: any) {
  const notifications = []

  try {
    // Check for concerning metrics
    if (metrics.errorRate > 0.05) { // > 5% error rate
      notifications.push({
        type: 'high_error_rate',
        value: metrics.errorRate,
        threshold: 0.05
      })
    }

    if (metrics.avgResponseTime > 1000) { // > 1 second
      notifications.push({
        type: 'slow_response',
        value: metrics.avgResponseTime,
        threshold: 1000
      })
    }

    if (metrics.activeUsers < metrics.totalUsers * 0.1) { // < 10% active
      notifications.push({
        type: 'low_engagement',
        value: metrics.activeUsers,
        expected: metrics.totalUsers * 0.1
      })
    }

    // Send notifications if there are any issues
    if (notifications.length > 0 && process.env.NOTIFICATION_WEBHOOK_URL) {
      await sendNotification(
        'webhook',
        process.env.NOTIFICATION_WEBHOOK_URL,
        {
          type: 'daily_alert',
          date: new Date().toISOString().split('T')[0],
          alerts: notifications,
          metrics
        }
      )
    }

    return {
      success: true,
      notifications: notifications.length,
      alerts: notifications
    }
  } catch (error) {
    console.error('Notification check failed:', error)
    return {
      success: false,
      error: 'Failed to check and notify'
    }
  }
}

/**
 * Calculate trends from metrics
 */
function calculateTrends(metrics: any) {
  // This would compare with previous days' metrics
  // For now, return placeholder trends
  return {
    resourceGrowth: 'stable',
    userEngagement: metrics.activeUsers > 0 ? 'active' : 'low',
    systemHealth: metrics.errorRate < 0.01 ? 'healthy' : 'degraded'
  }
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(metrics: any) {
  const recommendations = []

  if (metrics.errorRate > 0.01) {
    recommendations.push('Investigate and reduce API error rate')
  }

  if (metrics.activeUsers < metrics.totalUsers * 0.3) {
    recommendations.push('Improve user engagement through notifications or new features')
  }

  if (metrics.newResources < 5) {
    recommendations.push('Encourage content creation through prompts or automation')
  }

  if (metrics.avgResponseTime > 500) {
    recommendations.push('Optimize slow API endpoints and database queries')
  }

  return recommendations
}