import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { checkRole } from '../../../../lib/auth/rbac'

// GET /api/patterns/export - Export patterns in various formats
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const status = searchParams.get('status') || 'APPROVED'
    const category = searchParams.get('category') || undefined
    const sourceId = searchParams.get('sourceId') || undefined

    // Build where clause
    const where: any = {}
    if (status !== 'all') where.status = status
    if (category) where.category = category
    if (sourceId) where.sourceId = sourceId

    // Fetch patterns
    const patterns = await db.extractedPattern.findMany({
      where,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { relevance: 'desc' },
        { confidence: 'desc' }
      ]
    })

    // Format the response based on requested format
    switch (format) {
      case 'json':
        return NextResponse.json({
          exportDate: new Date().toISOString(),
          totalPatterns: patterns.length,
          filters: { status, category, sourceId },
          patterns: patterns.map(p => ({
            id: p.id,
            pattern: p.pattern,
            description: p.description,
            category: p.category,
            confidence: p.confidence,
            relevance: p.relevance,
            source: p.source.name,
            sourceUrl: p.source.url,
            extractedAt: p.extractedAt,
            approvedAt: p.approvedAt,
            metadata: p.metadata
          }))
        })

      case 'markdown':
        const markdown = generateMarkdown(patterns)
        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="patterns-export-${Date.now()}.md"`
          }
        })

      case 'csv':
        const csv = generateCSV(patterns)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="patterns-export-${Date.now()}.csv"`
          }
        })

      case 'claude':
        // Special format optimized for Claude AI context
        const claudeContext = generateClaudeContext(patterns)
        return new NextResponse(claudeContext, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="claude-patterns-${Date.now()}.txt"`
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to export patterns:', error)
    return NextResponse.json(
      { error: 'Failed to export patterns' },
      { status: 500 }
    )
  }
}

// Generate Markdown format
function generateMarkdown(patterns: any[]): string {
  const grouped = patterns.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, any[]>)

  let markdown = `# Extracted Patterns Export\n\n`
  markdown += `**Export Date:** ${new Date().toISOString()}\n`
  markdown += `**Total Patterns:** ${patterns.length}\n\n`

  for (const [category, categoryPatterns] of Object.entries(grouped)) {
    markdown += `## ${category.replace(/_/g, ' ')}\n\n`
    
    for (const pattern of categoryPatterns as any[]) {
      markdown += `### ${pattern.pattern}\n\n`
      if (pattern.description) {
        markdown += `${pattern.description}\n\n`
      }
      markdown += `- **Source:** [${pattern.source.name}](${pattern.source.url})\n`
      markdown += `- **Confidence:** ${(pattern.confidence * 100).toFixed(0)}%\n`
      markdown += `- **Relevance:** ${(pattern.relevance * 100).toFixed(0)}%\n`
      
      // Include examples from metadata if available
      if (pattern.metadata?.examples?.length > 0) {
        markdown += `\n**Examples:**\n`
        for (const example of pattern.metadata.examples) {
          markdown += `\`\`\`\n${example}\n\`\`\`\n`
        }
      }
      
      // Include tags if available
      if (pattern.metadata?.tags?.length > 0) {
        markdown += `\n**Tags:** ${pattern.metadata.tags.join(', ')}\n`
      }
      
      markdown += `\n---\n\n`
    }
  }

  return markdown
}

