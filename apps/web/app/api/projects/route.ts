import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../lib/database'

// GET /api/projects - List user's projects
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const hasClaudeMd = searchParams.get('hasClaudeMd')

    // Build where clause
    const where: any = {}
    if (hasClaudeMd !== null) {
      where.hasClaudeMd = hasClaudeMd === 'true'
    }

    // Fetch projects
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              dependencies: true,
              recommendations: true,
              templates: true
            }
          }
        }
      }),
      db.project.count({ where })
    ])

    return NextResponse.json({
      success: true,
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create or update project
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      path,
      description,
      type,
      languages,
      frameworks,
      fileCount
    } = body

    // Validate required fields
    if (!name || !path) {
      return NextResponse.json(
        { error: 'Name and path are required' },
        { status: 400 }
      )
    }

    // Check if project already exists
    const existing = await db.project.findUnique({
      where: { path }
    })

    let project
    if (existing) {
      // Update existing project
      project = await db.project.update({
        where: { path },
        data: {
          name,
          description,
          type: type || existing.type,
          languages: languages || existing.languages,
          frameworks: frameworks || existing.frameworks,
          fileCount: fileCount || existing.fileCount,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new project
      project = await db.project.create({
        data: {
          name,
          path,
          description,
          type: type || 'unknown',
          languages: languages || [],
          frameworks: frameworks || [],
          fileCount: fileCount || 0,
          codeComplexity: 0.5,
          maintainabilityScore: 0.7,
          optimizationLevel: 0
        }
      })
    }

    // Track telemetry
    await db.telemetryEvent.create({
      data: {
        event: existing ? 'project_updated' : 'project_created',
        userId,
        projectId: project.id,
        data: {
          name,
          type: project.type,
          languages: project.languages,
          frameworks: project.frameworks
        }
      }
    })

    return NextResponse.json({
      success: true,
      project,
      created: !existing
    })
  } catch (error) {
    console.error('Failed to save project:', error)
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
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
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Delete project (cascade will handle related records)
    await db.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}