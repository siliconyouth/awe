import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { SmartScraper } from '@awe/ai'
import { checkRole } from '../../../../lib/auth/rbac'

// POST /api/monitor/run - Manually trigger monitoring for sources
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin or moderator role
    const hasPermission = await checkRole('moderator')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Moderator role or higher required' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse request body
    const body = await request.json()
    const { sourceIds, all = false } = body

    // Get sources to monitor
    let sources
    if (all) {
      // Monitor all active sources
      sources = await db.knowledgeSource.findMany({
        where: { active: true },
        take: 10 // Limit to prevent timeout
      })
    } else if (sourceIds && Array.isArray(sourceIds)) {
      // Monitor specific sources
      sources = await db.knowledgeSource.findMany({
        where: { 
          id: { in: sourceIds },
          active: true
        }
      })
    } else {
      // Monitor sources that haven't been scraped recently
      sources = await db.knowledgeSource.findMany({
        where: {
          active: true,
          OR: [
            { lastScraped: null },
            { 
              lastScraped: { 
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
              } 
            }
          ]
        },
        take: 5 // Limit to prevent timeout
      })
    }

    if (sources.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sources to monitor',
        monitored: 0,
        results: []
      })
    }

    // Initialize scraper
    const scraper = new SmartScraper({
      cacheEnabled: false,
      maxConcurrency: 1,
      timeout: 20000,
      headless: true
    })

    const results = []

    // Monitor each source
    for (const source of sources) {
      try {
        console.log(`Monitoring source: ${source.name} (${source.url})`)
        
        // Scrape the content
        const scrapedData = await scraper.scrape(source.url, {
          extractLinks: true,
          extractImages: true
        })

        // Check if content has changed
        const lastUpdate = await db.knowledgeUpdate.findFirst({
          where: { sourceId: source.id },
          orderBy: { createdAt: 'desc' }
        })

        let changed = false
        if (!lastUpdate) {
          changed = true // First scrape
        } else {
          // Simple change detection - compare content length
          // In production, you'd want to use a more sophisticated comparison
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lastContent = lastUpdate.content as any
          changed = lastContent?.content !== scrapedData.content
        }

        // Save the update
        const update = await db.knowledgeUpdate.create({
          data: {
            sourceId: source.id,
            content: {
              url: scrapedData.url,
              title: scrapedData.title,
              content: scrapedData.content,
              markdown: scrapedData.markdown,
              links: scrapedData.links,
              images: scrapedData.images,
              metadata: scrapedData.metadata
            },
            processed: false,
            scrapedAt: new Date(),
          }
        })

        // Update source metadata
        await db.knowledgeSource.update({
          where: { id: source.id },
          data: { 
            lastScraped: new Date(),
            reliability: source.reliability + (changed ? 0.01 : -0.001) // Adjust reliability
          }
        })

        // If content changed and patterns are enabled, mark for pattern extraction
        if (changed && source.extractPatterns) {
          await db.patternQueue.create({
            data: {
              sourceId: source.id,
              updateId: update.id,
              status: 'PENDING',
              priority: source.priority || 1
            }
          })

          // Optionally, trigger pattern extraction immediately for high-priority sources
          if (source.priority && source.priority >= 3) {
            try {
              const extractResponse = await fetch(`${request.url.replace('/monitor/run', '/patterns/extract')}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Cookie': request.headers.get('cookie') || ''
                },
                body: JSON.stringify({ updateId: update.id })
              })
              
              if (extractResponse.ok) {
                console.log(`Pattern extraction triggered for high-priority source: ${source.name}`)
              }
            } catch (extractError) {
              console.error('Failed to trigger pattern extraction:', extractError)
            }
          }
        }

        results.push({
          sourceId: source.id,
          name: source.name,
          url: source.url,
          status: 'success',
          changed,
          updateId: update.id
        })

      } catch (error) {
        console.error(`Failed to monitor ${source.name}:`, error)
        
        // Update source reliability on error
        await db.knowledgeSource.update({
          where: { id: source.id },
          data: { 
            reliability: Math.max(0, source.reliability - 0.05)
          }
        })

        results.push({
          sourceId: source.id,
          name: source.name,
          url: source.url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Clean up
    await scraper.close()

    // Calculate stats
    const stats = {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      changed: results.filter(r => r.changed).length,
      errors: results.filter(r => r.status === 'error').length
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      monitored: sources.length,
      stats,
      results
    })

  } catch (error) {
    console.error('Manual monitoring failed:', error)
    return NextResponse.json(
      { 
        error: 'Monitoring failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET /api/monitor/run - Get monitoring capabilities
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/monitor/run',
    method: 'POST',
    description: 'Manually trigger monitoring for knowledge sources',
    authentication: 'Required (Clerk)',
    authorization: 'Moderator role or higher',
    body: {
      sourceIds: 'array (optional) - Specific source IDs to monitor',
      all: 'boolean (optional) - Monitor all active sources (limited to 10)'
    },
    response: {
      success: 'boolean',
      timestamp: 'ISO 8601 datetime',
      monitored: 'number - Count of sources monitored',
      stats: {
        total: 'number',
        successful: 'number',
        changed: 'number',
        errors: 'number'
      },
      results: 'array - Individual source results'
    },
    notes: [
      'Without parameters, monitors sources not scraped in 24 hours',
      'Limited to prevent timeouts (5-10 sources per request)',
      'Automatically creates pattern extraction queue for changed content',
      'Adjusts source reliability based on success/failure'
    ]
  })
}