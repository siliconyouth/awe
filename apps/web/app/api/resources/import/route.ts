import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { ResourceProcessor } from '@awe/ai/services/resource-processor'

// POST /api/resources/import - Import resources from a knowledge source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceId, resources } = body
    
    if (!sourceId || !resources || !Array.isArray(resources)) {
      return NextResponse.json(
        { error: 'sourceId and resources array required' },
        { status: 400 }
      )
    }
    
    // Verify the knowledge source exists
    const knowledgeSource = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId }
    })
    
    if (!knowledgeSource) {
      return NextResponse.json(
        { error: 'Knowledge source not found' },
        { status: 404 }
      )
    }
    
    const imported = []
    const errors = []
    
    // Process each resource
    for (const resource of resources) {
      try {
        // Process the resource file/content
        const processed = await ResourceProcessor.processFile(
          resource.path || resource.name || 'unknown',
          resource.content,
          {
            sourceUrl: resource.url,
            sourceRepo: resource.repo,
            author: resource.author,
            authorGithub: resource.authorGithub,
            license: resource.license,
            sourceId: sourceId
          }
        )
        
        // Generate unique slug
        const baseSlug = processed.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        
        let slug = baseSlug
        let counter = 0
        
        // Check for existing slug
        while (await prisma.resource.findUnique({ where: { slug } })) {
          counter++
          slug = `${baseSlug}-${counter}`
        }
        
        // Create the resource in database
        const created = await prisma.resource.create({
          data: {
            slug,
            title: processed.title,
            description: processed.description,
            content: processed.content,
            rawContent: processed.rawContent,
            fileType: processed.fileType,
            type: processed.type,
            category: processed.category,
            tags: processed.tags,
            keywords: processed.keywords,
            author: processed.author || 'community',
            authorGithub: processed.authorGithub,
            sourceUrl: processed.sourceUrl,
            sourceRepo: processed.sourceRepo,
            sourceId: sourceId,
            license: processed.license,
            metadata: processed.metadata,
            publishedAt: new Date()
          }
        })
        
        imported.push({
          id: created.id,
          title: created.title,
          slug: created.slug
        })
      } catch (error) {
        console.error('Failed to import resource:', resource.name, error)
        errors.push({
          resource: resource.name || 'unknown',
          error: error.message
        })
      }
    }
    
    // Update the knowledge source last scraped time
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { lastScraped: new Date() }
    })
    
    // Create a knowledge update record
    await prisma.knowledgeUpdate.create({
      data: {
        sourceId,
        content: {
          imported: imported.length,
          errors: errors.length,
          resources: imported
        },
        processed: true,
        patternsFound: imported.length,
        processedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      imported: imported.length,
      failed: errors.length,
      resources: imported,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import resources' },
      { status: 500 }
    )
  }
}