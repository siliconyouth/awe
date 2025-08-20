/**
 * Telemetry Utilities
 * Safe helpers for tracking and retrieving telemetry data
 */

import { prisma } from '@awe/database'

export interface TelemetryData {
  eventType: string
  userId?: string
  projectId?: string
  payload?: any
  metadata?: Record<string, any>
}

/**
 * Track a telemetry event safely
 */
export async function trackEvent(data: TelemetryData): Promise<void> {
  try {
    await prisma.telemetryEvent.create({
      data: {
        event: data.eventType,
        userId: data.userId,
        projectId: data.projectId,
        data: data.payload || data.metadata || {},
        createdAt: new Date()
      }
    })
  } catch (error) {
    // Silently fail - telemetry should not break the app
    console.error('Telemetry tracking error:', error)
  }
}

/**
 * Track API request
 */
export async function trackApiRequest(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'api_request',
    userId,
    payload: {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track resource view
 */
export async function trackResourceView(
  resourceId: string,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'resource_view',
    userId,
    payload: {
      resourceId,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track resource download
 */
export async function trackResourceDownload(
  resourceId: string,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'resource_download',
    userId,
    payload: {
      resourceId,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track error event
 */
export async function trackError(
  error: Error,
  context?: Record<string, any>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'error',
    userId,
    payload: {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track performance metric
 */
export async function trackPerformance(
  metric: string,
  value: number,
  metadata?: Record<string, any>
): Promise<void> {
  await trackEvent({
    eventType: 'performance',
    payload: {
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Get telemetry stats for a time range
 */
export async function getTelemetryStats(
  startDate: Date,
  endDate: Date = new Date()
): Promise<{
  totalEvents: number
  apiRequests: number
  errors: number
  avgResponseTime: number
  uniqueUsers: number
}> {
  try {
    const events = await prisma.telemetryEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        event: true,
        userId: true,
        data: true
      }
    })

    const apiRequests = events.filter(e => e.event === 'api_request')
    const errors = events.filter(e => e.event === 'error')
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId))
    
    // Calculate average response time
    const responseTimes = apiRequests
      .map(e => {
        try {
          const payload = e.data as any
          return payload?.responseTime || 0
        } catch {
          return 0
        }
      })
      .filter(t => t > 0)
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    return {
      totalEvents: events.length,
      apiRequests: apiRequests.length,
      errors: errors.length,
      avgResponseTime: Math.round(avgResponseTime),
      uniqueUsers: uniqueUsers.size
    }
  } catch (error) {
    console.error('Failed to get telemetry stats:', error)
    return {
      totalEvents: 0,
      apiRequests: 0,
      errors: 0,
      avgResponseTime: 0,
      uniqueUsers: 0
    }
  }
}

/**
 * Clean up old telemetry events (older than 90 days)
 */
export async function cleanupOldTelemetry(): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    
    const result = await prisma.telemetryEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })
    
    return result.count
  } catch (error) {
    console.error('Failed to cleanup telemetry:', error)
    return 0
  }
}