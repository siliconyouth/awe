import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../lib/database'
import { checkRole } from '../../../lib/auth/rbac'

// GET /api/patterns - List patterns with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const sourceId = searchParams.get('sourceId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (sourceId) where.sourceId = sourceId

    // Fetch patterns with pagination
    const [patterns, total] = await Promise.all([
      db.extractedPattern.findMany({
        where,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              url: true,
              type: true
            }
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.extractedPattern.count({ where })
    ])

    return NextResponse.json({
      success: true,
      patterns,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch patterns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    )
  }
}

// POST /api/patterns - Create new pattern (admin/moderator only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const hasPermission = await checkRole('moderator')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Moderator role or higher required' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const {
      sourceId,
      pattern,
      description,
      category,
      confidence = 0.5,
      relevance = 0.5,
      metadata = {}
    } = body

    // Validate required fields
    if (!sourceId || !pattern || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceId, pattern, category' },
        { status: 400 }
      )
    }

    // Create pattern
    const created = await db.extractedPattern.create({
      data: {
        sourceId,
        pattern,
        description,
        category,
        confidence,
        relevance,
        metadata,
        status: 'PENDING',
        extractedBy: userId
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      pattern: created
    })
  } catch (error) {
    console.error('Failed to create pattern:', error)
    return NextResponse.json(
      { error: 'Failed to create pattern' },
      { status: 500 }
    )
  }
}

// DELETE /api/patterns - Delete pattern (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const hasPermission = await checkRole('admin')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin role required' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const patternId = searchParams.get('id')

    if (!patternId) {
      return NextResponse.json(
        { error: 'Pattern ID is required' },
        { status: 400 }
      )
    }

    // Delete pattern (cascade will delete reviews)
    await db.extractedPattern.delete({
      where: { id: patternId }
    })

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete pattern:', error)
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    )
  }
}

// PATCH /api/patterns - Update pattern status
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role
    const hasPermission = await checkRole('moderator')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Moderator role or higher required' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const { patternId, status, confidence, relevance } = body

    if (!patternId) {
      return NextResponse.json(
        { error: 'Pattern ID is required' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = userId
      }
    }
    if (confidence !== undefined) updateData.confidence = confidence
    if (relevance !== undefined) updateData.relevance = relevance

    // Update pattern
    const updated = await db.extractedPattern.update({
      where: { id: patternId },
      data: updateData,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      pattern: updated
    })
  } catch (error) {
    console.error('Failed to update pattern:', error)
    return NextResponse.json(
      { error: 'Failed to update pattern' },
      { status: 500 }
    )
  }
}