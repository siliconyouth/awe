import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'
import { Redis } from '@upstash/redis'
import { Index } from '@upstash/vector'
import algoliasearch from 'algoliasearch'
import { cache } from '@/lib/upstash'
import { vectorIndex } from '@/lib/vector-search-modern'
import { queueManager } from '@awe/ai/services/queue-service-upstash'

interface ServiceCheck {
  name: string
  check: () => Promise<{
    status: 'operational' | 'degraded' | 'down'
    latency?: number
    error?: string
    metrics?: any
  }>
}

/**
 * GET /api/admin/services/health
 * Check health status of all integrated services
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Define service checks
    const services: ServiceCheck[] = [
      {
        name: 'Upstash Redis',
        check: async () => {
          const start = Date.now()
          try {
            if (!cache) {
              return { status: 'down', error: 'Not configured' }
            }
            
            // Test basic operations
            const testKey = `health:check:${Date.now()}`
            await cache.set(testKey, 'test', 10)
            const value = await cache.get(testKey)
            await cache.del(testKey)
            
            if (value !== 'test') {
              return { status: 'degraded', error: 'Read/write test failed' }
            }

            // Get metrics
            const metrics = {
              requests: await cache.get('metrics:requests:total') || 0,
              errors: await cache.get('metrics:errors:total') || 0,
              cacheHit: await cache.get('metrics:cache:hit:rate') || 0
            }

            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Upstash Vector',
        check: async () => {
          const start = Date.now()
          try {
            if (!vectorIndex) {
              return { status: 'down', error: 'Not configured' }
            }

            // Test vector operations
            const stats = await vectorIndex.info()
            
            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics: {
                vectorCount: stats.vectorCount,
                dimension: stats.dimension
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Algolia Search',
        check: async () => {
          const start = Date.now()
          try {
            const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
            const apiKey = process.env.ALGOLIA_ADMIN_API_KEY

            if (!appId || !apiKey) {
              return { status: 'down', error: 'Not configured' }
            }

            const client = algoliasearch(appId, apiKey)
            const index = client.initIndex('resources')
            
            // Test search
            const results = await index.search('', { hitsPerPage: 1 })
            
            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics: {
                totalRecords: results.nbHits,
                indexSize: results.nbPages
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Supabase',
        check: async () => {
          const start = Date.now()
          try {
            // Test database connection
            await prisma.$queryRaw`SELECT 1`
            
            // Get database metrics
            const [userCount, resourceCount, patternCount] = await Promise.all([
              prisma.user.count(),
              prisma.resource.count(),
              prisma.pattern.count()
            ])

            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics: {
                users: userCount,
                resources: resourceCount,
                patterns: patternCount
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Clerk Auth',
        check: async () => {
          const start = Date.now()
          try {
            const hasPublicKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            const hasSecretKey = !!process.env.CLERK_SECRET_KEY
            
            if (!hasPublicKey || !hasSecretKey) {
              return { status: 'down', error: 'Not configured' }
            }

            // Test by checking current auth
            const session = await auth()
            
            return {
              status: session ? 'operational' : 'degraded',
              latency: Date.now() - start,
              metrics: {
                authenticated: !!session
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Browserless',
        check: async () => {
          const start = Date.now()
          try {
            const apiKey = process.env.BROWSERLESS_API_KEY
            const url = process.env.BROWSERLESS_URL

            if (!apiKey && !url) {
              return { status: 'down', error: 'Not configured' }
            }

            // For now, just check configuration
            // In production, you'd make a test request
            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics: {
                configured: true
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'Queue System',
        check: async () => {
          const start = Date.now()
          try {
            if (!queueManager) {
              return { status: 'down', error: 'Not initialized' }
            }

            // Get queue statistics
            const stats = await queueManager.getQueueStats('queue:resource-processing')
            
            return {
              status: 'operational',
              latency: Date.now() - start,
              metrics: {
                queueDepth: stats.pending,
                processing: stats.processing,
                completed: stats.completed,
                failed: stats.failed
              }
            }
          } catch (error) {
            return {
              status: 'degraded',
              error: error.message,
              latency: Date.now() - start
            }
          }
        }
      },
      {
        name: 'WebSocket',
        check: async () => {
          // WebSocket health would be checked from the client side
          // Here we just check if it's configured
          return {
            status: 'operational',
            metrics: {
              configured: true
            }
          }
        }
      },
      {
        name: 'Edge Config',
        check: async () => {
          try {
            const hasConfig = !!process.env.EDGE_CONFIG
            
            if (!hasConfig) {
              return { status: 'down', error: 'Not configured' }
            }

            return {
              status: 'operational',
              metrics: {
                configured: true
              }
            }
          } catch (error) {
            return {
              status: 'down',
              error: error.message
            }
          }
        }
      }
    ]

    // Run all health checks in parallel
    const healthChecks = await Promise.all(
      services.map(async (service) => {
        const result = await service.check()
        return {
          name: service.name,
          ...result,
          lastCheck: new Date().toISOString()
        }
      })
    )

    // Calculate overall health
    const downCount = healthChecks.filter(s => s.status === 'down').length
    const degradedCount = healthChecks.filter(s => s.status === 'degraded').length
    
    let overall: 'healthy' | 'degraded' | 'critical'
    if (downCount > 2 || (downCount > 0 && services.length <= 3)) {
      overall = 'critical'
    } else if (downCount > 0 || degradedCount > 2) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    // Calculate uptime (mock data for now)
    const servicesWithUptime = healthChecks.map(service => ({
      ...service,
      uptime: service.status === 'operational' ? 99.9 : 
              service.status === 'degraded' ? 95.0 : 0
    }))

    const response = {
      overall,
      services: servicesWithUptime,
      timestamp: new Date().toISOString()
    }

    // Cache the result for 30 seconds
    if (cache) {
      await cache.set('health:dashboard', response, 30)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: 'Failed to check service health' },
      { status: 500 }
    )
  }
}