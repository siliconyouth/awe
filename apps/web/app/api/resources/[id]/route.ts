/**
 * Resource Management API - Individual Resource Routes
 * Handles operations on specific resources
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ResourceManager } from '@awe/ai'
import { ResourceStatus, ResourceVisibility } from '@awe/shared'
import { z } from 'zod'

const resourceManager = new ResourceManager()

// Content schema matching ResourceContent interface
const ResourceContentSchema = z.object({
  main: z.string(),
  examples: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  relatedResources: z.array(z.string()).optional(),
  supportedVersions: z.array(z.string()).optional()
})

// Validation schemas
const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  content: ResourceContentSchema.optional(),
  categoryId: z.string().optional(),
  visibility: z.nativeEnum(ResourceVisibility).optional(),
  status: z.nativeEnum(ResourceStatus).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  version: z.string().optional()
})

/**
 * GET /api/resources/[id]
 * Get a specific resource by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    const resourceId = resolvedParams.id

    // Get resource
    const resource = await resourceManager.getResource(resourceId)

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check visibility permissions
    if (resource.visibility === 'PRIVATE' && resource.authorId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Track view
    await resourceManager.trackUsage(resourceId, 'view', {
      userId: userId || undefined
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Resource fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/resources/[id]
 * Update a resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const resourceId = resolvedParams.id
    const body = await request.json()

    // Validate input
    const validatedData = UpdateResourceSchema.parse(body)

    // Get existing resource to check permissions
    const existing = await resourceManager.getResource(resourceId)
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existing.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can update this resource' },
        { status: 403 }
      )
    }

    // Update resource
    const updated = await resourceManager.updateResource(resourceId, validatedData)

    // Track update
    await resourceManager.trackUsage(resourceId, 'edit', {
      userId,
      metadata: { changes: Object.keys(validatedData) }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Resource update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/[id]
 * Delete a resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const resourceId = resolvedParams.id

    // Get existing resource to check permissions
    const existing = await resourceManager.getResource(resourceId)
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check ownership or admin role
    const userRole = request.headers.get('x-user-role')
    if (existing.authorId !== userId && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only the author or admin can delete this resource' },
        { status: 403 }
      )
    }

    // Delete resource
    const deleted = await resourceManager.deleteResource(resourceId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resource deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}