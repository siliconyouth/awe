/**
 * Resource Tag Management API
 * Handles tag operations for specific resources
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ResourceManager } from '@awe/ai/services/resource-manager'
import { TagType } from '@awe/shared/types/resources'
import { z } from 'zod'

const resourceManager = new ResourceManager()

// Validation schemas
const AddTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1).max(20),
  tagType: z.nativeEnum(TagType).optional()
})

const RemoveTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1)
})

/**
 * POST /api/resources/[id]/tags
 * Add tags to a resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resourceId = params.id
    const body = await request.json()

    // Validate input
    const { tagIds, tagType = TagType.USER } = AddTagsSchema.parse(body)

    // Check if resource exists
    const resource = await resourceManager.getResource(resourceId)
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Add tags
    const tags = await resourceManager.addTags(
      resourceId,
      tagIds,
      tagType,
      userId
    )

    // Track tagging action
    await resourceManager.trackUsage(resourceId, 'tag', {
      userId,
      metadata: { tagCount: tagIds.length, tagType }
    })

    return NextResponse.json({ 
      success: true, 
      tags,
      message: `Added ${tags.length} tags to resource`
    })
  } catch (error) {
    console.error('Tag addition error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid tag data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add tags' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/[id]/tags
 * Remove tags from a resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resourceId = params.id
    const body = await request.json()

    // Validate input
    const { tagIds } = RemoveTagsSchema.parse(body)

    // Check if resource exists and user has permission
    const resource = await resourceManager.getResource(resourceId)
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Only author or admin can remove tags
    const userRole = request.headers.get('x-user-role')
    if (resource.authorId !== userId && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only the author or admin can remove tags' },
        { status: 403 }
      )
    }

    // Remove tags
    await resourceManager.removeTags(resourceId, tagIds)

    return NextResponse.json({ 
      success: true,
      message: `Removed ${tagIds.length} tags from resource`
    })
  } catch (error) {
    console.error('Tag removal error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to remove tags' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/resources/[id]/tags/generate
 * Generate AI tags for a resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resourceId = params.id

    // Get resource
    const resource = await resourceManager.getResource(resourceId)
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Only author can regenerate AI tags
    if (resource.authorId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can regenerate AI tags' },
        { status: 403 }
      )
    }

    // Generate AI tags
    const aiTags = await resourceManager.generateAITags(resource)

    // Add the generated tags
    if (aiTags.length > 0) {
      const tagIds = aiTags.map(t => t.id)
      await resourceManager.addTags(
        resourceId,
        tagIds,
        TagType.AI,
        'system'
      )
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${aiTags.length} AI tags`,
      tags: aiTags
    })
  } catch (error) {
    console.error('AI tag generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI tags' },
      { status: 500 }
    )
  }
}