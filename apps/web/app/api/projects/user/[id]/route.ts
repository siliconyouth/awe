import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../../lib/database'

// PATCH /api/projects/user/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, path, type, languages, frameworks, isDefault } = body

    // If changing name, check for duplicates
    if (name && name !== project.name) {
      const duplicate = await db.project.findFirst({
        where: {
          userId,
          name,
          NOT: { id: id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 400 }
        )
      }
    }

    // If setting as default, unset other defaults
    if (isDefault && !project.isDefault) {
      await db.project.updateMany({
        where: {
          userId,
          isDefault: true,
          NOT: { id: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // Update the project
    const updated = await db.project.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(path && { path }),
        ...(type && { type }),
        ...(languages && { languages }),
        ...(frameworks && { frameworks }),
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      project: updated
    })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/user/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Don't allow deleting the last project
    const projectCount = await db.project.count({
      where: { userId }
    })

    if (projectCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete your last project' },
        { status: 400 }
      )
    }

    // Delete the project (cascade will handle related records)
    await db.project.delete({
      where: { id: id }
    })

    // If this was the default, set another as default
    if (project.isDefault) {
      const nextProject = await db.project.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      })

      if (nextProject) {
        await db.project.update({
          where: { id: nextProject.id },
          data: { isDefault: true }
        })
      }
    }

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