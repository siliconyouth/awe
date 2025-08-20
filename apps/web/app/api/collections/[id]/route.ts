import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateCollectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional()
})

// GET /api/collections/[id] - Get a single collection
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            resource: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                },
                _count: {
                  select: {
                    reviews: true,
                    usages: true
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            resources: true
          }
        }
      }
    })
    
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    // Check if collection is private
    if (!collection.isPublic) {
      const { userId } = await auth()
      if (!userId || collection.createdBy !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }
    
    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}

// PUT /api/collections/[id] - Update a collection
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await context.params
    const body = await request.json()
    const data = updateCollectionSchema.parse(body)
    
    // Check ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { createdBy: true }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    if (existing.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update collection
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        resources: {
          include: {
            resource: true
          }
        }
      }
    })
    
    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error updating collection:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await context.params
    
    // Check ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { createdBy: true }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    if (existing.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete collection (cascade will handle CollectionResource entries)
    await prisma.collection.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}