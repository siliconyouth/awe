import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'

// TODO: Implement KnowledgeMonitor

// GET /api/monitor - Get monitoring status
export async function GET(_request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }
    
    const sources = await db.knowledgeSource.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        active: true,
        lastScraped: true,
        frequency: true,
        reliability: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    const stats = {
      total: sources.length,
      active: sources.filter(s => s.active).length,
      inactive: sources.filter(s => !s.active).length,
      reliable: sources.filter(s => s.reliability >= 0.8).length
    }
    
    return NextResponse.json({ sources, stats })
  } catch (error) {
    console.error('Failed to get monitoring status:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    )
  }
}

// POST /api/monitor - Trigger monitoring for specific sources
export async function POST(_request: NextRequest) {
  return NextResponse.json({ message: "Monitor API temporarily disabled" }, { status: 503 })
  /*
  try {
    const { sourceIds, frequency } = await request.json()
    // const db = getPrisma() // TODO: Fix database
    
    // Get sources to monitor
    const sources = await db.knowledgeSource.findMany({
      where: sourceIds 
        ? { id: { in: sourceIds } }
        : frequency 
          ? { checkFrequency: frequency, status: 'ACTIVE' }
          : { status: 'ACTIVE' }
    })
    
    // Initialize monitor
    const monitor = new KnowledgeMonitor({ db })
    const results = []
    
    // Check each source
    for (const source of sources) {
      try {
        const result = await monitor.checkSource(source)
        
        if (result.changed) {
          await monitor.processChange(source, result)
          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'changed',
            changeType: result.changeType
          })
        } else {
          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'unchanged'
          })
        }
      } catch (error) {
        results.push({
          sourceId: source.id,
          name: source.name,
          status: 'error',
          error: error.message
        })
      }
    }
    
    // Cleanup
    await monitor.cleanup()
    
    return NextResponse.json({ 
      monitored: sources.length,
      results 
    })
  } catch (error) {
    console.error('Monitoring failed:', error)
    return NextResponse.json(
      { error: 'Monitoring failed' },
      { status: 500 }
    )
  }
  */
}