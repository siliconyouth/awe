import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { batchIndexResources } from '@/lib/vector-search'

// POST /api/resources/reindex - Reindex all resources for semantic search
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { userId, sessionClaims } = await auth()
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all resources
    const resources = await prisma.resource.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (resources.length === 0) {
      return NextResponse.json({ 
        message: 'No resources to index',
        indexed: 0 
      })
    }

    // Prepare resources for indexing
    const resourcesToIndex = resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description || '',
      content: resource.content || '',
      type: resource.type,
      tags: resource.tags?.map(t => t.tag.name) || []
    }))

    // Batch index resources
    const batchSize = 20
    let indexed = 0
    
    for (let i = 0; i < resourcesToIndex.length; i += batchSize) {
      const batch = resourcesToIndex.slice(i, i + batchSize)
      await batchIndexResources(batch)
      indexed += batch.length
      
      // Log progress
      console.log(`Indexed ${indexed}/${resourcesToIndex.length} resources`)
    }

    return NextResponse.json({
      message: 'Resources indexed successfully',
      indexed,
      total: resources.length
    })
  } catch (error) {
    console.error('Reindex error:', error)
    return NextResponse.json({ error: 'Failed to reindex resources' }, { status: 500 })
  }
}