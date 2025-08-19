import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { ClaudeAIService } from '@awe/ai'

// POST /api/patterns/recommend - Get pattern recommendations based on context
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const { 
      projectContext,  // Description of the project
      codeSnippet,     // Optional code to analyze
      problemDescription, // Problem user is trying to solve
      technologies,    // Array of technologies being used
      category         // Specific category to focus on
    } = body

    // Validate input
    if (!projectContext && !codeSnippet && !problemDescription) {
      return NextResponse.json(
        { error: 'Please provide project context, code snippet, or problem description' },
        { status: 400 }
      )
    }

    // Build query for relevant patterns
    const where: any = {
      status: 'APPROVED'
    }
    
    if (category) {
      where.category = category
    }

    // Fetch approved patterns
    const patterns = await db.extractedPattern.findMany({
      where,
      include: {
        source: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { relevance: 'desc' },
        { confidence: 'desc' }
      ],
      take: 100 // Get top 100 patterns for analysis
    })

    if (patterns.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: 'No approved patterns available for recommendations'
      })
    }

    // Use AI to match patterns with context
    const claude = new ClaudeAIService()
    
    const analysisPrompt = `You are an expert developer assistant. Analyze the following context and recommend the most relevant patterns.

Project Context: ${projectContext || 'Not provided'}
Problem Description: ${problemDescription || 'Not provided'}
Technologies: ${technologies?.join(', ') || 'Not specified'}
${codeSnippet ? `\nCode Snippet:\n${codeSnippet}\n` : ''}

Available Patterns (JSON):
${JSON.stringify(patterns.map(p => ({
  id: p.id,
  pattern: p.pattern,
  description: p.description,
  category: p.category,
  source: p.source.name
})), null, 2)}

Please analyze the context and return the 5-10 most relevant patterns that would help with this project.
For each recommended pattern, provide:
1. Why it's relevant to the context
2. How to apply it
3. Priority (high/medium/low)
4. Any specific considerations

Format your response as a JSON array with this structure:
[
  {
    "patternId": "pattern_id",
    "pattern": "pattern name",
    "relevanceScore": 0.0-1.0,
    "priority": "high|medium|low",
    "reasoning": "why this pattern is relevant",
    "applicationGuide": "how to apply this pattern",
    "considerations": "things to watch out for"
  }
]`

    let recommendations = []
    
    try {
      const aiResponse = await claude.chat(analysisPrompt, {
        source: 'pattern-recommendations',
        type: 'recommendation'
      })

      // Parse AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0])
      }
    } catch (aiError) {
      console.error('AI recommendation failed:', aiError)
      
      // Fallback: Simple keyword matching
      recommendations = patterns
        .filter(p => {
          const searchText = `${projectContext} ${problemDescription} ${codeSnippet}`.toLowerCase()
          const patternText = `${p.pattern} ${p.description}`.toLowerCase()
          
          // Check for keyword matches
          const keywords = searchText.split(/\s+/)
          return keywords.some(keyword => 
            keyword.length > 3 && patternText.includes(keyword)
          )
        })
        .slice(0, 10)
        .map(p => ({
          patternId: p.id,
          pattern: p.pattern,
          relevanceScore: p.relevance,
          priority: p.category === 'SECURITY' || p.category === 'BREAKING_CHANGE' ? 'high' : 'medium',
          reasoning: `Matched based on ${p.category.toLowerCase().replace('_', ' ')}`,
          applicationGuide: p.description || 'Apply this pattern to your code',
          considerations: `Source: ${p.source.name}`
        }))
    }

    // Track recommendations
    for (const rec of recommendations) {
      await db.patternUsage.create({
        data: {
          patternId: rec.patternId,
          userId,
          action: 'referenced',
          context: {
            recommendationContext: projectContext,
            relevanceScore: rec.relevanceScore,
            priority: rec.priority
          }
        }
      }).catch(err => console.log('Usage tracking failed:', err))
    }

    // Get full pattern details for recommendations
    const patternIds = recommendations.map((r: any) => r.patternId)
    const fullPatterns = await db.extractedPattern.findMany({
      where: { id: { in: patternIds } },
      include: {
        source: true,
        _count: {
          select: { usage: true }
        }
      }
    })

    // Merge recommendation data with full pattern data
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const fullPattern = fullPatterns.find((p: any) => p.id === rec.patternId)
      return {
        ...rec,
        fullPattern,
        usageCount: fullPattern?._count?.usage || 0
      }
    })

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      context: {
        projectContext,
        problemDescription,
        technologies,
        totalPatternsAnalyzed: patterns.length
      }
    })

  } catch (error) {
    console.error('Pattern recommendation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// GET /api/patterns/recommend - Get popular recommendations
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database not available" }, { status: 503 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause
    const where: any = {
      status: 'APPROVED'
    }
    
    if (category) {
      where.category = category
    }

    // Get most used patterns (popular recommendations)
    const popularPatterns = await db.extractedPattern.findMany({
      where,
      include: {
        source: {
          select: {
            name: true,
            url: true
          }
        },
        _count: {
          select: { 
            usage: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { relevance: 'desc' },
        { confidence: 'desc' }
      ],
      take: limit
    })

    // Calculate popularity score
    const recommendations = popularPatterns.map(pattern => {
      const usageScore = pattern._count.usage * 0.5
      const reviewScore = pattern._count.reviews * 0.3
      const confidenceScore = pattern.confidence * 100 * 0.2
      const popularityScore = usageScore + reviewScore + confidenceScore

      return {
        pattern: {
          id: pattern.id,
          name: pattern.pattern,
          description: pattern.description,
          category: pattern.category,
          source: pattern.source.name
        },
        metrics: {
          usageCount: pattern._count.usage,
          reviewCount: pattern._count.reviews,
          confidence: pattern.confidence,
          relevance: pattern.relevance,
          popularityScore
        },
        recommendation: {
          priority: pattern.category === 'BEST_PRACTICE' ? 'high' : 'medium',
          reason: 'Frequently used and highly rated pattern'
        }
      }
    }).sort((a, b) => b.metrics.popularityScore - a.metrics.popularityScore)

    return NextResponse.json({
      success: true,
      recommendations,
      meta: {
        total: recommendations.length,
        category: category || 'all'
      }
    })

  } catch (error) {
    console.error('Failed to fetch popular recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}