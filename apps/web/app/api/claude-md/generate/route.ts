import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '../../../../lib/database'
import { ClaudeMdGenerator, ProjectScannerService } from '@awe/ai'
import * as fs from 'fs/promises'
import * as path from 'path'

// POST /api/claude-md/generate - Generate CLAUDE.md for a project
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
      projectPath,
      projectId,
      usePatterns = true,
      customInstructions,
      includeSections,
      excludeSections,
      outputPath,
      optimize = false
    } = body

    // Validate project path
    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      )
    }

    // Scan the project
    const scanner = new ProjectScannerService(projectPath)
    const scanResult = await scanner.scan()

    // Get relevant patterns if requested
    let patterns: any[] = []
    if (usePatterns) {
      // Fetch approved patterns that match project technologies
      const techQuery = scanResult.technologies.map(t => 
        `metadata::text ILIKE '%${t}%'`
      ).join(' OR ')

      patterns = await db.extractedPattern.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            // High relevance patterns
            { relevance: { gte: 0.8 } },
            // Best practices and security patterns
            { category: { in: ['BEST_PRACTICE', 'SECURITY', 'PERFORMANCE'] } }
          ]
        },
        orderBy: [
          { relevance: 'desc' },
          { confidence: 'desc' }
        ],
        take: 50
      })
    }

    // Initialize generator
    const generator = new ClaudeMdGenerator()

    let claudeMdContent: string

    if (optimize && scanResult.existingClaudeMd) {
      // Optimize existing CLAUDE.md
      claudeMdContent = await generator.optimizeExistingClaudeMd(
        scanResult.existingClaudeMd,
        patterns
      )
    } else {
      // Generate new CLAUDE.md
      claudeMdContent = await generator.generateClaudeMd({
        project: {
          name: scanResult.name,
          path: scanResult.path,
          description: `${scanResult.type} project with ${scanResult.languages.join(', ')}`,
          fileCount: scanResult.fileCount,
          optimizationLevel: String(Math.round(patterns.length / 10)) // Simple optimization score as string
        },
        patterns,
        technologies: scanResult.technologies,
        projectType: scanResult.type,
        customInstructions,
        includeSections,
        excludeSections
      })
    }

    // Save to file if output path provided
    if (outputPath) {
      const fullOutputPath = path.isAbsolute(outputPath) 
        ? outputPath 
        : path.join(projectPath, outputPath)
      
      await fs.writeFile(fullOutputPath, claudeMdContent, 'utf-8')
    }

    // Store in database if projectId provided
    if (projectId) {
      // Update or create project record
      await db.project.upsert({
        where: { id: projectId },
        update: {
          hasClaudeMd: true,
          optimizationLevel: patterns.length / 10,
          updatedAt: new Date()
        },
        create: {
          id: projectId,
          userId: userId,
          name: scanResult.name,
          path: scanResult.path,
          type: scanResult.type,
          languages: scanResult.languages,
          frameworks: scanResult.frameworks,
          fileCount: scanResult.fileCount,
          hasClaudeMd: true,
          optimizationLevel: patterns.length / 10,
          codeComplexity: 0.5,
          maintainabilityScore: 0.7
        }
      })

      // Track telemetry
      await db.telemetryEvent.create({
        data: {
          event: 'claude_md_generated',
          userId,
          projectId,
          data: {
            projectType: scanResult.type,
            technologies: scanResult.technologies,
            patternsApplied: patterns.length,
            sectionsIncluded: includeSections || 'all',
            optimized: optimize
          }
        }
      })
    }

    // Track pattern usage
    for (const pattern of patterns) {
      await db.patternUsage.create({
        data: {
          patternId: pattern.id,
          userId,
          projectId,
          action: 'applied',
          context: {
            claudeMdGeneration: true,
            projectType: scanResult.type
          }
        }
      }).catch(() => {}) // Ignore errors
    }

    return NextResponse.json({
      success: true,
      content: claudeMdContent,
      metadata: {
        projectName: scanResult.name,
        projectType: scanResult.type,
        technologies: scanResult.technologies,
        patternsApplied: patterns.length,
        fileCount: scanResult.fileCount,
        hasExisting: !!scanResult.existingClaudeMd,
        optimized: optimize,
        outputPath: outputPath || null
      }
    })

  } catch (error) {
    console.error('CLAUDE.md generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate CLAUDE.md',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/claude-md/generate - Get generation capabilities
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/claude-md/generate',
    method: 'POST',
    description: 'Generate or optimize CLAUDE.md files for projects',
    authentication: 'Required (Clerk)',
    body: {
      projectPath: 'string (required) - Absolute path to project directory',
      projectId: 'string (optional) - Project ID for database tracking',
      usePatterns: 'boolean (optional) - Apply learned patterns (default: true)',
      customInstructions: 'string (optional) - Custom instructions to include',
      includeSections: 'array (optional) - Sections to include',
      excludeSections: 'array (optional) - Sections to exclude',
      outputPath: 'string (optional) - Where to save the file',
      optimize: 'boolean (optional) - Optimize existing CLAUDE.md'
    },
    sections: [
      'overview',
      'architecture',
      'patterns',
      'guidelines',
      'workflows',
      'tools'
    ],
    response: {
      success: 'boolean',
      content: 'string - Generated CLAUDE.md content',
      metadata: {
        projectName: 'string',
        projectType: 'string',
        technologies: 'array',
        patternsApplied: 'number',
        fileCount: 'number',
        hasExisting: 'boolean',
        optimized: 'boolean',
        outputPath: 'string | null'
      }
    }
  })
}