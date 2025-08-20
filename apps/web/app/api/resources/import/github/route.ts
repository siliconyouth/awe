import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import { auth } from '@clerk/nextjs/server'
import { ResourceManager } from '@awe/ai'
import { z } from 'zod'
import { ResourceType, ResourceStatus } from '@awe/shared'

const importSchema = z.object({
  url: z.string().url(),
  options: z.object({
    branch: z.string().default('main'),
    path: z.string().optional(),
    type: z.nativeEnum(ResourceType).default(ResourceType.PATTERN),
    autoTag: z.boolean().default(true),
    qualityCheck: z.boolean().default(true),
    includeTests: z.boolean().default(false),
    maxFiles: z.number().max(100).default(20)
  }).optional()
})

// POST /api/resources/import/github - Import resources from GitHub
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { url, options = {} } = importSchema.parse(body)
    
    // Parse GitHub URL
    const urlParts = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!urlParts) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
    }
    
    const [, owner, repo] = urlParts
    const branch = options.branch || 'main'
    const path = options.path || ''
    
    // Fetch repository contents
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add GitHub token if available
        ...(process.env.GITHUB_TOKEN ? {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        } : {})
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch repository contents',
        details: await response.text()
      }, { status: 500 })
    }
    
    const contents = await response.json()
    
    // Filter files based on type and options
    const files = Array.isArray(contents) ? contents : [contents]
    const relevantFiles = files.filter(file => {
      if (file.type !== 'file') return false
      
      const name = file.name.toLowerCase()
      const isTest = name.includes('test') || name.includes('spec')
      
      if (!options.includeTests && isTest) return false
      
      // Filter by extension based on resource type
      const validExtensions = {
        [ResourceType.PATTERN]: ['.ts', '.tsx', '.js', '.jsx', '.md'],
        [ResourceType.HOOK]: ['.ts', '.tsx', '.js', '.jsx'],
        [ResourceType.AGENT]: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        [ResourceType.TEMPLATE]: ['.md', '.mdx', '.json', '.yaml', '.yml'],
        [ResourceType.GUIDE]: ['.md', '.mdx'],
        [ResourceType.SNIPPET]: ['.ts', '.tsx', '.js', '.jsx', '.sh', '.bash']
      }
      
      const extensions = validExtensions[options.type as ResourceType] || ['.md', '.ts', '.js']
      return extensions.some(ext => name.endsWith(ext))
    }).slice(0, options.maxFiles || 20)
    
    const manager = new ResourceManager()
    const importedResources = []
    
    // Process each file
    for (const file of relevantFiles) {
      try {
        // Fetch file content
        const fileResponse = await fetch(file.download_url)
        const content = await fileResponse.text()
        
        // Process with AI if enabled
        let processedResource = {
          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          description: `Imported from ${owner}/${repo}`,
          content,
          type: options.type || ResourceType.PATTERN,
          format: file.name.endsWith('.md') ? 'markdown' :
                  file.name.endsWith('.yml') || file.name.endsWith('.yaml') ? 'yaml' :
                  file.name.endsWith('.json') ? 'json' :
                  file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? 'typescript' :
                  file.name.endsWith('.sh') || file.name.endsWith('.bash') ? 'shell' :
                  'text',
          sourceUrl: file.html_url,
          author: owner,
          tags: [],
          qualityScore: 0.7
        }
        
        if (options.autoTag || options.qualityCheck) {
          const analysis = await manager.analyzeResource(content, {
            type: options.type,
            generateTags: options.autoTag,
            assessQuality: options.qualityCheck
          })
          
          if (analysis.tags) processedResource.tags = analysis.tags
          if (analysis.qualityScore) processedResource.qualityScore = analysis.qualityScore
          if (analysis.title) processedResource.title = analysis.title
          if (analysis.description) processedResource.description = analysis.description
        }
        
        // Save to database
        const resource = await prisma.resource.create({
          data: {
            title: processedResource.title,
            description: processedResource.description,
            content: processedResource.content,
            type: processedResource.type as any,
            format: processedResource.format as any,
            status: ResourceStatus.PUBLISHED as any,
            visibility: 'public' as any,
            sourceUrl: processedResource.sourceUrl,
            author: processedResource.author,
            qualityScore: processedResource.qualityScore,
            importedBy: userId,
            tags: processedResource.tags.length > 0 ? {
              create: await Promise.all(
                processedResource.tags.map(async (tagName: string) => {
                  const tag = await prisma.tag.upsert({
                    where: { name: tagName },
                    create: { 
                      name: tagName,
                      type: 'ai' as any,
                      category: 'imported' as any
                    },
                    update: {}
                  })
                  
                  return {
                    tagId: tag.id,
                    confidence: 0.8,
                    addedBy: 'system'
                  }
                })
              )
            } : undefined
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        })
        
        importedResources.push(resource)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: importedResources.length,
      resources: importedResources,
      repository: {
        owner,
        repo,
        branch,
        path
      }
    })
  } catch (error) {
    console.error('Error importing from GitHub:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to import from GitHub' }, { status: 500 })
  }
}