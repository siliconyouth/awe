import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  resourceIds: z.array(z.string()).optional()
})

// GET /api/collections - List all collections
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const searchParams = request.nextUrl.searchParams
    const includePrivate = searchParams.get('includePrivate') === 'true'
    
    const where: any = {}
    
    // Only show public collections unless user is authenticated and requests private
    if (!includePrivate || !userId) {
      where.isPublic = true
    } else if (userId) {
      where.OR = [
        { isPublic: true },
        { createdBy: userId }
      ]
    }
    
    const collections = await prisma.collection.findMany({
      where,
      include: {
        resources: {
          include: {
            resource: {
              select: {
                id: true,
                title: true,
                type: true,
                format: true
              }
            }
          }
        },
        _count: {
          select: {
            resources: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(collections)
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = createCollectionSchema.parse(body)
    
    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        createdBy: userId,
        resources: data.resourceIds ? {
          create: data.resourceIds.map(resourceId => ({
            resourceId
          }))
        } : undefined
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
    console.error('Error creating collection:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}