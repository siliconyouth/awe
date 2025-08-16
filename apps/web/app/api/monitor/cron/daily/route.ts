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
    
    // Get sources scheduled for daily checks
    const sources = await db.knowledgeSource.findMany({
      where: {
        checkFrequency: 'DAILY',
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

    // Send summary notification if configured
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      const changed = results.filter(r => r.status === 'changed').length
      const errors = results.filter(r => r.status === 'error').length
      
      await fetch(process.env.NOTIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_monitoring',
          timestamp: new Date().toISOString(),
          summary: {
            total: sources.length,
            changed,
            unchanged: sources.length - changed - errors,
            errors
          },
          results
        })
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frequency: 'DAILY',
      checked: sources.length,
      results
    })
  } catch (error) {
    console.error('Daily cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    )
  }
}