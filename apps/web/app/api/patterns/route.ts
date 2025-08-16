import { NextRequest, NextResponse } from 'next/server'
// import { getPrisma } from '@awe/database' // TODO: Fix database import

// GET /api/patterns - List patterns for review
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Patterns API temporarily disabled" }, { status: 503 })
  /*
  try {
    const db = getPrisma()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'PENDING'
    const type = searchParams.get('type')
    const sourceId = searchParams.get('sourceId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = { status }
    if (type) where.type = type
    if (sourceId) where.sourceId = sourceId
    
    const [patterns, total] = await Promise.all([
      db.extractedPattern.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              url: true,
              category: true
            }
          }
        }
      }),
      db.extractedPattern.count({ where })
    ])
    
    return NextResponse.json({
      patterns,
      total,
      limit,
      offset,
      pending: await db.extractedPattern.count({ where: { status: 'PENDING' } })
    })
  } catch (error) {
    console.error('Failed to list patterns:', error)
    return NextResponse.json(
      { error: 'Failed to list patterns' },
      { status: 500 }
    )
  }
  */
}

// POST /api/patterns/review - Review a pattern
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Patterns API temporarily disabled" }, { status: 503 })
  /*
  try {
    const db = getPrisma()
    const { patternId, action, refinements, feedback } = await request.json()
    
    if (!patternId || !action) {
      return NextResponse.json(
        { error: 'patternId and action are required' },
        { status: 400 }
      )
    }
    
    const pattern = await db.extractedPattern.findUnique({
      where: { id: patternId }
    })
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      )
    }
    
    let updateData: any = {}
    
    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: 'admin' // Replace with actual user ID
        }
        break
        
      case 'reject':
        updateData = {
          status: 'REJECTED',
          refinements: { feedback }
        }
        break
        
      case 'refine':
        updateData = {
          status: 'NEEDS_REFINEMENT',
          refinements: refinements || { feedback }
        }
        
        // If AI service is available, refine with AI
        if (refinements?.useAI) {
          // Call AI refinement service
          // const refined = await aiService.refinePattern(pattern, feedback)
          // updateData.content = refined.content
          // updateData.aiAnalysis = refined.analysis
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    const updated = await db.extractedPattern.update({
      where: { id: patternId },
      data: updateData
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to review pattern:', error)
    return NextResponse.json(
      { error: 'Failed to review pattern' },
      { status: 500 }
    )
  }
  */
}

// DELETE /api/patterns/:id - Delete a pattern
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: "Patterns API temporarily disabled" }, { status: 503 })
  /*
  try {
    const db = getPrisma()
    const { searchParams } = new URL(request.url)
    const patternId = searchParams.get('id')
    
    if (!patternId) {
      return NextResponse.json(
        { error: 'Pattern ID is required' },
        { status: 400 }
      )
    }
    
    await db.extractedPattern.delete({
      where: { id: patternId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete pattern:', error)
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    )
  }
  */
}