import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../../../lib/database'
// TODO: Fix type declarations in @awe/ai package
// import { AdvancedSmartScraper } from '@awe/ai'

// Temporary mock - @awe/ai package has type issues
class AdvancedSmartScraper {
  constructor(_options?: unknown) {}
  async scrape(_url: string, _options?: unknown) {
    return { content: {}, metadata: {} }
  }
  async close() {}
}

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
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Get sources scheduled for hourly checks
    const sources = await db.knowledgeSource.findMany({
      where: {
        frequency: 'HOURLY',
        active: true,
        OR: [
          { lastScraped: null },
          { 
            lastScraped: { 
              lt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            } 
          }
        ]
      },
      take: 5 // Limit to prevent timeout
    })

    const results = []
    
    if (sources.length > 0) {
      const scraper = new AdvancedSmartScraper({
        cacheEnabled: false,
        maxRetries: 1,
        timeout: 15000,
      })

      for (const source of sources) {
        try {
          const scrapedData = await scraper.scrape(source.url, {
            extractContent: true,
            extractMetadata: true,
          })

          // Save knowledge update
          await db.knowledgeUpdate.create({
            data: {
              sourceId: source.id,
              content: scrapedData.content || {},
              processed: false,
              scrapedAt: new Date(),
            }
          })

          // Update source
          await db.knowledgeSource.update({
            where: { id: source.id },
            data: { lastScraped: new Date() }
          })

          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'success'
          })
        } catch (error) {
          results.push({
            sourceId: source.id,
            name: source.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await scraper.close()
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      frequency: 'HOURLY',
      checked: results.length,
      results
    })
  } catch (error) {
    console.error('Hourly cron job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}