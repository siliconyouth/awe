import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'

// POST /api/patterns/usage - Track pattern usage
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional for some actions)
    const { userId } = await auth()
    
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const { patternId, action, context, sessionId, projectId } = body

    // Validate required fields
    if (!patternId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: patternId, action' },
        { status: 400 }
      )
    }

    // Valid actions
    const validActions = ['viewed', 'applied', 'exported', 'shared', 'copied', 'referenced']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Create usage record
    const usage = await db.patternUsage.create({
      data: {
        patternId,
        userId: userId || null,
        projectId: projectId || null,
        action,
        context: context || {},
        sessionId: sessionId || null
      }
    })

    // Update pattern statistics (increment usage count in metadata)
    const pattern = await db.extractedPattern.findUnique({
      where: { id: patternId }
    })

    if (pattern) {
      const metadata = (pattern.metadata as any) || {}
      const usageCount = (metadata.usageCount || 0) + 1
      
      await db.extractedPattern.update({
        where: { id: patternId },
        data: {
          metadata: {
            ...metadata,
            usageCount,
            lastUsed: new Date().toISOString()
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      usage,
      message: 'Usage tracked successfully'
    })
  } catch (error) {
    console.error('Failed to track pattern usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}

// GET /api/patterns/usage - Get pattern usage statistics
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const patternId = searchParams.get('patternId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const timeRange = searchParams.get('timeRange') || '7d' // 1d, 7d, 30d, all

    // Build where clause
    const where: any = {}
    if (patternId) where.patternId = patternId
    if (userId) where.userId = userId
    if (action) where.action = action

    // Add time range filter
    if (timeRange !== 'all') {
      const now = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
      }
      
      where.createdAt = { gte: startDate }
    }

    // If requesting stats for a specific pattern
    if (patternId) {
      // Get detailed usage statistics
      const [totalUsage, uniqueUsers, actionBreakdown, recentUsage] = await Promise.all([
        // Total usage count
        db.patternUsage.count({ where: { patternId } }),
        
        // Unique users count
        db.patternUsage.findMany({
          where: { patternId, userId: { not: null } },
          select: { userId: true },
          distinct: ['userId']
        }),
        
        // Breakdown by action
        db.patternUsage.groupBy({
          by: ['action'],
          where: { patternId },
          _count: { action: true }
        }),
        
        // Recent usage (last 10)
        db.patternUsage.findMany({
          where: { patternId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            userId: true,
            createdAt: true,
            context: true
          }
        })
      ])

      return NextResponse.json({
        success: true,
        stats: {
          totalUsage,
          uniqueUsers: uniqueUsers.length,
          actionBreakdown: actionBreakdown.map(item => ({
            action: item.action,
            count: item._count.action
          })),
          recentUsage
        }
      })
    }

    // General usage query
    const usage = await db.patternUsage.findMany({
      where,
      include: {
        pattern: {
          select: {
            id: true,
            pattern: true,
            category: true,
            source: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get aggregated stats
    const aggregatedStats = await db.patternUsage.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    })

    return NextResponse.json({
      success: true,
      usage,
      stats: {
        total: usage.length,
        byAction: aggregatedStats.map(item => ({
          action: item.action,
          count: item._count.action
        }))
      }
    })
  } catch (error) {
    console.error('Failed to fetch usage statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}

// DELETE /api/patterns/usage - Clear usage data (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This would normally check for admin role
    // const hasPermission = await checkRole('admin')
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const patternId = searchParams.get('patternId')
    const olderThan = searchParams.get('olderThan') // days

    const where: any = {}
    if (patternId) where.patternId = patternId
    
    if (olderThan) {
      const date = new Date()
      date.setDate(date.getDate() - parseInt(olderThan))
      where.createdAt = { lt: date }
    }

    // Delete usage records
    const result = await db.patternUsage.deleteMany({ where })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} usage records`
    })
  } catch (error) {
    console.error('Failed to delete usage data:', error)
    return NextResponse.json(
      { error: 'Failed to delete usage data' },
      { status: 500 }
    )
  }
}