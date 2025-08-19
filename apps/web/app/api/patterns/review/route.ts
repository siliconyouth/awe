import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { checkRole } from '../../../../lib/auth/rbac'

// POST /api/patterns/review - Review a pattern
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role - moderator or higher can review
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
    const { patternId, action, feedback } = body

    // Validate required fields
    if (!patternId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: patternId, action' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['APPROVE', 'REJECT', 'REFINE', 'REQUEST_INFO']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Create review record
    const review = await db.patternReview.create({
      data: {
        patternId,
        userId,
        action,
        feedback,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent')
        }
      }
    })

    // Update pattern status based on action
    let newStatus = 'PENDING'
    const updateData: any = {}
    
    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED'
        updateData.approvedAt = new Date()
        updateData.approvedBy = userId
        break
      case 'REJECT':
        newStatus = 'REJECTED'
        break
      case 'REFINE':
      case 'REQUEST_INFO':
        newStatus = 'NEEDS_REFINEMENT'
        break
    }

    updateData.status = newStatus

    // Update the pattern
    const updatedPattern = await db.extractedPattern.update({
      where: { id: patternId },
      data: updateData,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({
      success: true,
      review,
      pattern: updatedPattern,
      message: `Pattern ${action.toLowerCase()}ed successfully`
    })
  } catch (error) {
    console.error('Pattern review failed:', error)
    return NextResponse.json(
      { error: 'Failed to review pattern' },
      { status: 500 }
    )
  }
}

// GET /api/patterns/review - Get review history for a pattern
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
    const patternId = searchParams.get('patternId')

    if (!patternId) {
      return NextResponse.json(
        { error: 'Pattern ID is required' },
        { status: 400 }
      )
    }

    // Fetch reviews
    const reviews = await db.patternReview.findMany({
      where: { patternId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      reviews,
      total: reviews.length
    })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}