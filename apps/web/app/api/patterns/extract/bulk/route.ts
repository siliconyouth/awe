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
        let patterns = []
        
        if (source.type === 'url') {
          // Fetch content from URL
          const response = await fetch(source.content)
          const text = await response.text()
          patterns = await engine.analyzeCode(text)
        } else if (source.type === 'text') {
          patterns = await engine.analyzeCode(source.content)
        } else if (source.type === 'file') {
          // For file uploads, content would be base64 or similar
          patterns = await engine.analyzeCode(source.content)
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
      const savedPatterns = []
      
      for (const pattern of uniquePatterns) {
        try {
          const saved = await prisma.extractedPattern.create({
            data: {
              name: pattern.name,
              type: pattern.type,
              category: pattern.category,
              description: pattern.description,
              code: pattern.code,
              metadata: pattern.metadata || {},
              confidence: pattern.confidence / 100,
              occurrences: pattern.occurrences,
              projectId: null,
              extractedBy: userId
            }
          })
          savedPatterns.push(saved)
        } catch (error) {
          console.error('Error saving pattern:', error)
        }
      }
      
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
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to extract patterns' }, { status: 500 })
  }
}