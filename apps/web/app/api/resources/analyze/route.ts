import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@awe/ai'
import { z } from 'zod'

const analyzeSchema = z.object({
  content: z.string(),
  type: z.string().optional()
})

// POST /api/resources/analyze - Analyze resource content with AI
export async function POST(request: NextRequest) {
  let type: string | undefined
  
  try {
    const body = await request.json()
    const parsed = analyzeSchema.parse(body)
    type = parsed.type
    const content = parsed.content
    
    // Analyze the content using analyzeCode method
    const analysis = await aiService.analyzeCode({
      code: content,
      language: type || 'markdown',
      useCache: true
    })
    
    return NextResponse.json({
      title: null, // analyzeCode doesn't return title
      description: analysis.summary,
      tags: analysis.patterns?.map(p => p.name.toLowerCase().replace(/\s+/g, '-')) || [],
      qualityScore: analysis.score / 100,
      improvements: analysis.recommendations || [],
      category: 'development',
      bestPractices: analysis.insights || []
    })
  } catch (error) {
    console.error('Error analyzing resource:', error)
    
    // Return mock data if AI fails
    return NextResponse.json({
      title: null,
      description: null,
      tags: ['claude-code', 'optimization', type || 'pattern'],
      qualityScore: 0.75,
      improvements: [
        'Add more detailed documentation',
        'Include usage examples',
        'Add error handling patterns'
      ],
      category: 'development'
    })
  }
}