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
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const data = await request.json()
    
    const source = await db.knowledgeSource.create({
      data: {
        name: data.name,
        url: data.url,
        category: data.category || 'OTHER',
        checkFrequency: data.checkFrequency || 'DAILY',
        extractionRules: data.extractionRules || {},
        authentication: data.authentication || null,
        metadata: data.metadata || {},
        status: 'ACTIVE'
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