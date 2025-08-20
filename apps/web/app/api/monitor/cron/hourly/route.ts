import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { SmartScraper } from '@awe/ai'
import { queueManager, QueueName, Priority } from '@awe/ai/services/queue-service'
import { cache } from '@/lib/upstash'
import { sendNotification } from '@awe/ai/services/queue-service'

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
    // Track monitoring execution
    if (cache) {
      await cache.incr('monitoring:hourly:executions')
    }

    const monitoringTasks = []

    // 1. Check resource freshness
    const staleResources = await prisma.resource.findMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
        },
        status: 'PUBLISHED'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        sourceUrl: true
      }
    })

    if (staleResources.length > 0) {
      // Queue updates for stale resources
      for (const resource of staleResources) {
        await queueManager.addJob(
          QueueName.RESOURCE_PROCESSING,
          'check-freshness',
          { resourceId: resource.id, sourceUrl: resource.sourceUrl },
          { priority: Priority.LOW }
        )
      }
      monitoringTasks.push({
        task: 'resource_freshness',
        count: staleResources.length,
        status: 'queued'
      })
    }

    // 2. Monitor knowledge sources
    const sources = await prisma.knowledgeSource.findMany({
      where: {
        frequency: 'HOURLY',
        active: true,
        OR: [
          { lastScraped: null },
          { 
            lastScraped: { 
              lt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            } 
          }
        ]
      },
      take: 5 // Limit to prevent timeout
    })

    const results = []
    
    if (sources.length > 0) {
      const scraper = new SmartScraper({
        cacheEnabled: false,
        maxConcurrency: 1,
        timeout: 15000,
      })

      for (const source of sources) {
        try {
          const scrapedData = await scraper.scrape(source.url)

          // Save knowledge update
          await db.knowledgeUpdate.create({
            data: {
              sourceId: source.id,
              content: scrapedData.content || {},
              processed: false,
              scrapedAt: new Date(),
            }
          })

          // Update source
          await db.knowledgeSource.update({
            where: { id: source.id },
            data: { lastScraped: new Date() }
          })

          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'success'
          })
        } catch (error) {
          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await scraper.close()
      
      monitoringTasks.push({
        task: 'knowledge_sources',
        checked: results.length,
        results
      })
    }

    // 3. Check system health
    const systemHealth = await checkSystemHealth()
    monitoringTasks.push({
      task: 'system_health',
      ...systemHealth
    })

    // 4. Analytics snapshot
    const analyticsSnapshot = await captureAnalyticsSnapshot()
    monitoringTasks.push({
      task: 'analytics',
      ...analyticsSnapshot
    })

    // 5. Check for any critical alerts
    if (systemHealth.hasIssues) {
      await sendNotification(
        'webhook',
        process.env.NOTIFICATION_WEBHOOK_URL || '',
        {
          type: 'system_alert',
          severity: 'warning',
          issues: systemHealth.issues,
          timestamp: new Date().toISOString()
        }
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frequency: 'HOURLY',
      tasks: monitoringTasks
    })
  } catch (error) {
    console.error('Hourly cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Check system health metrics
 */
async function checkSystemHealth() {
  const issues = []
  let hasIssues = false

  try {
    // Check database connection
    const dbCheck = await prisma.$queryRaw`SELECT 1`
    
    // Check Redis/cache availability
    const cacheAvailable = cache !== null
    if (!cacheAvailable) {
      issues.push('Cache service unavailable')
    }

    // Check queue health
    if (queueManager) {
      const queueHealth = await queueManager.getQueueHealth()
      const unhealthyQueues = Object.entries(queueHealth.queues)
        .filter(([_, status]: [string, any]) => !status.isHealthy)
        .map(([name]) => name)
      
      if (unhealthyQueues.length > 0) {
        issues.push(`Unhealthy queues: ${unhealthyQueues.join(', ')}`)
        hasIssues = true
      }
    }

    // Check error rates (from cache if available)
    if (cache) {
      const errorCount = await cache.get('errors:api:count') || 0
      if (errorCount > 100) {
        issues.push(`High error rate: ${errorCount} errors in last hour`)
        hasIssues = true
      }
    }

    return {
      database: 'healthy',
      cache: cacheAvailable ? 'healthy' : 'degraded',
      queues: hasIssues ? 'degraded' : 'healthy',
      issues,
      hasIssues
    }
  } catch (error) {
    return {
      database: 'unhealthy',
      cache: 'unknown',
      queues: 'unknown',
      issues: ['System health check failed'],
      hasIssues: true
    }
  }
}

/**
 * Capture analytics snapshot
 */
async function captureAnalyticsSnapshot() {
  try {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get resource statistics
    const resourceStats = await prisma.resource.groupBy({
      by: ['type'],
      _count: true,
      where: {
        createdAt: { gte: hourAgo }
      }
    })

    // Get user activity
    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: { gte: hourAgo }
      }
    })

    // Get pattern usage
    const patternUsage = await prisma.patternUsage.count({
      where: {
        createdAt: { gte: hourAgo }
      }
    })

    // Store snapshot in cache for dashboard
    if (cache) {
      await cache.set('analytics:hourly:snapshot', {
        timestamp: now.toISOString(),
        resources: resourceStats,
        activeUsers,
        patternUsage
      }, 3600)
    }

    return {
      resources: resourceStats.length,
      activeUsers,
      patternUsage,
      period: 'last_hour'
    }
  } catch (error) {
    console.error('Analytics snapshot failed:', error)
    return {
      error: 'Failed to capture analytics',
      period: 'last_hour'
    }
  }
}