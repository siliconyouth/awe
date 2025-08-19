/**
 * Setup script to create knowledge sources for Resource Hub
 * Run this to initialize sources like awesome-claude-code
 */

import { prisma } from '@awe/database'

async function setupResourceSources() {
  console.log('Setting up Resource Hub knowledge sources...')
  
  const sources = [
    {
      name: 'awesome-claude-code',
      type: 'github',
      url: 'https://github.com/hesreallyhim/awesome-claude-code',
      scrapeConfig: {
        type: 'github-repo',
        owner: 'hesreallyhim',
        repo: 'awesome-claude-code',
        paths: [
          'README.md',
          'slash-commands/**/*.md',
          'hooks/**/*.md',
          'hooks/**/*.sh',
          'workflows/**/*.md',
          'statusline/**/*.md',
          'tooling/**/*.md',
          'CLAUDE_files/**/*.md'
        ],
        branch: 'main'
      },
      frequency: 'weekly',
      active: true,
      reliability: 0.95
    },
    {
      name: 'claude-official-docs',
      type: 'website',
      url: 'https://docs.anthropic.com/claude/docs',
      scrapeConfig: {
        type: 'docs-site',
        baseUrl: 'https://docs.anthropic.com',
        paths: [
          '/claude/docs/claude-code',
          '/claude/docs/context-engineering',
          '/claude/docs/best-practices'
        ]
      },
      frequency: 'weekly',
      active: true,
      reliability: 1.0
    },
    {
      name: 'community-patterns',
      type: 'github',
      url: 'https://github.com/topics/claude-code',
      scrapeConfig: {
        type: 'github-topic',
        topic: 'claude-code',
        filters: {
          minStars: 10,
          language: ['markdown', 'typescript', 'javascript'],
          hasClaudeMd: true
        }
      },
      frequency: 'daily',
      active: true,
      reliability: 0.7
    }
  ]
  
  for (const source of sources) {
    try {
      // Check if source already exists
      const existing = await prisma.knowledgeSource.findUnique({
        where: { name: source.name }
      })
      
      if (existing) {
        console.log(`Source "${source.name}" already exists, updating...`)
        await prisma.knowledgeSource.update({
          where: { name: source.name },
          data: {
            ...source,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`Creating source "${source.name}"...`)
        await prisma.knowledgeSource.create({
          data: source
        })
      }
      
      console.log(`✓ ${source.name} configured`)
    } catch (error) {
      console.error(`Failed to setup ${source.name}:`, error)
    }
  }
  
  console.log('\nResource Hub knowledge sources setup complete!')
}

// Run if called directly
if (require.main === module) {
  setupResourceSources()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}

export { setupResourceSources }