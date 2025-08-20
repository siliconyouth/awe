import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { PatternRecognitionEngine } from '@awe/ai'
import { z } from 'zod'

const extractSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['url', 'text', 'file']),
    content: z.string()
  })),
  options: z.object({
    types: z.array(z.string()).optional(),
    includeAIAnalysis: z.boolean().default(true),
    saveToDatabase: z.boolean().default(false)
  }).optional()
})

// POST /api/patterns/extract/bulk - Extract patterns from multiple sources
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { sources, options } = extractSchema.parse(body)
    
    const engine = new PatternRecognitionEngine()
    const allPatterns = []
    
    // Process each source
    for (const source of sources) {
      try {
        let patterns: any[] = []
        
        if (source.type === 'url') {
          // Fetch content from URL
          // For now, skip URL processing as it needs file-based analysis
          patterns = []
        } else if (source.type === 'text') {
          // Write to temp file and analyze
          const tmpFile = `/tmp/pattern-analysis-${Date.now()}.txt`
          await require('fs').promises.writeFile(tmpFile, source.content)
          patterns = await engine.analyzeFile(tmpFile)
          await require('fs').promises.unlink(tmpFile).catch(() => {})
        } else if (source.type === 'file') {
          // For file uploads, content would be path to file
          patterns = await engine.analyzeFile(source.content)
        }
        
        allPatterns.push(...patterns)
      } catch (error) {
        console.error(`Error processing source: ${source.type}`, error)
      }
    }
    
    // Deduplicate patterns
    const uniquePatterns = Array.from(
      new Map(allPatterns.map(p => [p.name, p])).values()
    )
    
    // Save to database if requested
    if (options?.saveToDatabase) {
      const savedPatterns: any[] = []
      
      // Note: ExtractedPattern requires a sourceId, which we don't have here
      // For now, we'll skip saving to database since we need to create a KnowledgeSource first
      console.log('Skipping database save - needs KnowledgeSource implementation')
      
      return NextResponse.json({ 
        patterns: savedPatterns,
        extracted: uniquePatterns.length,
        saved: savedPatterns.length
      })
    }
    
    return NextResponse.json({ 
      patterns: uniquePatterns,
      extracted: uniquePatterns.length
    })
  } catch (error) {
    console.error('Error extracting patterns:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to extract patterns' }, { status: 500 })
  }
}