import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@awe/database'

// GET /api/sources - List all knowledge sources
export async function GET(request: NextRequest) {
  try {
    const db = getPrisma()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status
    
    const [sources, total] = await Promise.all([
      db.knowledgeSource.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              versions: true,
              patterns: true
            }
          }
        }
      }),
      db.knowledgeSource.count({ where })
    ])
    
    return NextResponse.json({
      sources,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Failed to list sources:', error)
    return NextResponse.json(
      { error: 'Failed to list sources' },
      { status: 500 }
    )
  }
}

// POST /api/sources - Create a new knowledge source
export async function POST(request: NextRequest) {
  try {
    const db = getPrisma()
    const data = await request.json()
    
    // Validate required fields
    if (!data.url || !data.name || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields: url, name, category' },
        { status: 400 }
      )
    }
    
    // Check if URL already exists
    const existing = await db.knowledgeSource.findUnique({
      where: { url: data.url }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Source with this URL already exists' },
        { status: 409 }
      )
    }
    
    // Create source
    const source = await db.knowledgeSource.create({
      data: {
        url: data.url,
        name: data.name,
        description: data.description,
        context: data.context,
        category: data.category,
        tags: data.tags || [],
        importance: data.importance || 5,
        checkFrequency: data.checkFrequency || 'DAILY',
        selectors: data.selectors,
        extractionRules: data.extractionRules,
        aiPrompt: data.aiPrompt,
        status: 'ACTIVE'
      }
    })
    
    // Trigger initial check
    if (data.checkNow) {
      // Queue initial monitoring job
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds: [source.id] })
      })
    }
    
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('Failed to create source:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}

// PATCH /api/sources - Bulk update sources
export async function PATCH(request: NextRequest) {
  try {
    const db = getPrisma()
    const { sourceIds, updates } = await request.json()
    
    if (!sourceIds || !Array.isArray(sourceIds)) {
      return NextResponse.json(
        { error: 'sourceIds array is required' },
        { status: 400 }
      )
    }
    
    // Update sources
    const result = await db.knowledgeSource.updateMany({
      where: { id: { in: sourceIds } },
      data: updates
    })
    
    return NextResponse.json({ 
      updated: result.count 
    })
  } catch (error) {
    console.error('Failed to update sources:', error)
    return NextResponse.json(
      { error: 'Failed to update sources' },
      { status: 500 }
    )
  }
}