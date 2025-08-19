import { NextRequest, NextResponse } from 'next/server'

// Dynamic import to avoid build-time resolution issues
async function getDatabase() {
  try {
    const db = await import('@awe/database')
    return db.getPrisma()
  } catch (error) {
    console.error('Database import failed:', error)
    return null
  }
}

// GET /api/sources - List all knowledge sources
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    interface SourceWhere {
      type?: string
      active?: boolean
    }
    const where: SourceWhere = {}
    if (type) where.type = type
    if (active !== null) where.active = active === 'true'
    
    const [sources, total] = await Promise.all([
      db.knowledgeSource.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              updates: true
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
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const data = await request.json()
    
    // Map category to type if needed
    const sourceType = data.category || data.type || 'DOCUMENTATION'
    
    const source = await db.knowledgeSource.create({
      data: {
        name: data.name,
        url: data.url,
        type: sourceType,
        category: data.category || 'DOCUMENTATION',
        frequency: data.frequency || data.checkFrequency || 'DAILY',
        priority: data.priority || 1,
        extractPatterns: data.extractPatterns !== false, // Default true
        scrapeConfig: data.scrapeConfig || {},
        active: data.active !== false, // Default true
        status: 'ACTIVE',
        reliability: data.reliability || 1.0,
        metadata: {
          addedAt: new Date().toISOString()
        }
      }
    })
    
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('Failed to create source:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}

// PUT /api/sources/:id - Update a knowledge source
export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }
    
    const data = await request.json()
    const source = await db.knowledgeSource.update({
      where: { id },
      data
    })
    
    return NextResponse.json(source)
  } catch (error) {
    console.error('Failed to update source:', error)
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    )
  }
}

// DELETE /api/sources/:id - Delete a knowledge source
export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }
    
    await db.knowledgeSource.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete source:', error)
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    )
  }
}