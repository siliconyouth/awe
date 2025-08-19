import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { ClaudeAIService } from '@awe/ai'
import { checkRole } from '../../../../lib/auth/rbac'

// POST /api/patterns/extract - Extract patterns from scraped content using Claude AI
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

    // Check if user has appropriate role
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
    const { updateId, sourceId, content, forceExtract = false } = body

    // Get the update or source to process
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateToProcess: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sourceInfo: any = null

    if (updateId) {
      // Process specific update
      updateToProcess = await db.knowledgeUpdate.findUnique({
        where: { id: updateId },
        include: { source: true }
      })
      if (!updateToProcess) {
        return NextResponse.json(
          { error: 'Update not found' },
          { status: 404 }
        )
      }
      sourceInfo = updateToProcess.source
    } else if (sourceId) {
      // Process latest update from source
      updateToProcess = await db.knowledgeUpdate.findFirst({
        where: { sourceId },
        orderBy: { scrapedAt: 'desc' },
        include: { source: true }
      })
      if (!updateToProcess) {
        return NextResponse.json(
          { error: 'No updates found for source' },
          { status: 404 }
        )
      }
      sourceInfo = updateToProcess.source
    } else if (content) {
      // Process raw content
      sourceInfo = { name: 'Direct Content', category: 'MANUAL' }
    } else {
      return NextResponse.json(
        { error: 'No content provided for pattern extraction' },
        { status: 400 }
      )
    }

    // Check if already processed (unless forced)
    if (!forceExtract && updateToProcess?.processed) {
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        patterns: []
      })
    }

    // Initialize Claude AI service
    const claude = new ClaudeAIService()

    // Prepare content for analysis
    const contentToAnalyze = content || updateToProcess?.content || {}
    const textContent = typeof contentToAnalyze === 'string' 
      ? contentToAnalyze 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (contentToAnalyze as any).content || (contentToAnalyze as any).markdown || JSON.stringify(contentToAnalyze)

    // Extract patterns using Claude
    const systemPrompt = `You are an expert at analyzing documentation and extracting meaningful patterns, best practices, and important information.
    
    Analyze the provided content and extract:
    1. Key concepts and terminology
    2. Best practices and recommendations
    3. Common patterns and anti-patterns
    4. Important warnings or gotchas
    5. Code examples and their purposes
    6. API changes or breaking changes
    7. Performance tips
    8. Security considerations
    
    Source Category: ${sourceInfo.category}
    Source Name: ${sourceInfo.name}
    
    Format your response as a JSON array of patterns, each with:
    {
      "pattern": "Brief pattern name",
      "description": "Detailed description",
      "category": "One of: API_CHANGE, BEST_PRACTICE, WARNING, EXAMPLE, CONCEPT, PERFORMANCE, SECURITY, OTHER",
      "confidence": 0.0-1.0,
      "relevance": 0.0-1.0,
      "examples": ["optional code examples"],
      "tags": ["relevant", "tags"]
    }`

    const userPrompt = `Extract patterns from this content:\n\n${textContent.substring(0, 10000)}`

    // Call Claude API
    const response = await claude.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    // Parse the response
    const aiContent = response.content[0]
    if (aiContent.type !== 'text') {
      throw new Error('Unexpected AI response format')
    }

    let patterns = []
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        patterns = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: try to parse the entire response
        patterns = JSON.parse(aiContent.text)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Create a single pattern from the response
      patterns = [{
        pattern: 'Content Analysis',
        description: aiContent.text.substring(0, 500),
        category: 'OTHER',
        confidence: 0.5,
        relevance: 0.5,
        tags: ['ai-generated']
      }]
    }

    // Format patterns for response
    const formattedPatterns = patterns.map(pattern => ({
      sourceId: sourceInfo?.id || sourceId,
      updateId: updateToProcess?.id,
      pattern: pattern.pattern || 'Unnamed Pattern',
      description: pattern.description || '',
      category: pattern.category || 'OTHER',
      confidence: pattern.confidence || 0.5,
      relevance: pattern.relevance || 0.5,
      metadata: {
        examples: pattern.examples || [],
        tags: pattern.tags || [],
        extractedBy: 'claude-ai',
        extractedAt: new Date().toISOString()
      },
      status: 'PENDING',
      extractedBy: userId
    }))

    // Mark update as processed
    if (updateToProcess) {
      await db.knowledgeUpdate.update({
        where: { id: updateToProcess.id },
        data: { processed: true }
      })
    }

    // Pattern queue removal would go here if the model existed

    return NextResponse.json({
      success: true,
      message: `Extracted ${formattedPatterns.length} patterns`,
      patterns: formattedPatterns,
      stats: {
        total: patterns.length,
        extracted: formattedPatterns.length
      }
    })

  } catch (error) {
    console.error('Pattern extraction failed:', error)
    return NextResponse.json(
      { 
        error: 'Pattern extraction failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET /api/patterns/extract - Get pattern extraction capabilities
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/patterns/extract',
    method: 'POST',
    description: 'Extract patterns from scraped content using Claude AI',
    authentication: 'Required (Clerk)',
    authorization: 'Moderator role or higher',
    body: {
      updateId: 'string (optional) - Specific update ID to process',
      sourceId: 'string (optional) - Process latest update from source',
      content: 'string (optional) - Raw content to analyze',
      forceExtract: 'boolean (optional) - Force re-extraction even if already processed'
    },
    response: {
      success: 'boolean',
      message: 'string',
      patterns: 'array - Extracted patterns',
      stats: {
        total: 'number',
        saved: 'number',
        failed: 'number'
      }
    },
    notes: [
      'Uses Claude 3.5 Sonnet for pattern extraction',
      'Automatically categorizes patterns',
      'Patterns require manual review before approval',
      'Limited to 10KB of content per request'
    ]
  })
}