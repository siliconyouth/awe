import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@awe/database'
import JSZip from 'jszip'

// GET /api/collections/[id]/export - Export collection as ZIP
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'zip'
    
    // Fetch collection with all resources
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            resource: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })
    
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    
    // Check if collection is public
    if (!collection.isPublic) {
      return NextResponse.json({ error: 'Collection is private' }, { status: 403 })
    }
    
    if (format === 'json') {
      // Export as JSON
      const exportData = {
        collection: {
          name: collection.name,
          description: collection.description,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt
        },
        resources: collection.resources.map(({ resource }) => ({
          title: resource.title,
          description: resource.description,
          type: resource.type,
          format: resource.format,
          content: resource.content,
          tags: resource.tags.map(t => t.tag.name),
          author: resource.author,
          sourceUrl: resource.sourceUrl,
          qualityScore: resource.qualityScore
        }))
      }
      
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="${collection.name.replace(/\s+/g, '-')}.json"`
        }
      })
    }
    
    if (format === 'markdown') {
      // Export as single markdown file
      let markdown = `# ${collection.name}\n\n`
      
      if (collection.description) {
        markdown += `${collection.description}\n\n`
      }
      
      markdown += `---\n\n`
      
      collection.resources.forEach(({ resource }) => {
        markdown += `## ${resource.title}\n\n`
        
        if (resource.description) {
          markdown += `${resource.description}\n\n`
        }
        
        markdown += `**Type:** ${resource.type} | **Format:** ${resource.format}\n\n`
        
        if (resource.tags.length > 0) {
          markdown += `**Tags:** ${resource.tags.map(t => t.tag.name).join(', ')}\n\n`
        }
        
        markdown += '```' + (resource.format === 'markdown' ? 'md' : resource.format) + '\n'
        markdown += resource.content
        markdown += '\n```\n\n'
        
        if (resource.sourceUrl) {
          markdown += `[Source](${resource.sourceUrl})\n\n`
        }
        
        markdown += `---\n\n`
      })
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${collection.name.replace(/\s+/g, '-')}.md"`
        }
      })
    }
    
    // Default: Export as ZIP
    const zip = new JSZip()
    
    // Add collection info
    const info = {
      name: collection.name,
      description: collection.description,
      exportedAt: new Date().toISOString(),
      resourceCount: collection.resources.length
    }
    zip.file('collection.json', JSON.stringify(info, null, 2))
    
    // Add README
    let readme = `# ${collection.name}\n\n`
    if (collection.description) {
      readme += `${collection.description}\n\n`
    }
    readme += `## Resources\n\n`
    readme += `This collection contains ${collection.resources.length} resources.\n\n`
    
    // Add each resource
    collection.resources.forEach(({ resource }, index) => {
      const filename = `${String(index + 1).padStart(3, '0')}-${resource.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
      const extension = resource.format === 'markdown' ? 'md' : 
                        resource.format === 'yaml' ? 'yml' :
                        resource.format === 'typescript' ? 'ts' :
                        resource.format === 'shell' ? 'sh' :
                        resource.format
      
      // Add resource file
      zip.file(`resources/${filename}.${extension}`, resource.content)
      
      // Add to README
      readme += `### ${index + 1}. ${resource.title}\n`
      readme += `- Type: ${resource.type}\n`
      readme += `- Format: ${resource.format}\n`
      readme += `- File: resources/${filename}.${extension}\n\n`
      
      // Add metadata
      const metadata = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        format: resource.format,
        tags: resource.tags.map(t => t.tag.name),
        author: resource.author,
        sourceUrl: resource.sourceUrl,
        qualityScore: resource.qualityScore
      }
      zip.file(`metadata/${filename}.json`, JSON.stringify(metadata, null, 2))
    })
    
    zip.file('README.md', readme)
    
    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${collection.name.replace(/\s+/g, '-')}.zip"`
      }
    })
  } catch (error) {
    console.error('Error exporting collection:', error)
    return NextResponse.json({ error: 'Failed to export collection' }, { status: 500 })
  }
}