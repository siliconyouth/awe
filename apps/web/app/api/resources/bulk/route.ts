import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { ResourceType, ResourceStatus, ResourceVisibility } from '@awe/shared'

const bulkActionSchema = z.object({
  action: z.enum(['delete', 'update', 'tag', 'export']),
  resourceIds: z.array(z.string()).min(1),
  data: z.any().optional()
})

const bulkUpdateSchema = z.object({
  status: z.nativeEnum(ResourceStatus).optional(),
  visibility: z.nativeEnum(ResourceVisibility).optional(),
  verified: z.boolean().optional()
})

const bulkTagSchema = z.object({
  addTags: z.array(z.string()).optional(),
  removeTags: z.array(z.string()).optional()
})

// POST /api/resources/bulk - Perform bulk operations on resources
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, resourceIds, data } = bulkActionSchema.parse(body)
    
    // Verify user has permission (simplified - in production, check roles)
    // For now, we'll just ensure they're authenticated
    
    switch (action) {
      case 'delete': {
        // Bulk delete resources
        const result = await prisma.resource.deleteMany({
          where: {
            id: { in: resourceIds }
          }
        })
        
        return NextResponse.json({ 
          success: true,
          deleted: result.count
        })
      }
      
      case 'update': {
        // Bulk update resources
        const updateData = bulkUpdateSchema.parse(data)
        
        const dataToUpdate: any = {
          updatedAt: new Date()
        }
        
        if (updateData.status !== undefined) {
          dataToUpdate.status = updateData.status
        }
        if (updateData.visibility !== undefined) {
          dataToUpdate.visibility = updateData.visibility
        }
        if (updateData.verified !== undefined) {
          dataToUpdate.verified = updateData.verified
        }
        
        const result = await prisma.resource.updateMany({
          where: {
            id: { in: resourceIds }
          },
          data: dataToUpdate
        })
        
        return NextResponse.json({ 
          success: true,
          updated: result.count
        })
      }
      
      case 'tag': {
        // Bulk add/remove tags
        const tagData = bulkTagSchema.parse(data)
        
        if (tagData.addTags && tagData.addTags.length > 0) {
          // Create tags if they don't exist
          const tagPromises = tagData.addTags.map(async (tagName) => {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-')
            return prisma.tag.upsert({
              where: { slug },
              create: { 
                name: tagName,
                slug,
                category: 'general'
              },
              update: {}
            })
          })
          
          const tags = await Promise.all(tagPromises)
          
          // Add tags to resources
          const resourceTagPromises = resourceIds.flatMap(resourceId =>
            tags.map(tag =>
              prisma.resourceTag.upsert({
                where: {
                  resourceId_tagId: {
                    resourceId,
                    tagId: tag.id
                  }
                },
                create: {
                  resourceId,
                  tagId: tag.id,
                  addedBy: userId
                },
                update: {}
              })
            )
          )
          
          await Promise.all(resourceTagPromises)
        }
        
        if (tagData.removeTags && tagData.removeTags.length > 0) {
          // Find tag IDs
          const tags = await prisma.tag.findMany({
            where: {
              name: { in: tagData.removeTags }
            },
            select: { id: true }
          })
          
          const tagIds = tags.map(t => t.id)
          
          // Remove tags from resources
          await prisma.resourceTag.deleteMany({
            where: {
              resourceId: { in: resourceIds },
              tagId: { in: tagIds }
            }
          })
        }
        
        return NextResponse.json({ 
          success: true,
          resourcesProcessed: resourceIds.length
        })
      }
      
      case 'export': {
        // Bulk export resources
        const resources = await prisma.resource.findMany({
          where: {
            id: { in: resourceIds }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        })
        
        const exportData = resources.map(resource => ({
          id: resource.id,
          title: resource.title,
          description: resource.description,
          type: resource.type,
          fileType: resource.fileType,
          content: resource.content,
          tags: resource.tags.map(t => t.tag.name),
          author: resource.authorId,
          sourceUrl: resource.sourceUrl,
          qualityScore: (resource.metadata as any)?.qualityScore || 0,
          status: resource.status,
          visibility: resource.visibility
        }))
        
        return NextResponse.json(exportData)
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 })
  }
}