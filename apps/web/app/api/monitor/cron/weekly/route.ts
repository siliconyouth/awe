import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@awe/database'
import { KnowledgeMonitor } from '@/lib/monitoring/knowledge-monitor'
import { ContentAnalyzer } from '@/lib/ai/content-analyzer'

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const db = getPrisma()
    
    // Get sources scheduled for weekly checks
    const sources = await db.knowledgeSource.findMany({
      where: {
        checkFrequency: 'WEEKLY',
        status: 'ACTIVE'
      }
    })

    // Initialize monitor with AI service if configured
    const aiService = process.env.OPENAI_API_KEY
      ? new ContentAnalyzer(process.env.OPENAI_API_KEY)
      : undefined

    const monitor = new KnowledgeMonitor({ db, aiService })
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
        console.error(`Failed to check source ${source.id}:`, error)
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

    // Generate weekly analytics report
    const weeklyStats = await db.knowledgeVersion.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const pendingPatterns = await db.extractedPattern.count({
      where: { status: 'PENDING' }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frequency: 'WEEKLY',
      checked: sources.length,
      results,
      analytics: {
        weeklyVersions: weeklyStats,
        pendingPatterns
      }
    })
  } catch (error) {
    console.error('Weekly cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    )
  }
}