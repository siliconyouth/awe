import { NextRequest, NextResponse } from 'next/server'
import { ClaudeAIService } from '@awe/ai'
import { z } from 'zod'

const analyzeSchema = z.object({
  content: z.string(),
  type: z.string().optional()
})

// POST /api/resources/analyze - Analyze resource content with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, type } = analyzeSchema.parse(body)
    
    const ai = new ClaudeAIService()
    
    // Analyze the content
    const analysis = await ai.analyzeContent({
      content,
      type,
      includeQualityScore: true,
      includeSuggestions: true,
      includeTags: true
    })
    
    return NextResponse.json({
      title: analysis.suggestedTitle,
      description: analysis.suggestedDescription,
      tags: analysis.suggestedTags || [],
      qualityScore: analysis.qualityScore || 0.7,
      improvements: analysis.improvements || [],
      category: analysis.category,
      bestPractices: analysis.bestPractices
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