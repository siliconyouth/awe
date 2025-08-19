import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@awe/database'

// GET /api/admin/sources - List all knowledge sources
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const isAdmin = session?.sessionClaims?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sources = await prisma.knowledgeSource.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(sources)
  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
  }
}

// POST /api/admin/sources - Create a new knowledge source
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const isAdmin = session?.sessionClaims?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    const source = await prisma.knowledgeSource.create({
      data: {
        name: body.name,
        type: body.type,
        url: body.url,
        scrapeConfig: body.scrapeConfig || {},
        frequency: body.frequency || 'weekly',
        active: body.active ?? true,
        reliability: body.reliability || 0.8,
        userId: session.userId
      }
    })
    
    return NextResponse.json(source)
  } catch (error) {
    console.error('Error creating source:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}