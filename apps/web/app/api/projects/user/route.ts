import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'

// GET /api/projects/user - Get user's projects
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Fetch user's projects
    const projects = await db.project.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            dependencies: true,
            recommendations: true,
            templates: true,
            telemetryEvents: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      projects
    })
  } catch (error) {
    console.error('Failed to fetch user projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects/user - Create new project
export async function POST(request: NextRequest) {
  try {
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
      description,
      path,
      type = 'unknown',
      languages = [],
      frameworks = [],
      isDefault = false
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Check if name already exists for this user
    const existing = await db.project.findFirst({
      where: {
        userId,
        name
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.project.updateMany({
        where: {
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Create the project
    const project = await db.project.create({
      data: {
        userId,
        name,
        description,
        path: path || `/projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
        type,
        languages,
        frameworks,
        fileCount: 0,
        codeComplexity: 0.5,
        maintainabilityScore: 0.7,
        optimizationLevel: 0,
        isDefault
      }
    })

    // Track telemetry
    await db.telemetryEvent.create({
      data: {
        event: 'project_created',
        userId,
        projectId: project.id,
        data: {
          name,
          type,
          languages,
          frameworks
        }
      }
    })

    return NextResponse.json({
      success: true,
      project
    })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}