// Generate CSV format
function generateCSV(patterns: any[]): string {
  const headers = [
    'Pattern',
    'Description',
    'Category',
    'Confidence',
    'Relevance',
    'Source',
    'Source URL',
    'Status',
    'Extracted At',
    'Approved At'
  ]

  const rows = patterns.map(p => [
    `"${p.pattern.replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    p.category,
    p.confidence.toFixed(2),
    p.relevance.toFixed(2),
    `"${p.source.name}"`,
    `"${p.source.url}"`,
    p.status,
    new Date(p.extractedAt).toISOString(),
    p.approvedAt ? new Date(p.approvedAt).toISOString() : ''
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// Generate Claude-optimized context format
function generateClaudeContext(patterns: any[]): string {
  const grouped = patterns.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, any[]>)

  let context = `# Knowledge Base Patterns\n\n`
  context += `This document contains ${patterns.length} verified patterns extracted from trusted sources.\n\n`

  // API Changes and Breaking Changes first (most important)
  const criticalCategories = ['BREAKING_CHANGE', 'API_CHANGE', 'DEPRECATION']
  for (const category of criticalCategories) {
    if (grouped[category]) {
      context += `## ${category.replace(/_/g, ' ')} (CRITICAL)\n\n`
      for (const p of grouped[category]) {
        context += `- ${p.pattern}`
        if (p.description) context += `: ${p.description}`
        context += `\n`
      }
      context += `\n`
    }
  }

  // Best Practices and Guidelines
  const practiceCategories = ['BEST_PRACTICE', 'WARNING', 'SECURITY', 'PERFORMANCE']
  for (const category of practiceCategories) {
    if (grouped[category]) {
      context += `## ${category.replace(/_/g, ' ')}\n\n`
      for (const p of grouped[category]) {
        context += `- ${p.pattern}`
        if (p.description) context += `: ${p.description}`
        if (p.metadata?.examples?.length > 0) {
          context += `\n  Example: ${p.metadata.examples[0]}`
        }
        context += `\n`
      }
      context += `\n`
    }
  }

  // Concepts and Examples
  const learningCategories = ['CONCEPT', 'EXAMPLE']
  for (const category of learningCategories) {
    if (grouped[category]) {
      context += `## ${category.replace(/_/g, ' ')}\n\n`
      for (const p of grouped[category]) {
        context += `### ${p.pattern}\n`
        if (p.description) context += `${p.description}\n`
        if (p.metadata?.examples?.length > 0) {
          context += `\nExample:\n\`\`\`\n${p.metadata.examples[0]}\n\`\`\`\n`
        }
        context += `\n`
      }
    }
  }

  // Other patterns
  if (grouped['OTHER']) {
    context += `## Additional Patterns\n\n`
    for (const p of grouped['OTHER']) {
      context += `- ${p.pattern}`
      if (p.description) context += `: ${p.description}`
      context += `\n`
    }
  }

  context += `\n---\n`
  context += `Generated on ${new Date().toISOString()} from AWE Knowledge Management System\n`

  return context
}

// POST /api/patterns/export - Bulk export with advanced filtering
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role - only moderators and admins can bulk export
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

    const body = await request.json()
    const {
      patternIds,
      categories,
      sources,
      minConfidence = 0,
      minRelevance = 0,
      dateFrom,
      dateTo,
      format = 'json'
    } = body

    // Build complex where clause
    const where: any = {}
    
    if (patternIds?.length > 0) {
      where.id = { in: patternIds }
    }
    
    if (categories?.length > 0) {
      where.category = { in: categories }
    }
    
    if (sources?.length > 0) {
      where.sourceId = { in: sources }
    }
    
    if (minConfidence > 0) {
      where.confidence = { gte: minConfidence }
    }
    
    if (minRelevance > 0) {
      where.relevance = { gte: minRelevance }
    }
    
    if (dateFrom || dateTo) {
      where.extractedAt = {}
      if (dateFrom) where.extractedAt.gte = new Date(dateFrom)
      if (dateTo) where.extractedAt.lte = new Date(dateTo)
    }

    // Fetch patterns with complex filtering
    const patterns = await db.extractedPattern.findMany({
      where,
      include: {
        source: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { status: 'asc' },
        { category: 'asc' },
        { relevance: 'desc' }
      ]
    })

    // Create export based on format
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: userId,
      filters: body,
      totalPatterns: patterns.length,
      patterns
    }

    // Log the export for audit purposes
    console.log(`User ${userId} exported ${patterns.length} patterns in ${format} format`)

    return NextResponse.json({
      success: true,
      ...exportData
    })
  } catch (error) {
    console.error('Failed to bulk export patterns:', error)
    return NextResponse.json(
      { error: 'Failed to export patterns' },
      { status: 500 }
    )
  }
}